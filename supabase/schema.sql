-- ============================================================
-- MALEDIKE PARTY — SCHEMA POSTGRESQL SUPABASE & SÉCURITÉ RLS
-- ============================================================

-- 1. Configuration de l'événement
CREATE TABLE IF NOT EXISTS public.event_config (
  id TEXT PRIMARY KEY DEFAULT 'maledike-party-2026',
  title TEXT NOT NULL DEFAULT 'MALEDIKE PARTY',
  subtitle TEXT NOT NULL DEFAULT 'Mireza Caribbean présente — Une nuit exclusive sans compromis au coeur d''Abidjan.',
  event_date TEXT NOT NULL DEFAULT 'Samedi 28 Novembre 2026',
  target_date_iso TIMESTAMPTZ NOT NULL DEFAULT '2026-11-28T23:00:00Z',
  time_range TEXT NOT NULL DEFAULT '23H00 — 06H00',
  ticket_price INTEGER NOT NULL DEFAULT 10000,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  total_capacity INTEGER NOT NULL DEFAULT 350,
  secret_location_address TEXT NOT NULL DEFAULT 'Villa Rêve d''Émeraude, Zone Bld de Marseille, Biétry / Marcory, Abidjan (Accès filtré)',
  is_secret_location_revealed BOOLEAN NOT NULL DEFAULT false,
  concierge_whatsapp TEXT NOT NULL DEFAULT '+2250150049489',
  concierge_display_phone TEXT NOT NULL DEFAULT '+225 01 50 04 94 89',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Assets visuels du site
CREATE TABLE IF NOT EXISTS public.site_assets (
  id TEXT PRIMARY KEY DEFAULT 'default',
  background_image_url TEXT NOT NULL,
  hero_flyer_url TEXT NOT NULL,
  mood_image1 TEXT NOT NULL,
  mood_image2 TEXT NOT NULL,
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profils Utilisateurs & Administrateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+225',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Commandes
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_whatsapp TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+225',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'FCFA',
  payment_method TEXT NOT NULL,
  payment_phone TEXT,
  transaction_reference TEXT,
  checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reservation_expires_at TIMESTAMPTZ NOT NULL,
  digital_product_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_txn_ref ON public.orders(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 5. Billets Nominatifs & QR Code Crypté
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT NOT NULL,
  event_title TEXT NOT NULL DEFAULT 'MALEDIKE PARTY',
  event_date TEXT NOT NULL DEFAULT 'Samedi 28 Novembre 2026',
  event_time TEXT NOT NULL DEFAULT '23H00 — 06H00',
  price INTEGER NOT NULL DEFAULT 10000,
  qr_token_hash TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ,
  checked_in_by_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON public.tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_token ON public.tickets(qr_token_hash);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_num ON public.tickets(ticket_number);

-- 6. Produits Numériques & Achats
CREATE TABLE IF NOT EXISTS public.digital_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  format TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_digital_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  product_title TEXT NOT NULL,
  price INTEGER NOT NULL,
  format TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  download_token TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tokens d'accès pour Agents de Filtrage
CREATE TABLE IF NOT EXISTS public.scanner_tokens (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  agent_name TEXT NOT NULL,
  gate_name TEXT NOT NULL,
  event_id TEXT NOT NULL DEFAULT 'maledike-party-2026',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  scan_count INTEGER NOT NULL DEFAULT 0
);

-- 8. Journal d'Audit & Sécurité
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Configuration Passerelle Sécurisée
CREATE TABLE IF NOT EXISTS public.gateway_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  env TEXT NOT NULL DEFAULT 'production' CHECK (env IN ('sandbox', 'production')),
  public_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_digital_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_config ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : Lecture publique des infos d'événement & produits actifs
CREATE POLICY "Lecture publique event_config" ON public.event_config FOR SELECT USING (true);
CREATE POLICY "Lecture publique site_assets" ON public.site_assets FOR SELECT USING (true);
CREATE POLICY "Lecture publique digital_products" ON public.digital_products FOR SELECT USING (is_active = true);

-- Les utilisateurs peuvent voir leurs propres billets et commandes
CREATE POLICY "Utilisateurs voient leurs commandes" ON public.orders FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Utilisateurs voient leurs billets" ON public.tickets FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Utilisateurs voient leurs achats numeriques" ON public.user_digital_purchases FOR SELECT USING (auth.uid()::text = user_id);

-- La passerelle et l'administration backend utilisent SUPABASE_SERVICE_ROLE_KEY qui contourne RLS en toute sécurité.
