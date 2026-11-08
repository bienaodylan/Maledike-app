-- MALÉDIKÉ PARTY — durcissement sécurité (2026-11-08)
-- Additif : aucune donnée existante n'est modifiée ou supprimée (hors table gateway_config vide).

-- 1. Contraintes d'intégrité
alter table public.orders drop constraint if exists orders_quantity_range;
alter table public.orders add constraint orders_quantity_range check (quantity between 1 and 10);
alter table public.orders drop constraint if exists orders_total_positive;
alter table public.orders add constraint orders_total_positive check (total_amount > 0 and unit_price > 0);
create unique index if not exists uq_orders_transaction_reference on public.orders(transaction_reference) where transaction_reference is not null and transaction_reference <> '';
create unique index if not exists uq_udp_order_product on public.user_digital_purchases(order_id, product_id);

-- 2. Création de commande ATOMIQUE (prix, capacité, produits : tout est décidé côté base, sous verrou)
create or replace function public.create_order_atomic(
  p_user_id text, p_category text, p_quantity integer, p_buyer_name text, p_buyer_email text,
  p_buyer_whatsapp text, p_country_code text, p_digital_ids jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
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
end $$;

-- 3. Fulfillment : paiement confirmé APRÈS expiration de la réservation => billets émis si des places restent
--    (sinon ORDER_EXPIRED_NO_CAPACITY, journalisé pour remboursement manuel). QR = 256 bits aléatoires.
create or replace function public.fulfill_geniuspay_order(p_order_id text, p_reference text, p_amount numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
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
end $$;

-- 4. Limiteur de débit durable (partagé entre instances serverless)
create table if not exists public.rate_limits(
  key text not null, window_start timestamptz not null, hits integer not null default 1, primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
create or replace function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare w timestamptz; h integer;
begin
  w := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits(key, window_start, hits) values (left(p_key,200), w, 1)
    on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1 returning hits into h;
  if random() < 0.02 then delete from public.rate_limits where window_start < now() - interval '1 day'; end if;
  return h <= p_limit;
end $$;

-- 5. Droits : fonctions réservées au service_role uniquement
revoke all on function public.create_order_atomic(text,text,integer,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.fulfill_geniuspay_order(text,text,numeric) from public, anon, authenticated;
revoke all on function public.rate_limit_hit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.create_order_atomic(text,text,integer,text,text,text,text,jsonb) to service_role;
grant execute on function public.fulfill_geniuspay_order(text,text,numeric) to service_role;
grant execute on function public.rate_limit_hit(text,integer,integer) to service_role;

-- 6. Secrets de passerelle : jamais en base (table vide, inutilisée par le code)
drop table if exists public.gateway_config;

-- 7. Policies RLS en doublon (mêmes règles, coût de performance inutile)
drop policy if exists "Public can read active digital products" on public.digital_products;
drop policy if exists "owner orders" on public.orders;
drop policy if exists "owner tickets" on public.tickets;
drop policy if exists "owner digital purchases" on public.user_digital_purchases;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Public can read site assets" on public.site_assets;

-- 8. Bucket public pour les visuels du site (écriture réservée au service_role, types et taille restreints)
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets','site-assets', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];
