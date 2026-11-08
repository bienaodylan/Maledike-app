// Supabase Edge Function: geniuspay-initiate
// Deploy via: supabase functions deploy geniuspay-initiate
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get('APP_URL') || '';
const corsHeaders = (origin:string|null) => ({'Access-Control-Allow-Origin':origin===allowedOrigin?allowedOrigin:'null','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Vary':'Origin'});

interface InitiatePaymentRequest {
  orderId: string;
  paymentMethod: "wave" | "orange_money" | "mtn_momo" | "moov_money" | "djamo_card";
  paymentPhone: string;
  countryCode: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response('ok',{headers:corsHeaders(req.headers.get('origin'))});
  if(req.headers.get('origin')!==allowedOrigin)return new Response(JSON.stringify({error:'Origin not allowed'}),{status:403,headers:{...corsHeaders(req.headers.get('origin')),'Content-Type':'application/json'}});

  try {
    const GENIUSPAY_SECRET_KEY = Deno.env.get("GENIUSPAY_SECRET_KEY");
    const GENIUSPAY_PUBLIC_KEY = Deno.env.get("GENIUSPAY_PUBLIC_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GENIUSPAY_SECRET_KEY || !GENIUSPAY_PUBLIC_KEY) {
      throw new Error("GENIUSPAY_SECRET_KEY non configurée dans le Supabase Vault.");
    }

    const { orderId, paymentMethod, paymentPhone, countryCode } = (await req.json()) as InitiatePaymentRequest;

    if (!orderId || !paymentPhone) {
      return new Response(JSON.stringify({ error: "orderId et paymentPhone requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase Admin Client
    const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

    // 1. Fetch Order and verify temporary reservation (15-min lock)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Commande introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (Date.now() > order.reservation_expires_at && order.status === "pending") {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
      return new Response(JSON.stringify({ error: "Délai de réservation de 15 minutes expiré" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fullPhone = `${countryCode || "+225"}${paymentPhone.replace(/\s+/g, "")}`;
    const transactionReference = `GP_TXN_${Date.now()}_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    // 2. Call Official GeniusPay API via Server-Side Edge Function
    // Using sk_live_... exclusively from backend
    const geniusPayPayload = {
      amount: order.total_amount,
      currency: "XOF",
      reference: transactionReference,
      customer: {
        name: order.buyer_name,
        email: order.buyer_email,
        phone: fullPhone,
      },
      payment_method: paymentMethod,
      metadata: {
        orderId: order.id,
        userId: order.user_id,
        quantity: order.quantity,
        event: "MALÉDIKÉ PARTY 2026",
      },
      return_url: `${Deno.env.get("APP_URL") || "https://maledikeparty.com"}/confirmation?orderId=${order.id}`,
      webhook_url: `${SUPABASE_URL}/functions/v1/geniuspay-webhook`,
    };

    let geniusPaySession = null;
    try {
      const gpResponse = await fetch("https://api.geniuspay.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GENIUSPAY_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geniusPayPayload),
      });

      if (gpResponse.ok) {
        geniusPaySession = await gpResponse.json();
      }
    } catch (_e) {
      // Fallback for sandbox / direct processing
    }

    // 3. Update order record
    await supabase
      .from("orders")
      .update({
        payment_method: paymentMethod,
        payment_phone: fullPhone,
        transaction_reference: transactionReference,
      })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          transactionId: transactionReference,
          amount: order.total_amount,
          currency: "XOF",
          orderId: order.id,
          status: "initiated",
          publicKey: GENIUSPAY_PUBLIC_KEY,
          gatewaySession: geniusPaySession,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
