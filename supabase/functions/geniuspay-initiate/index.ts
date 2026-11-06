import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:cors});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({success:false,error:"Méthode non autorisée"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,secret=Deno.env.get("GENIUSPAY_SECRET_KEY");
  if(!secret)return json({success:false,error:"Paiement indisponible : la clé secrète GeniusPay n'est pas configurée côté Supabase."},503);
  const auth=req.headers.get("Authorization")||"",userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:uerr}=await userClient.auth.getUser();if(uerr||!user)return json({success:false,error:"Session expirée. Reconnectez-vous."},401);
  const db=createClient(url,service),body=await req.json(),orderId=String(body.orderId||"");
  if(!orderId||!body.paymentPhone)return json({success:false,error:"Commande et numéro de téléphone requis."},400);
  const {data:order,error}=await db.from("orders").select("*").eq("id",orderId).single();
  if(error||!order)return json({success:false,error:"Commande introuvable."},404);
  if(order.user_id!==user.id)return json({success:false,error:"Accès refusé à cette commande."},403);
  if(order.status!=="pending")return json({success:false,error:"Cette commande n'est plus en attente de paiement."},409);
  if(Date.now()>Date.parse(order.reservation_expires_at)){await db.from("orders").update({status:"cancelled"}).eq("id",orderId);return json({success:false,error:"Le délai de réservation a expiré."},400);}
  const allowed=["wave","orange_money","mtn_momo","moov_money","djamo_card"];if(!allowed.includes(body.paymentMethod))return json({success:false,error:"Moyen de paiement non reconnu."},400);
  const phone=(String(body.countryCode||order.country_code||"+225")+String(body.paymentPhone).replace(/\s+/g,"")).replace(/[^+\d]/g,"");
  const reference="MLDK_"+Date.now()+"_"+crypto.randomUUID().slice(0,8).toUpperCase();
  const payload={amount:order.total_amount,currency:"XOF",reference,customer:{name:order.buyer_name,email:order.buyer_email,phone},payment_method:body.paymentMethod,metadata:{orderId:order.id,userId:order.user_id,quantity:order.quantity,event:"MALEDIKE PARTY 2026"},return_url:(Deno.env.get("APP_URL")||"https://maledike-app.vercel.app")+"/?payment=return&orderId="+order.id,webhook_url:url+"/functions/v1/geniuspay-webhook"};
  const response=await fetch("https://api.geniuspay.com/v1/payments",{method:"POST",headers:{Authorization:"Bearer "+secret,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const gateway=await response.json().catch(()=>({}));
  if(!response.ok){console.error("GeniusPay rejected",response.status,gateway);return json({success:false,error:gateway?.message||gateway?.error||"GeniusPay a refusé la création du paiement (HTTP "+response.status+")."},502);}
  const checkoutUrl=gateway.checkout_url||gateway.checkoutUrl||gateway.url||gateway.data?.checkout_url||gateway.data?.checkoutUrl||gateway.data?.url||gateway.payment?.checkout_url;
  if(typeof checkoutUrl!=="string"||!checkoutUrl.startsWith("https://")){console.error("GeniusPay response without checkout URL",gateway);return json({success:false,error:"GeniusPay n'a pas fourni de lien de paiement. Vérifiez la configuration/API GeniusPay."},502);}
  await db.from("orders").update({payment_method:body.paymentMethod,payment_phone:phone,transaction_reference:gateway.reference||reference,checkout_url:checkoutUrl}).eq("id",orderId);
  return json({success:true,checkoutUrl,session:{transactionId:gateway.reference||reference,checkoutUrl,amount:order.total_amount,currency:"XOF",orderId,env:"production"}});
 }catch(e){console.error("payment init",e);return json({success:false,error:"Erreur interne lors de l'initialisation du paiement."},500);}
});