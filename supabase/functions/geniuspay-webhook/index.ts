import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type, x-webhook-signature, x-webhook-timestamp, x-webhook-event, x-webhook-environment","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:cors});
function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0;}
async function hmac(secret:string,message:string){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message)));return Array.from(bytes).map(x=>x.toString(16).padStart(2,"0")).join("");}
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 try{
  const raw=await req.text(),signature=req.headers.get("X-Webhook-Signature")||"",timestamp=req.headers.get("X-Webhook-Timestamp")||"",secret=Deno.env.get("GENIUSPAY_WEBHOOK_SECRET")||"";
  if(!secret)return json({error:"Webhook secret not configured"},503);
  if(!signature||!timestamp||!/^\d+$/.test(timestamp)||Math.abs(Date.now()/1000-Number(timestamp))>300)return json({error:"Missing or expired webhook signature"},401);
  if(!safeEqual(await hmac(secret,timestamp+"."+raw),signature))return json({error:"Invalid webhook signature"},401);
  const payload=JSON.parse(raw),event=String(payload.event||req.headers.get("X-Webhook-Event")||""),data=payload.data||{};
  if(event!=="payment.success")return json({received:true,ignored:true,event});
  if(data.status!=="completed")return json({error:"Payment status is not completed"},400);
  const orderId=String(data.metadata?.order_id||data.metadata?.orderId||"");if(!orderId)return json({error:"Missing order_id in metadata"},400);
  const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!),{data:order,error}=await db.from("orders").select("*").eq("id",orderId).single();
  if(error||!order)return json({error:"Order not found"},404);
  if(order.status==="completed")return json({received:true,message:"Order already fulfilled"});
  if(!Number.isFinite(Number(data.amount))||Number(data.amount)!==Number(order.total_amount)||String(data.currency||"XOF").toUpperCase()!=="XOF")return json({error:"Payment amount/currency mismatch"},400);
  const {error:updateError}=await db.from("orders").update({status:"completed",transaction_reference:data.reference||order.transaction_reference,completed_at:new Date().toISOString()}).eq("id",orderId).eq("status","pending");
  if(updateError)return json({error:"Order update failed"},500);
  const {count}=await db.from("tickets").select("*",{count:"exact",head:true}),tickets=[],now=Date.now();
  for(let i=0;i<Number(order.quantity);i++){
   const ticketId="tkt_"+now+"_"+i+"_"+crypto.randomUUID().slice(0,6),seq=String((count||0)+i+1).padStart(4,"0");
   const token=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(ticketId+":"+order.user_id+":"+order.buyer_email+":"+crypto.randomUUID()));
   const hash=Array.from(new Uint8Array(token)).map(x=>x.toString(16).padStart(2,"0")).join("");
   tickets.push({id:ticketId,ticket_number:"MLDK-2026-"+seq,order_id:order.id,user_id:order.user_id,attendee_name:order.buyer_name,attendee_email:order.buyer_email,attendee_phone:order.buyer_whatsapp,event_title:"MALÉDIKÉ PARTY",event_date:"28 Novembre 2026",event_time:"23H00 — 06H00",price:order.unit_price,qr_token_hash:hash,status:"confirmed",created_at:new Date().toISOString()});
  }
  const {error:insertError}=await db.from("tickets").insert(tickets);
  if(insertError){console.error("ticket insertion failed",insertError);await db.from("orders").update({status:"pending"}).eq("id",orderId);return json({error:"Ticket creation failed"},500);}
  return json({success:true,orderId,ticketsCount:tickets.length});
 }catch(e){console.error("Webhook error",e);return json({error:"Webhook processing error"},500);}
});