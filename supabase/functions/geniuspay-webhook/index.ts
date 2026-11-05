// Supabase Edge Function: geniuspay-webhook
// Deploy via: supabase functions deploy geniuspay-webhook
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Helper: Constant-time string comparison against timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-geniuspay-signature") || "";
    const GENIUSPAY_SECRET_KEY = Deno.env.get("GENIUSPAY_SECRET_KEY") || "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // 1. Webhook Signature Verification (HMAC-SHA256)
    if (signature && GENIUSPAY_SECRET_KEY) {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(GENIUSPAY_SECRET_KEY),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const computedBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
      const computedHex = Array.from(new Uint8Array(computedBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (!timingSafeEqual(computedHex, signature)) {
        console.error("Invalid GeniusPay signature rejected.");
        return new Response("Signature Invalid", { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    // Expected event: "payment.succeeded" or status === "success"
    const orderId = data?.metadata?.orderId || data?.orderId || payload.orderId;
    const paymentStatus = data?.status || payload.status;

    if (!orderId || (paymentStatus !== "success" && event !== "payment.succeeded")) {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Fetch Order with Idempotency Guard
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error(`Order ${orderId} not found.`);
      return new Response(JSON.stringify({ error: "Order not found" }), { status: 404 });
    }

    // Idempotency: If already completed, do not issue duplicate tickets
    if (order.status === "completed") {
      return new Response(JSON.stringify({ message: "Order already fulfilled" }), { status: 200 });
    }

    // 3. Mark Order as Completed
    await supabase
      .from("orders")
      .update({
        status: "completed",
        transaction_reference: data?.reference || payload.reference || order.transaction_reference,
        completed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // 4. Generate Cryptographically Signed Digital Tickets
    const { count: existingCount } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true });

    const totalTicketsBefore = existingCount || 0;
    const newTickets = [];

    for (let i = 0; i < order.quantity; i++) {
      const seq = (totalTicketsBefore + i + 1).toString().padStart(4, "0");
      const ticketNumber = `MLDK-2026-${seq}`;
      const ticketId = `tkt_${Date.now()}_${i}_${crypto.randomUUID().slice(0, 6)}`;

      // Cryptographic SHA-256 Token with Salt
      const salt = GENIUSPAY_SECRET_KEY.slice(-12);
      const rawToken = `${ticketId}:${order.user_id}:${order.buyer_email}:${Date.now()}:${salt}`;
      const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawToken));
      const qrTokenHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      newTickets.push({
        id: ticketId,
        ticket_number: ticketNumber,
        order_id: order.id,
        user_id: order.user_id,
        attendee_name: order.buyer_name,
        attendee_email: order.buyer_email,
        attendee_phone: order.buyer_whatsapp,
        event_title: "MALÉDIKÉ PARTY",
        event_date: "28 Novembre 2026",
        event_time: "23H00 — 06H00",
        price: order.unit_price,
        qr_token_hash: qrTokenHash,
        status: "confirmed",
        created_at: new Date().toISOString(),
      });
    }

    const { error: ticketInsertError } = await supabase.from("tickets").insert(newTickets);
    if (ticketInsertError) {
      console.error("Failed to insert tickets:", ticketInsertError);
      return new Response(JSON.stringify({ error: "Ticket creation failed" }), { status: 500 });
    }

    console.log(`Successfully generated ${newTickets.length} tickets for order ${orderId}`);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        ticketsCount: newTickets.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
