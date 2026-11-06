import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods":"POST, OPTIONS", "Content-Type":"application/json" };
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const prices:Record<string,number>={pass_vip:10000,salon_twerk:50000,salon_pole_dance:100000,salon_sexy_nana:150000};
const names:Record<string,string>={pass_vip:"Passe-Entrée Unique VIP",salon_twerk:"Salon Twerk",salon_pole_dance:"Salon Pole Dance",salon_sexy_nana:"Salon Sexy Nana"};
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({success:false,error:"Méthode non autorisée"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")!, anon=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader=req.headers.get("Authorization")||"";
  const userClient=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});
  const {data:{user},error:userErr}=await userClient.auth.getUser();
  if(userErr||!user)return json({success:false,error:"Session expirée. Reconnectez-vous."},401);
  const db=createClient(url,service);
  const body=await req.json();
  const category=String(body.category||"pass_vip");
  const quantity=Number(body.quantity);
  if(!prices[category]||!Number.isInteger(quantity)||quantity<1||quantity>10)return json({success:false,error:"Catégorie ou quantité invalide."},400);
  const {data:profile}=await db.from("profiles").select("first_name,last_name,whatsapp_number,country_code").eq("id",user.id).maybeSingle();
  const buyerName=String(body.buyerName||[profile?.first_name,profile?.last_name].filter(Boolean).join(" ")).trim();
  const buyerEmail=user.email||String(body.buyerEmail||"");
  const buyerWhatsApp=String(body.buyerWhatsApp||profile?.whatsapp_number||"").trim();
  if(!buyerName||!buyerEmail||!buyerWhatsApp)return json({success:false,error:"Complétez votre nom et votre numéro WhatsApp dans votre compte."},400);
  const ids=Array.isArray(body.digitalProductIds)?body.digitalProductIds.filter((x:string)=>typeof x==="string").slice(0,20):[];
  let addons=0;
  if(ids.length){const {data:products,error}=await db.from("digital_products").select("id,price").eq("is_active",true).in("id",ids);if(error)return json({success:false,error:"Impossible de vérifier les produits numériques."},500);addons=(products||[]).reduce((s:number,p:any)=>s+Number(p.price||0),0);}
  const unit=prices[category],total=unit*quantity+addons;
  const orderId=crypto.randomUUID(),expires=new Date(Date.now()+15*60*1000).toISOString();
  const row={id:orderId,user_id:user.id,buyer_name:buyerName,buyer_email:buyerEmail,buyer_whatsapp:buyerWhatsApp,country_code:String(body.countryCode||profile?.country_code||"+225"),quantity,unit_price:unit,total_amount:total,currency:"FCFA",payment_method:"pending",status:"pending",reservation_expires_at:expires,digital_product_ids:ids};
  const {error}=await db.from("orders").insert(row);
  if(error){console.error("order insert",error);return json({success:false,error:"La réservation n'a pas pu être créée. Réessayez."},500);}
  return json({success:true,order:{id:orderId,userId:user.id,buyerName,buyerEmail,buyerWhatsApp,countryCode:row.country_code,quantity,unitPrice:unit,totalAmount:total,currency:"FCFA",paymentMethod:"pending",status:"pending",reservationExpiresAt:Date.parse(expires),createdAt:new Date().toISOString(),digitalProductIds:ids,category,categoryName:names[category]},env:"production"});
 }catch(e){console.error(e);return json({success:false,error:"Erreur interne lors de la réservation."},500);}
});