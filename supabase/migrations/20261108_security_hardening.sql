-- Security hardening RPC baseline captured from live Supabase on 2026-11-08.
-- Required tables, ticket sequence and pgcrypto already exist; preserve audited function bodies here.

CREATE OR REPLACE FUNCTION public.checkin_ticket_atomic(p_qr_token_hash text, p_scanner_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE a public.scanner_tokens%ROWTYPE; t public.tickets%ROWTYPE; changed_count INTEGER;
BEGIN
 SELECT * INTO a FROM scanner_tokens WHERE token=p_scanner_token AND is_active=true FOR UPDATE;
 IF NOT FOUND THEN
  INSERT INTO scanner_scan_history(scan_result,details) VALUES ('invalid_agent','{"reason":"token_invalid"}');
  RETURN jsonb_build_object('success',false,'error','INVALID_AGENT','message','Accès agent non autorisé');
 END IF;
 SELECT * INTO t FROM tickets WHERE qr_token_hash=p_qr_token_hash FOR UPDATE;
 IF NOT FOUND THEN
  INSERT INTO scanner_scan_history(scanner_token_id,agent_name,gate_name,scan_result) VALUES(a.id,a.agent_name,a.gate_name,'not_found');
  RETURN jsonb_build_object('success',false,'error','NOT_FOUND','message','Billet introuvable');
 END IF;
 IF t.status='cancelled' THEN
  INSERT INTO scanner_scan_history(ticket_id,ticket_number,scanner_token_id,agent_name,gate_name,scan_result) VALUES(t.id,t.ticket_number,a.id,a.agent_name,a.gate_name,'cancelled');
  RETURN jsonb_build_object('success',false,'error','CANCELLED','message','Billet annulé','ticket',to_jsonb(t));
 END IF;
 IF t.status='checked_in' THEN
  INSERT INTO scanner_scan_history(ticket_id,ticket_number,scanner_token_id,agent_name,gate_name,scan_result,details) VALUES(t.id,t.ticket_number,a.id,a.agent_name,a.gate_name,'already_used',jsonb_build_object('checked_in_at',t.checked_in_at));
  RETURN jsonb_build_object('success',false,'error','ALREADY_USED','message','Billet déjà scanné','ticket',to_jsonb(t),'alreadyCheckedInAt',t.checked_in_at);
 END IF;
 UPDATE tickets SET status='checked_in',checked_in_at=now(),checked_in_by_agent=a.agent_name||' ('||a.gate_name||')' WHERE id=t.id AND status='confirmed' RETURNING * INTO t;
 GET DIAGNOSTICS changed_count=ROW_COUNT;
 IF changed_count=0 THEN RETURN jsonb_build_object('success',false,'error','ALREADY_USED','message','Billet déjà utilisé'); END IF;
 UPDATE scanner_tokens SET scan_count=scan_count+1,last_used_at=now() WHERE id=a.id;
 INSERT INTO scanner_scan_history(ticket_id,ticket_number,scanner_token_id,agent_name,gate_name,scan_result) VALUES(t.id,t.ticket_number,a.id,a.agent_name,a.gate_name,'accepted');
 INSERT INTO audit_logs(id,action,details,timestamp) VALUES('scan_'||gen_random_uuid()::text,'TICKET_CHECKED_IN',jsonb_build_object('ticketNumber',t.ticket_number,'agent',a.agent_name,'gate',a.gate_name),now());
 RETURN jsonb_build_object('success',true,'message','ACCÈS VALIDÉ ! Passe VIP autorisé.','ticket',to_jsonb(t));
END $function$
;

CREATE OR REPLACE FUNCTION public.create_order_atomic(p_user_id text, p_category text, p_quantity integer, p_buyer_name text, p_buyer_email text, p_buyer_whatsapp text, p_country_code text, p_digital_ids jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  ev public.event_config%rowtype; unit integer; cname text; sold integer; held integer;
  addons integer := 0; found_n integer; req_n integer; ids jsonb; total integer; oid text; exp timestamptz; pend integer;
begin
  perform pg_advisory_xact_lock(hashtext('maledike_capacity'));
  select * into ev from public.event_config where id = 'maledike-party-2026';
  if not found then raise exception 'EVENT_NOT_FOUND'; end if;
  if p_user_id is null or length(p_user_id) = 0 then raise exception 'UNAUTHENTICATED'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 10 then raise exception 'INVALID_QUANTITY'; end if;
  if coalesce(length(trim(p_buyer_name)),0) < 2 or length(p_buyer_name) > 120 then raise exception 'INVALID_BUYER'; end if;
  if coalesce(length(trim(p_buyer_whatsapp)),0) < 6 or length(p_buyer_whatsapp) > 25 then raise exception 'INVALID_BUYER'; end if;
  if coalesce(length(p_buyer_email),0) > 200 or position('@' in coalesce(p_buyer_email,'')) = 0 then raise exception 'INVALID_BUYER'; end if;
  case p_category
    when 'pass_vip' then unit := ev.ticket_price; cname := 'Passe-Entrée VIP';
    when 'salon_twerk' then unit := 50000; cname := 'Salon Twerk (5 places assises)';
    when 'salon_pole_dance' then unit := 100000; cname := 'Salon Pole Dance (10 places assises)';
    when 'salon_sexy_nana' then unit := 150000; cname := 'Salon Sexy Nana (15 places assises)';
    else raise exception 'INVALID_CATEGORY';
  end case;
  select count(*) into pend from public.orders where user_id = p_user_id and status = 'pending' and reservation_expires_at > now();
  if pend >= 2 then raise exception 'TOO_MANY_PENDING'; end if;
  select count(*) into sold from public.tickets where status <> 'cancelled';
  select coalesce(sum(quantity),0) into held from public.orders where status = 'pending' and reservation_expires_at > now();
  if sold + held + p_quantity > ev.total_capacity then raise exception 'SOLD_OUT'; end if;
  select coalesce(jsonb_agg(distinct x), '[]'::jsonb) into ids from jsonb_array_elements_text(coalesce(p_digital_ids,'[]'::jsonb)) as t(x);
  req_n := jsonb_array_length(ids);
  if req_n > 20 then raise exception 'INVALID_PRODUCT'; end if;
  if req_n > 0 then
    select count(*), coalesce(sum(price),0) into found_n, addons from public.digital_products
      where is_active = true and id in (select jsonb_array_elements_text(ids));
    if found_n <> req_n then raise exception 'INVALID_PRODUCT'; end if;
  end if;
  total := unit * p_quantity + addons;
  oid := 'ord_' || replace(gen_random_uuid()::text, '-', '');
  exp := now() + interval '15 minutes';
  insert into public.orders(id,user_id,buyer_name,buyer_email,buyer_whatsapp,country_code,quantity,unit_price,total_amount,currency,
    payment_method,status,reservation_expires_at,digital_product_ids,category,category_name)
  values(oid,p_user_id,trim(p_buyer_name),lower(trim(p_buyer_email)),trim(p_buyer_whatsapp),left(coalesce(p_country_code,'+225'),6),
    p_quantity,unit,total,'FCFA','pending','pending',exp,ids,p_category,cname);
  return jsonb_build_object('id',oid,'userId',p_user_id,'buyerName',trim(p_buyer_name),'buyerEmail',lower(trim(p_buyer_email)),
    'buyerWhatsApp',trim(p_buyer_whatsapp),'countryCode',left(coalesce(p_country_code,'+225'),6),'quantity',p_quantity,'unitPrice',unit,
    'totalAmount',total,'currency','FCFA','paymentMethod','pending','status','pending',
    'reservationExpiresAt',(extract(epoch from exp)*1000)::bigint,'createdAt',now(),'digitalProductIds',ids,'category',p_category,'categoryName',cname);
end $function$
;

CREATE OR REPLACE FUNCTION public.fulfill_geniuspay_order(p_order_id text, p_reference text, p_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  o public.orders%rowtype; ev public.event_config%rowtype; n integer; inserted integer := 0; product record;
  digital_count integer := 0; sold integer; held integer;
begin
  perform pg_advisory_xact_lock(hashtext('maledike_capacity'));
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status = 'completed' then
    return jsonb_build_object('success',true,'already_completed',true,'tickets_count',(select count(*) from public.tickets where order_id = o.id));
  end if;
  if o.status not in ('pending','cancelled','failed') then raise exception 'ORDER_NOT_PENDING'; end if;
  if p_amount is null or p_amount <> o.total_amount then raise exception 'AMOUNT_MISMATCH'; end if;
  select * into ev from public.event_config where id = 'maledike-party-2026';
  if o.status <> 'pending' or o.reservation_expires_at < now() then
    select count(*) into sold from public.tickets where status <> 'cancelled';
    select coalesce(sum(quantity),0) into held from public.orders where status = 'pending' and reservation_expires_at > now() and id <> o.id;
    if sold + held + o.quantity > ev.total_capacity then
      insert into public.audit_logs(id,action,details) values('late_'||gen_random_uuid()::text,'PAID_ORDER_NO_CAPACITY',
        jsonb_build_object('orderId',o.id,'amount',o.total_amount,'reference',p_reference));
      raise exception 'ORDER_EXPIRED_NO_CAPACITY';
    end if;
  end if;
  if coalesce(p_reference,'') <> '' and coalesce(o.transaction_reference,'') <> '' and p_reference <> o.transaction_reference then
    insert into public.audit_logs(id,action,details) values('refmm_'||gen_random_uuid()::text,'REFERENCE_MISMATCH_NOTED',
      jsonb_build_object('orderId',o.id,'expected',o.transaction_reference,'received',p_reference));
  end if;
  update public.orders set status='completed', completed_at=now(),
    transaction_reference = case when coalesce(p_reference,'') <> '' and not exists (select 1 from public.orders x where x.transaction_reference = p_reference and x.id <> o.id) then p_reference else transaction_reference end
    where id = o.id;
  for n in 1..o.quantity loop
    insert into public.tickets(id,ticket_number,order_id,user_id,attendee_name,attendee_email,attendee_phone,event_title,event_date,event_time,price,category,category_name,qr_token_hash,status)
    values('tkt_'||gen_random_uuid()::text,'MLDK-2026-'||lpad(nextval('public.maledike_ticket_seq')::text,6,'0'),o.id,o.user_id,o.buyer_name,o.buyer_email,o.buyer_whatsapp,
      ev.title,ev.event_date,ev.time_range,o.unit_price,o.category,o.category_name,encode(gen_random_bytes(32),'hex'),'confirmed');
    inserted := inserted + 1;
  end loop;
  for product in select dp.* from public.digital_products dp where dp.is_active = true
    and dp.id in (select jsonb_array_elements_text(coalesce(o.digital_product_ids,'[]'::jsonb))) loop
    insert into public.user_digital_purchases(id,user_id,order_id,product_id,product_title,price,format,file_name,file_url,download_token)
    values('dpr_'||gen_random_uuid()::text,o.user_id,o.id,product.id,product.title,product.price,product.format,product.file_name,product.file_url,encode(gen_random_bytes(32),'hex'))
    on conflict (order_id, product_id) do nothing;
    digital_count := digital_count + 1;
  end loop;
  return jsonb_build_object('success',true,'already_completed',false,'tickets_count',inserted,'digital_purchases_count',digital_count);
end $function$
;

CREATE OR REPLACE FUNCTION public.maledike_agent_scan(p_code text, p_scanner_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_agent public.scanner_tokens%rowtype; v_ticket public.tickets%rowtype; v_now timestamptz:=now();
begin
 select * into v_agent from public.scanner_tokens where token=p_scanner_token and is_active=true limit 1;
 if not found then return jsonb_build_object('success',false,'message','Accès agent non autorisé','error','UNAUTHORIZED'); end if;
 select * into v_ticket from public.tickets where qr_token_hash=trim(p_code) or lower(ticket_number)=lower(trim(p_code)) or id=trim(p_code) limit 1 for update;
 if not found then
  insert into public.audit_logs(id,action,details,timestamp) values ('scan_invalid_'||gen_random_uuid()::text,'INVALID_TICKET_SCANNED',jsonb_build_object('rawInput',left(p_code,30),'agent',v_agent.agent_name,'gate',v_agent.gate_name),v_now);
  return jsonb_build_object('success',false,'message','BILLET INTROUVABLE OU NON VALIDE','error','NOT_FOUND');
 end if;
 if v_ticket.status='cancelled' then
  insert into public.audit_logs(id,action,details,timestamp) values ('scan_cancel_'||gen_random_uuid()::text,'CANCELLED_TICKET_SCANNED',jsonb_build_object('ticketNumber',v_ticket.ticket_number,'attendeeName',v_ticket.attendee_name,'agent',v_agent.agent_name,'gate',v_agent.gate_name),v_now);
  return jsonb_build_object('success',false,'message','ATTENTION : BILLET ANNULÉ','error','CANCELLED','ticket',to_jsonb(v_ticket));
 end if;
 if v_ticket.status='checked_in' then
  insert into public.audit_logs(id,action,details,timestamp) values ('scan_dup_'||gen_random_uuid()::text,'DUPLICATE_SCAN_REJECTED',jsonb_build_object('ticketNumber',v_ticket.ticket_number,'attendeeName',v_ticket.attendee_name,'alreadyCheckedInAt',v_ticket.checked_in_at,'agent',v_agent.agent_name,'gate',v_agent.gate_name),v_now);
  return jsonb_build_object('success',false,'message','DOUBLE ENTRÉE INTERDITE ! Billet déjà scanné','error','ALREADY_USED','ticket',to_jsonb(v_ticket),'alreadyCheckedInAt',v_ticket.checked_in_at);
 end if;
 update public.tickets set status='checked_in',checked_in_at=v_now,checked_in_by_agent=v_agent.agent_name||' ('||v_agent.gate_name||')' where id=v_ticket.id returning * into v_ticket;
 update public.scanner_tokens set scan_count=scan_count+1,last_used_at=v_now where id=v_agent.id;
 insert into public.audit_logs(id,action,details,timestamp) values ('scan_'||gen_random_uuid()::text,'TICKET_CHECKED_IN',jsonb_build_object('ticketNumber',v_ticket.ticket_number,'attendeeName',v_ticket.attendee_name,'agent',v_agent.agent_name,'gate',v_agent.gate_name,'category',coalesce(v_ticket.category_name,v_ticket.category,'VIP')),v_now);
 return jsonb_build_object('success',true,'message','ACCÈS VALIDÉ ! Passe VIP autorisé.','ticket',to_jsonb(v_ticket));
end $function$
;

CREATE OR REPLACE FUNCTION public.maledike_scanner_history(p_scanner_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_agent public.scanner_tokens%rowtype;
BEGIN
 SELECT * INTO v_agent FROM public.scanner_tokens WHERE token=p_scanner_token AND is_active=true LIMIT 1;
 IF NOT FOUND THEN RETURN jsonb_build_object('error','Token non autorisé'); END IF;
 RETURN coalesce((SELECT jsonb_agg(x ORDER BY x.timestamp DESC) FROM (
   SELECT id,action,details,timestamp FROM public.audit_logs
   WHERE action IN ('TICKET_CHECKED_IN','DUPLICATE_SCAN_REJECTED','INVALID_TICKET_SCANNED','CANCELLED_TICKET_SCANNED')
     AND details->>'agent'=v_agent.agent_name AND details->>'gate'=v_agent.gate_name
   ORDER BY timestamp DESC LIMIT 100
 ) x),'[]'::jsonb);
END $function$
;

CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare w timestamptz; h integer;
begin
  w := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits(key, window_start, hits) values (left(p_key,200), w, 1)
    on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1 returning hits into h;
  if random() < 0.02 then delete from public.rate_limits where window_start < now() - interval '1 day'; end if;
  return h <= p_limit;
end $function$
;

REVOKE ALL ON FUNCTION public.create_order_atomic(text,text,integer,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fulfill_geniuspay_order(text,text,numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rate_limit_hit(text,integer,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.maledike_agent_scan(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.maledike_scanner_history(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkin_ticket_atomic(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(text,text,integer,text,text,text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.fulfill_geniuspay_order(text,text,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text,integer,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.maledike_agent_scan(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.maledike_scanner_history(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.checkin_ticket_atomic(text,text) TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_digital_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_analytics_events ENABLE ROW LEVEL SECURITY;
