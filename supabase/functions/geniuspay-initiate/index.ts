import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:cors});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({success:false,error:"Méthode non autorisée"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,secret=Deno.env.get("GENIUSPAY_SECRET_KEY"),publicKey=Deno.env.get("GENIUSPAY_PUBLIC_KEY");
  if(!secret||!publicKey)return json({success:false,error:"GeniusPay incomplet : ajoutez GENIUSPAY_PUBLIC_KEY (pk_live_...) et GENIUSPAY_SECRET_KEY (sk_live_...) dans Supabase."},503);
  const auth=req.headers.get("Authorization")||"",userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:uerr}=await userClient.auth.getUser();if(uerr||!user)return json({success:false,error:"Session expirée. Reconnectez-vous."},401);
  const db=createClient(url,service),body=await req.json(),orderId=String(body.orderId||"");
  if(!orderId||!body.paymentPhone)return json({success:false,error:"Commande et numéro de téléphone requis."},400);
  const {data:order,error}=await db.from("orders").select("*").eq("id",orderId).single();
  if(error||!order)return json({success:false,error:"Commande introuvable."},404);
  if(order.user_id!==user.id)return json({success:false,error:"Accès refusé à cette commande."},403);
  if(order.status!=="pending")return json({success:false,error:"Cette commande n'est plus en attente de paiement."},409);
  if(Date.now()>Date.parse(order.reservation_expires_at)){await db.from("orders").update({status:"cancelled"}).eq("id",orderId);return json({success:false,error:"Le délai de réservation a expiré."},400);}
  const phone=(String(body.countryCode||order.country_code||"+225")+String(body.paymentPhone).replace(/\s+/g,"")).replace(/[^+\d]/g,"");
  const reference="MLDK_"+Date.now()+"_"+crypto.randomUUID().slice(0,8).toUpperCase();
  const payload={amount:Number(order.total_amount),currency:"XOF",description:"Billets MALEDIKE PARTY 2026 - "+orderId,reference,customer:{name:order.buyer_name,email:order.buyer_email,phone},metadata:{order_id:order.id,user_id:order.user_id,quantity:String(order.quantity),event:"MALEDIKE PARTY 2026"},success_url:"https://maledike-app.vercel.app/?payment=return&orderId="+order.id,error_url:"https://maledike-app.vercel.app/?payment=error&orderId="+order.id};
  const response=await fetch("https://geniuspay.ci/api/v1/merchant/payments",{method:"POST",headers:{"X-API-Key":publicKey,"X-API-Secret":secret,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const gateway=await response.json().catch(()=>({}));
  if(!response.ok||gateway?.success===false){console.error("GeniusPay rejected",response.status,gateway);return json({success:false,error:gateway?.message||gateway?.error||"GeniusPay a refusé la création du paiement (HTTP "+response.status+")."},502);}
  const data=gateway?.data||gateway,checkoutUrl=data.checkout_url||data.checkoutUrl||data.payment_url||data.url;
  if(typeof checkoutUrl!=="string"||!checkoutUrl.startsWith("https://")){console.error("GeniusPay response without checkout URL",gateway);return json({success:false,error:"GeniusPay n'a pas fourni de checkout_url. Vérifiez les clés et le mode Live."},502);}
  const txref=data.reference||reference;
  const {error:updateError}=await db.from("orders").update({payment_method:"geniuspay_checkout",payment_phone:phone,transaction_reference:txref,checkout_url:checkoutUrl}).eq("id",orderId);
  if(updateError){console.error("order update",updateError);return json({success:false,error:"Paiement initié mais impossible de sauvegarder sa référence."},500);}
  return json({success:true,checkoutUrl,session:{transactionId:txref,checkoutUrl,amount:order.total_amount,currency:"XOF",orderId,env:"production"}});
 }catch(e){console.error("payment init",e);return json({success:false,error:"Erreur interne lors de l'initialisation du paiement."},500);}
});