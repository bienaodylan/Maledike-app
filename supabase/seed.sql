-- ============================================================
-- MALEDIKE PARTY — DONNÉES INITIALES / SEED POUR SUPABASE
-- Exécutez ce script dans le SQL Editor de votre projet Supabase
-- ============================================================

-- 1. Configuration Initiale de l'Événement
INSERT INTO public.event_config (
  id, title, subtitle, event_date, target_date_iso, time_range,
  ticket_price, currency, total_capacity, secret_location_address,
  is_secret_location_revealed, concierge_whatsapp, concierge_display_phone
) VALUES (
  'maledike-party-2026',
  'MALEDIKE PARTY',
  'Mireza Caribbean présente — Une nuit exclusive sans compromis au coeur d''Abidjan.',
  'Samedi 28 Novembre 2026',
  '2026-11-28T23:00:00Z',
  '23H00 — 06H00',
  10000,
  'FCFA',
  350,
  'Villa Rêve d''Émeraude, Zone Bld de Marseille, Biétry / Marcory, Abidjan (Accès filtré)',
  false,
  '+2250150049489',
  '+225 01 50 04 94 89'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  ticket_price = EXCLUDED.ticket_price,
  total_capacity = EXCLUDED.total_capacity;

-- 2. Assets Visuels Officiels du Site
INSERT INTO public.site_assets (
  id, background_image_url, hero_flyer_url, mood_image1, mood_image2, gallery_images
) VALUES (
  'default',
  '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47_72294852.jpeg',
  '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg',
  '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.33_6cfe3486.jpeg',
  '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.32_d946a24f.jpeg',
  '[
    "/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg",
    "/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.33_6cfe3486.jpeg",
    "/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.32_d946a24f.jpeg",
    "/assets/aistudio/gallery_vibe_01.png"
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  background_image_url = EXCLUDED.background_image_url,
  hero_flyer_url = EXCLUDED.hero_flyer_url,
  gallery_images = EXCLUDED.gallery_images;

-- 3. Compte Administrateur Racine (Dylan Bienao)
INSERT INTO public.profiles (
  id, email, password_hash, first_name, last_name, whatsapp_number, country_code, role
) VALUES (
  'admin_root_1',
  'bienaodylan428@gmail.com',
  'maledike2026',
  'Dylan',
  'Bienao',
  '0150049489',
  '+225',
  'admin'
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin';

-- 4. Produits Numériques & Guides Exclusifs
INSERT INTO public.digital_products (
  id, title, description, price, format, file_name, file_url, is_active
) VALUES 
(
  'prod_vip_guide_2026',
  'Pass Digital & Guide Exclusif MALÉDIKÉ',
  'Livret officiel PDF HD contenant l''itinéraire privé d''Abidjan, consignes du bar de prestige, playlist caribéenne & accès coupe-file.',
  5000,
  'PDF',
  'GUIDE_VIP_MALEDIKE_PARTY_2026.pdf',
  '/assets/digital/GUIDE_VIP_MALEDIKE_PARTY_2026.pdf',
  true
),
(
  'prod_wallpapers_pack',
  'Pack Visuels Collector MALÉDIKÉ (Ultra HD)',
  'Ensemble de fonds d''écran officiels 4K et affiches artistiques signées Mireza Caribbean pour smartphone et desktop.',
  2500,
  'ZIP',
  'COLLECTOR_ART_PACK_MALEDIKE.zip',
  '/assets/digital/COLLECTOR_ART_PACK_MALEDIKE.zip',
  true
) ON CONFLICT (id) DO NOTHING;

-- 5. Token Initial pour Poste de Filtrage Scanner
INSERT INTO public.scanner_tokens (
  id, token, agent_name, gate_name, event_id, is_active
) VALUES (
  'scan_tok_main_gate',
  'sct_9f8e21a4bc88',
  'Agent Filtrage Entrée Principale',
  'Entrée Principale VIP',
  'maledike-party-2026',
  true
) ON CONFLICT (token) DO NOTHING;
