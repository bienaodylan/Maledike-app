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
  if(!["completed","success"].includes(String(data.status||"").toLowerCase()))return json({error:"Payment status is not completed"},400);
  const amount=Number(data.amount);if(!Number.isFinite(amount)||String(data.currency||"XOF").toUpperCase()!=="XOF")return json({error:"Invalid payment amount or currency"},400);
  const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const {data:result,error}=await db.rpc("fulfill_geniuspay_order",{p_order_id:orderId,p_reference:String(data.reference||""),p_amount:amount});
  if(error){console.error("fulfill order RPC",error);if(error.message?.includes("ORDER_NOT_FOUND"))return json({error:"Order not found"},404);if(error.message?.includes("AMOUNT_MISMATCH"))return json({error:"Payment amount mismatch"},400);if(error.message?.includes("ORDER_EXPIRED"))return json({error:"Order expired"},400);return json({error:"Atomic order fulfillment failed"},500);}
  return json({success:true,orderId,ticketsCount:result?.tickets_count||0,alreadyCompleted:!!result?.already_completed});
 }catch(e){console.error("Webhook error",e);return json({error:"Webhook processing error"},500);}
});