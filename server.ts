import express from 'express';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

// Baseline HTTP hardening (compatible with current Vite/React app).
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(express.json({
  limit: '50mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Directory & Database Persistence
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Public uploads directory for visual assets
const UPLOADS_DIR = process.env.VERCEL ? path.join('/tmp', 'maledike-uploads') : path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

interface DatabaseSchema {
  event: {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    targetDateIso: string;
    timeRange: string;
    ticketPrice: number;
    currency: string;
    totalCapacity: number;
    secretLocationAddress: string;
    isSecretLocationRevealed: boolean;
    conciergeWhatsApp: string;
    conciergeDisplayPhone: string;
  };
  siteAssets: {
    backgroundImageUrl: string;
    heroFlyerUrl: string;
    moodImage1: string;
    moodImage2: string;
    galleryImages: string[];
  };
  profiles: Array<{
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    whatsappNumber: string;
    countryCode: string;
    role: 'user' | 'admin';
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    userId: string;
    buyerName: string;
    buyerEmail: string;
    buyerWhatsApp: string;
    countryCode: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    paymentPhone: string;
    transactionReference: string;
    checkoutUrl?: string;
    status: 'pending' | 'completed' | 'cancelled' | 'failed';
    reservationExpiresAt: number;
    createdAt: string;
    completedAt?: string;
    digitalProductIds?: string[];
    category?: string;
    categoryName?: string;
  }>;
  tickets: Array<{
    id: string;
    ticketNumber: string;
    orderId: string;
    userId: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    price: number;
    category?: string;
    categoryName?: string;
    qrTokenHash: string;
    status: 'confirmed' | 'checked_in' | 'cancelled';
    checkedInAt?: string;
    checkedInByAgent?: string;
    createdAt: string;
  }>;
  digitalProducts: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    format: 'PDF' | 'PNG' | 'JPG' | 'JPEG' | 'ZIP';
    fileName: string;
    fileUrl: string;
    isActive: boolean;
    createdAt: string;
  }>;
  userDigitalPurchases: Array<{
    id: string;
    orderId: string;
    userId: string;
    productId: string;
    productTitle: string;
    format: string;
    fileName: string;
    fileUrl: string;
    downloadToken: string;
    purchasedAt: string;
  }>;
  scannerTokens: Array<{
    id: string;
    token: string;
    agentName: string;
    gateName: string;
    eventId: string;
    isActive: boolean;
    createdAt: string;
    lastUsedAt?: string;
    scanCount: number;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    details: any;
    timestamp: string;
  }>;
  gatewayConfig: {
    env: 'sandbox' | 'production';
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
}

function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (process.env.GENIUSPAY_SECRET_KEY && (!parsed.gatewayConfig?.secretKey || parsed.gatewayConfig.secretKey.includes('your_geniuspay'))) {
        parsed.gatewayConfig.secretKey = process.env.GENIUSPAY_SECRET_KEY;
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return {
    event: {
      id: 'maledike-party-2026',
      title: 'MALÉDIKÉ PARTY',
      subtitle: 'Mireza Caribbean présente — Une nuit exclusive sans compromis au coeur d\'Abidjan.',
      date: 'Samedi 28 Novembre 2026',
      targetDateIso: '2026-11-28T23:00:00',
      timeRange: '23H00 — 06H00',
      ticketPrice: 10000,
      currency: 'FCFA',
      totalCapacity: 350,
      secretLocationAddress: 'Villa Rêve d\'Émeraude, Zone Bld de Marseille, Biétry / Marcory, Abidjan (Accès filtré)',
      isSecretLocationRevealed: false,
      conciergeWhatsApp: '+2250150049489',
      conciergeDisplayPhone: '+225 01 50 04 94 89',
    },
    siteAssets: {
      backgroundImageUrl: '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47_72294852.jpeg',
      heroFlyerUrl: '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg',
      moodImage1: '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.33_6cfe3486.jpeg',
      moodImage2: '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.32_d946a24f.jpeg',
      galleryImages: [
        '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg',
        '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.33_6cfe3486.jpeg',
        '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.32_d946a24f.jpeg',
        '/assets/aistudio/gallery_vibe_01.png',
      ],
    },
    profiles: [
      {
        id: 'admin_root_1',
        email: 'bienaodylan428@gmail.com',
        passwordHash: '',
        firstName: 'Dylan',
        lastName: 'Bienao',
        whatsappNumber: '0150049489',
        countryCode: '+225',
        role: 'admin',
        createdAt: '2026-11-01T10:00:00Z',
      },
    ],
    orders: [],
    tickets: [],
    digitalProducts: [],
    userDigitalPurchases: [],
    scannerTokens: [],
    auditLogs: [],
    gatewayConfig: {
      env: 'production',
      publicKey: process.env.GENIUSPAY_PUBLIC_KEY || '',
      secretKey: process.env.GENIUSPAY_SECRET_KEY || '',
      webhookSecret: process.env.GENIUSPAY_WEBHOOK_SECRET || '',
    },
  };
}

function saveDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

let db = readDb();

const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;
const supabaseAuth = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL || 'bienaodylan428@gmail.com').toLowerCase().trim();

async function getVerifiedUser(req: express.Request) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token || !supabaseAuth) return null;
  const { data, error } = await supabaseAuth.auth.getUser(token);
  return error ? null : data.user || null;
}

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const user = await getVerifiedUser(req);
    const email=user?.email?.toLowerCase().trim();
    if(!user) return res.status(401).json({success:false,error:'Session invalide.'});
    if(!user.email_confirmed_at) return res.status(403).json({success:false,error:'Email fondateur non confirmé.'});
    if(email!==ROOT_ADMIN_EMAIL) return res.status(403).json({success:false,error:'Accès réservé au fondateur.'});
    return next();
  } catch { return res.status(401).json({success:false,error:'Session invalide.'}); }
}

function orderToRow(order: any) {
  return { id: order.id, user_id: order.userId, buyer_name: order.buyerName, buyer_email: order.buyerEmail,
    buyer_whatsapp: order.buyerWhatsApp, country_code: order.countryCode, quantity: order.quantity,
    unit_price: order.unitPrice, total_amount: order.totalAmount, currency: order.currency,
    payment_method: order.paymentMethod, payment_phone: order.paymentPhone, transaction_reference: order.transactionReference,
    checkout_url: order.checkoutUrl || null, status: order.status, reservation_expires_at: new Date(order.reservationExpiresAt).toISOString(),
    digital_product_ids: order.digitalProductIds || [], created_at: order.createdAt, completed_at: order.completedAt || null };
}
function rowToOrder(row: any) {
  return { id: row.id, userId: row.user_id, buyerName: row.buyer_name, buyerEmail: row.buyer_email,
    buyerWhatsApp: row.buyer_whatsapp, countryCode: row.country_code, quantity: row.quantity, unitPrice: row.unit_price,
    totalAmount: row.total_amount, currency: row.currency, paymentMethod: row.payment_method, paymentPhone: row.payment_phone,
    transactionReference: row.transaction_reference, checkoutUrl: row.checkout_url, status: row.status,
    reservationExpiresAt: new Date(row.reservation_expires_at).getTime(), digitalProductIds: row.digital_product_ids || [],
    createdAt: row.created_at, completedAt: row.completed_at };
}
async function persistOrder(order: any) {
  if (!supabaseAdmin) throw new Error('Supabase serveur non configuré.');
  const { error } = await supabaseAdmin.from('orders').upsert(orderToRow(order), { onConflict: 'id' });
  if (error) throw error;
}
async function loadOrder(orderId: string) {
  if (!supabaseAdmin) return db.orders.find(o => o.id === orderId);
  const { data, error } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (error) throw error;
  return data ? rowToOrder(data) : undefined;
}

async function loadOrderArtifacts(orderId:string) {
  if(!supabaseAdmin) return {tickets:db.tickets.filter(t=>t.orderId===orderId),digitalPurchases:db.userDigitalPurchases.filter(p=>p.orderId===orderId)};
  const [t,p]=await Promise.all([
    supabaseAdmin.from('tickets').select('*').eq('order_id',orderId),
    supabaseAdmin.from('user_digital_purchases').select('*').eq('order_id',orderId)
  ]);
  if(t.error||p.error) throw t.error||p.error;
  return {
    tickets:(t.data||[]).map(x=>({id:x.id,ticketNumber:x.ticket_number,orderId:x.order_id,userId:x.user_id,attendeeName:x.attendee_name,attendeeEmail:x.attendee_email,attendeePhone:x.attendee_phone,eventTitle:x.event_title,eventDate:x.event_date,eventTime:x.event_time,price:x.price,qrTokenHash:x.qr_token_hash,status:x.status,createdAt:x.created_at,checkedInAt:x.checked_in_at,checkedInByAgent:x.checked_in_by_agent})),
    digitalPurchases:(p.data||[]).map(x=>({id:x.id,orderId:x.order_id,userId:x.user_id,productId:x.product_id,productTitle:x.product_title,format:x.format,fileName:x.file_name,fileUrl:x.file_url,downloadToken:x.download_token,purchasedAt:x.purchased_at}))
  };
}

// Helper: Timing safe comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Helper: Genius Pay Base URL
function getGeniusPayBaseUrl(env: 'sandbox' | 'production'): string {
  return env === 'sandbox'
    ? 'https://sandbox.genius.ci/api/v1/merchant'
    : 'https://pay.genius.ci/api/v1/merchant';
}

// Helper: Appel robuste et résilient à l'API Genius Pay avec gestion automatique des erreurs 502/503/504 et parsing sécurisé
async function callGeniusPayApi(
  url: string,
  options: {
    method?: string;
    publicKey: string;
    secretKey: string;
    body?: any;
    timeoutMs?: number;
    maxRetries?: number;
  }
): Promise<{ ok: boolean; status: number; data: any; rawText: string; errorText?: string }> {
  const { method = 'GET', publicKey, secretKey, body, timeoutMs = 15000, maxRetries = 2 } = options;

  let lastStatus = 0;
  let lastRawText = '';
  let lastErrorText = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        'X-API-Key': publicKey,
        'X-API-Secret': secretKey,
        'Accept': 'application/json',
      };
      if (body) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);
      lastStatus = response.status;
      lastRawText = await response.text();

      let parsedData: any = null;
      try {
        parsedData = JSON.parse(lastRawText);
      } catch {
        // La passerelle ou le reverse-proxy LiteSpeed/Cloudflare a renvoyé du texte/HTML (ex: "error code: 502")
        console.warn(`[GeniusPay] Réponse HTTP ${response.status} non-JSON (tentative ${attempt}/${maxRetries}):`, lastRawText.slice(0, 150));
      }

      if (response.ok && parsedData) {
        return { ok: true, status: response.status, data: parsedData, rawText: lastRawText };
      }

      // Si erreur 502, 503, 504 ou 429, on retente après une pause si tentatives restantes
      if ([502, 503, 504, 429].includes(response.status) && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1200 * attempt));
        continue;
      }

      const errMessage = parsedData?.message || parsedData?.error || parsedData?.errors?.[0]?.message || 
        (response.status === 502 ? 'La passerelle de paiement rencontre une instabilité temporaire (Erreur 502 Bad Gateway). Veuillez patienter quelques secondes et réessayer.' : 
         response.status === 504 ? 'Délai d\'attente de la passerelle dépassé (Erreur 504 Gateway Timeout).' :
         (lastRawText.length > 250 ? `Erreur HTTP ${response.status} de la passerelle` : lastRawText));

      return {
        ok: false,
        status: response.status,
        data: parsedData,
        rawText: lastRawText,
        errorText: errMessage,
      };
    } catch (err: any) {
      clearTimeout(timer);
      lastErrorText = err.name === 'AbortError' ? 'Délai d\'attente de la passerelle de paiement dépassé' : (err.message || 'Erreur réseau');
      console.warn(`[GeniusPay] Erreur de communication (tentative ${attempt}/${maxRetries}):`, lastErrorText);

      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1200 * attempt));
        continue;
      }
    }
  }

  return {
    ok: false,
    status: lastStatus || 502,
    data: null,
    rawText: lastRawText,
    errorText: lastErrorText || 'Serveurs de paiement temporairement indisponibles (502).',
  };
}

// ----------------- 1. EVENT & ASSETS -----------------
app.get('/api/event', (_req, res) => {
  db = readDb();
  const confirmedCount = db.tickets.filter(t => t.status !== 'cancelled').length;
  const isSoldOut = confirmedCount >= db.event.totalCapacity;
  res.json({
    ...db.event,
    soldCount: confirmedCount,
    status: isSoldOut ? 'sold_out' : 'open',
    remainingCount: Math.max(0, db.event.totalCapacity - confirmedCount),
  });
});

app.post('/api/event/update', requireAdmin, (req, res) => {
  db = readDb();
  const { totalCapacity, secretLocationAddress, isSecretLocationRevealed, ticketPrice } = req.body;
  if (totalCapacity !== undefined) db.event.totalCapacity = Number(totalCapacity);
  if (secretLocationAddress !== undefined) db.event.secretLocationAddress = secretLocationAddress;
  if (isSecretLocationRevealed !== undefined) db.event.isSecretLocationRevealed = Boolean(isSecretLocationRevealed);
  if (ticketPrice !== undefined) db.event.ticketPrice = Number(ticketPrice);
  saveDb(db);
  res.json({ success: true, event: db.event });
});

app.get('/api/site-assets', (_req, res) => {
  db = readDb();
  res.json(db.siteAssets);
});

app.post('/api/site-assets/update', requireAdmin, (req, res) => {
  db = readDb();
  const { backgroundImageUrl, heroFlyerUrl, moodImage1, moodImage2, galleryImages } = req.body;
  if (backgroundImageUrl) db.siteAssets.backgroundImageUrl = backgroundImageUrl;
  if (heroFlyerUrl) db.siteAssets.heroFlyerUrl = heroFlyerUrl;
  if (moodImage1) db.siteAssets.moodImage1 = moodImage1;
  if (moodImage2) db.siteAssets.moodImage2 = moodImage2;
  if (Array.isArray(galleryImages)) db.siteAssets.galleryImages = galleryImages;
  saveDb(db);
  res.json({ success: true, siteAssets: db.siteAssets });
});

// Upload route for visual assets (hero flyer, background, mood, gallery)
app.post('/api/upload', requireAdmin, (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'Aucun fichier transmis.' });
    }

    let buffer: Buffer;
    let ext = '.png';

    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      buffer = Buffer.from(matches[2], 'base64');
      if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      else if (mime.includes('webp')) ext = '.webp';
      else if (mime.includes('svg')) ext = '.svg';
      else if (mime.includes('gif')) ext = '.gif';
      else ext = '.png';
    } else {
      buffer = Buffer.from(fileData, 'base64');
      if (fileName && path.extname(fileName)) {
        ext = path.extname(fileName).toLowerCase();
      }
    }

    const cleanBase = (fileName || 'maledike_visual')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const generatedName = `${Date.now()}_${cleanBase}${ext}`;
    const filePath = path.join(UPLOADS_DIR, generatedName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${generatedName}`;
    return res.json({ success: true, url: publicUrl, fileName: generatedName });
  } catch (err: any) {
    console.error('Erreur upload:', err);
    return res.status(500).json({ error: 'Erreur lors du traitement du fichier.' });
  }
});

// ----------------- 2. AUTHENTICATION -----------------
// AUTH — Supabase Auth is the single source of truth. Never compare/store plaintext passwords in db.json.
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, whatsappNumber, countryCode } = req.body || {};
    if (!email || !password || !firstName || !lastName || !whatsappNumber) return res.status(400).json({ success:false, error:'Tous les champs sont obligatoires.' });
    if (!supabaseAuth || !supabaseAdmin) return res.status(503).json({ success:false, error:'Service d’authentification indisponible.' });
    const normalizedEmail = String(email).trim().toLowerCase();
    const { data, error } = await supabaseAuth.auth.signUp({ email: normalizedEmail, password, options:{ data:{ first_name:String(firstName).trim(), last_name:String(lastName).trim(), whatsapp_number:String(whatsappNumber).trim(), country_code:countryCode || '+225' } } });
    if (error) return res.status(400).json({ success:false, error:error.message });
    if (!data.user) return res.status(400).json({ success:false, error:'Création du compte non confirmée.' });
    const profile={ id:data.user.id,email:normalizedEmail,first_name:String(firstName).trim(),last_name:String(lastName).trim(),whatsapp_number:String(whatsappNumber).trim(),country_code:countryCode||'+225' };
    const { error: profileError }=await supabaseAdmin.from('profiles').upsert(profile,{onConflict:'id'});
    if(profileError) console.error('[auth/register] profile sync:',profileError.message);
    return res.json({success:true,needsEmailConfirmation:!data.session,accessToken:data.session?.access_token||null,user:{id:data.user.id,email:normalizedEmail,firstName:profile.first_name,lastName:profile.last_name,whatsappNumber:profile.whatsapp_number,countryCode:profile.country_code,role:normalizedEmail===ROOT_ADMIN_EMAIL?'admin':'user',createdAt:data.user.created_at}});
  } catch(e:any) { console.error('[auth/register]',e.message); return res.status(500).json({success:false,error:'Erreur serveur pendant la création du compte.'}); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({success:false,error:'Email et mot de passe requis.'});
    if (!supabaseAuth || !supabaseAdmin) return res.status(503).json({success:false,error:'Service d’authentification indisponible.'});
    const normalizedEmail=String(email).trim().toLowerCase();
    const {data,error}=await supabaseAuth.auth.signInWithPassword({email:normalizedEmail,password});
    if(error || !data.user) return res.status(401).json({success:false,error:'Email ou mot de passe incorrect.'});
    const {data:profile}=await supabaseAdmin.from('profiles').select('*').eq('id',data.user.id).maybeSingle();
    const meta=data.user.user_metadata||{};
    const user={id:data.user.id,email:normalizedEmail,firstName:profile?.first_name||meta.first_name||'',lastName:profile?.last_name||meta.last_name||'',whatsappNumber:profile?.whatsapp_number||meta.whatsapp_number||'',countryCode:profile?.country_code||meta.country_code||'+225',role:normalizedEmail===ROOT_ADMIN_EMAIL?'admin':'user',createdAt:data.user.created_at};
    return res.json({success:true,accessToken:data.session.access_token,user});
  } catch(e:any) { console.error('[auth/login]',e.message); return res.status(500).json({success:false,error:'Erreur serveur pendant la connexion.'}); }
});

app.post('/api/auth/update-profile', async (req, res) => {
  const authHeader=req.headers.authorization||'';
  const token=authHeader.startsWith('Bearer ')?authHeader.slice(7).trim():'';
  if(!token||!supabaseAuth)return res.status(401).json({error:'Authentification requise.'});
  const {data:authData,error:authError}=await supabaseAuth.auth.getUser(token);
  if(authError||!authData.user)return res.status(401).json({error:'Session invalide.'});
  if(req.body?.userId!==authData.user.id)return res.status(403).json({error:'Modification du profil interdite.'});
  db = readDb();
  const { userId, firstName, lastName, whatsappNumber, countryCode } = req.body;
  const user = db.profiles.find(p => p.id === userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  if (firstName) user.firstName = firstName.trim();
  if (lastName) user.lastName = lastName.trim();
  if (whatsappNumber) user.whatsappNumber = whatsappNumber.trim();
  if (countryCode) user.countryCode = countryCode.trim();

  saveDb(db);
  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// ----------------- 3. ORDERS & GENIUS PAY REAL PAYMENT GATEWAY -----------------
app.post('/api/orders/create', async (req, res) => {
  const authorization=req.headers.authorization||'';
  const token=authorization.startsWith('Bearer ')?authorization.slice(7).trim():'';
  if(!token||!supabaseAuth)return res.status(401).json({success:false,error:'Connexion requise pour réserver.'});
  const {data:authData,error:authError}=await supabaseAuth.auth.getUser(token);
  if(authError||!authData.user)return res.status(401).json({success:false,error:'Session invalide.'});
  db = readDb();
  const { buyerName, buyerEmail, buyerWhatsApp, countryCode, quantity, digitalProductIds, category } = req.body;
  const userId=authData.user.id;

  if (!quantity || !Number.isInteger(Number(quantity)) || quantity < 1 || quantity > 10) {
    return res.status(400).json({ error: 'Paramètres de réservation invalides.' });
  }

  // Stock check
  const activeTickets = db.tickets.filter(t => t.status !== 'cancelled').length;
  if (activeTickets + quantity > db.event.totalCapacity) {
    return res.status(400).json({ error: 'Désolé, les places sont épuisées pour cette quantité.' });
  }

  const SALON_PRICES: Record<string, { price: number; name: string }> = {
    pass_vip: { price: db.event.ticketPrice || 10000, name: 'Passe-Entrée VIP' },
    salon_twerk: { price: 50000, name: 'Salon Twerk (5 places assises)' },
    salon_pole_dance: { price: 100000, name: 'Salon Pole Dance (10 places assises)' },
    salon_sexy_nana: { price: 150000, name: 'Salon Sexy Nana (15 places assises)' },
  };

  const selectedCategory = category && SALON_PRICES[category] ? category : 'pass_vip';
  const unitPrice = SALON_PRICES[selectedCategory].price;
  const categoryName = SALON_PRICES[selectedCategory].name;

  let totalAmount = unitPrice * quantity;
  
  if (Array.isArray(digitalProductIds) && digitalProductIds.length > 0) {
    const products = db.digitalProducts.filter(p => digitalProductIds.includes(p.id) && p.isActive);
    const digitalCost = products.reduce((sum, p) => sum + p.price, 0);
    totalAmount += digitalCost;
  }

  const orderId = 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const reservationExpiresAt = Date.now() + 15 * 60 * 1000;

  const newOrder = {
    id: orderId,
    userId,
    buyerName,
    buyerEmail,
    buyerWhatsApp,
    countryCode: countryCode || '+225',
    quantity,
    unitPrice,
    totalAmount,
    currency: db.event.currency,
    category: selectedCategory,
    categoryName,
    paymentMethod: 'wave',
    paymentPhone: (countryCode || '+225') + buyerWhatsApp,
    transactionReference: 'GP_TXN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    status: 'pending' as const,
    reservationExpiresAt,
    digitalProductIds: digitalProductIds || [],
    createdAt: new Date().toISOString(),
  };

  db.orders.push(newOrder);
  try { await persistOrder(newOrder); } catch (e: any) { console.error('Supabase order insert failed:', e.message); return res.status(500).json({ error: 'Impossible d’enregistrer la commande. Réessayez.' }); }
  saveDb(db);

  res.json({
    success: true,
    order: newOrder,
    geniusPayPublicKey: db.gatewayConfig.publicKey,
    env: db.gatewayConfig.env,
  });
});

// Real Genius Pay Transaction Initiation (Server-to-Server) - AUTH FIX CORRIGÉ
app.post('/api/payments/geniuspay/initiate', async (req, res) => {
  try {
    const user = await getVerifiedUser(req);
    if (!user) return res.status(401).json({success:false,error:'Authentification requise.'});
    const { orderId, paymentMethod, paymentPhone, countryCode } = req.body || {};
    if (!['wave','orange_money','mtn_momo','moov_money','djamo_card'].includes(paymentMethod) || typeof paymentPhone !== 'string' || paymentPhone.replace(/\D/g,'').length < 8 || paymentPhone.replace(/\D/g,'').length > 15) return res.status(400).json({error:'Moyen de paiement invalide.'});
    db = readDb();

    const order = await loadOrder(orderId);
    if (!order || order.userId !== user.id) return res.status(404).json({ error: 'Commande introuvable.' });
    if (order.status !== 'pending') return res.status(409).json({error:'Cette commande ne peut plus être payée.'});

    if (Date.now() > order.reservationExpiresAt && order.status === 'pending') {
      order.status = 'cancelled';
      saveDb(db);
      return res.status(400).json({ error: 'La réservation temporaire de 15 minutes a expiré.' });
    }

    order.paymentMethod = paymentMethod;
    const fullPhone = `${countryCode || '+225'}${paymentPhone.replace(/\s+/g, '')}`;
    order.paymentPhone = fullPhone;
    
    const txnRef = `GP_TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    order.transactionReference = txnRef;
    saveDb(db);
    await persistOrder(order);

    const gatewayUrl = getGeniusPayBaseUrl(db.gatewayConfig.env);
    const hostOrigin = req.get('origin') || (req.get('referer') ? new URL(req.get('referer')!).origin : null);
    const hostUrl = hostOrigin || process.env.APP_URL || `http://localhost:${PORT}`;
    const cleanHost = hostUrl.replace(/\/+$/, '');

    // Map operator to GeniusPay specific method code
    const methodMap: Record<string, string> = {
      wave: 'wave',
      orange_money: 'orange_money',
      mtn_momo: 'mtn_money',
      moov_money: 'moov_money',
      djamo_card: 'card',
    };
    const gpMethod = methodMap[paymentMethod] || undefined;

    const geniusPayPayload: any = {
      amount: order.totalAmount,
      currency: 'XOF',
      description: `Billet MALEDIKE PARTY (x${order.quantity}) - ${order.buyerName}`,
      customer: {
        name: order.buyerName || 'Client MALEDIKE',
        email: order.buyerEmail || 'billetterie@maledikeparty.com',
        phone: fullPhone,
      },
      success_url: `${cleanHost}/?payment=success&orderId=${order.id}`,
      error_url: `${cleanHost}/?payment=failed&orderId=${order.id}`,
      metadata: {
        orderId: order.id,
        userId: order.userId,
        quantity: order.quantity,
      },
    };

    if (gpMethod) {
      geniusPayPayload.payment_method = gpMethod;
    }

    let checkoutUrl = '';

    // Appel sécurisé à la passerelle avec la méthode de paiement sélectionnée
    let callRes = await callGeniusPayApi(`${gatewayUrl}/payments`, {
      method: 'POST',
      publicKey: db.gatewayConfig.publicKey,
      secretKey: db.gatewayConfig.secretKey,
      body: geniusPayPayload,
      timeoutMs: 15000,
      maxRetries: 2,
    });

    // Si échec avec l'opérateur direct (ex: temporaire 502 ou rejet d'un code opérateur spécifique),
    // retenter immédiatement sans restriction de méthode pour générer une session de paiement universelle GeniusPay
    if (!callRes.ok && gpMethod) {
      console.warn(`[GeniusPay] Échec méthode spécifique (${gpMethod}), bascule vers session universelle...`);
      delete geniusPayPayload.payment_method;
      const fallbackRes = await callGeniusPayApi(`${gatewayUrl}/payments`, {
        method: 'POST',
        publicKey: db.gatewayConfig.publicKey,
        secretKey: db.gatewayConfig.secretKey,
        body: geniusPayPayload,
        timeoutMs: 15000,
        maxRetries: 2,
      });
      if (fallbackRes.ok) {
        callRes = fallbackRes;
      }
    }

    if (!callRes.ok || !callRes.data) {
      console.error('Erreur API Genius Pay en mode réel :', callRes.errorText);
      const rawMsg = callRes.errorText || 'La passerelle de paiement a refusé la transaction.';
      let friendlyError = String(rawMsg);
      if (/invalid.*key|key.*invalid|unauthorized/i.test(friendlyError)) {
        friendlyError = "Clé API GeniusPay invalide ou non configurée pour le mode réel. Rendez-vous dans le panneau d'administration pour renseigner vos clés réelles.";
      }
      return res.status(callRes.status >= 400 && callRes.status < 600 ? callRes.status : 400).json({
        success: false,
        error: friendlyError,
        rawMessage: rawMsg,
      });
    }

    const result = callRes.data;
    checkoutUrl = result.data?.payment_url || result.data?.checkout_url || result.checkout_url || result.payment_url || '';
    if (result.data?.reference) {
      order.transactionReference = result.data.reference;
    }
    order.checkoutUrl = checkoutUrl;
    await persistOrder(order);
    saveDb(db);

    res.json({
      success: true,
      checkoutUrl,
      session: {
        transactionId: order.transactionReference,
        amount: order.totalAmount,
        currency: 'XOF',
        orderId: order.id,
        paymentMethod,
        checkoutUrl: checkoutUrl || null,
        gatewayConnected: true,
        env: db.gatewayConfig.env,
        publicKey: db.gatewayConfig.publicKey,
      },
    });
  } catch (err: any) {
    console.error('Erreur inattendue paiement :', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'La passerelle de paiement rencontre une instabilité temporaire. Veuillez réessayer dans quelques instants.' 
    });
  }
});

// Real Status Checker
app.get('/api/payments/status/:orderId', async (req, res) => {
  const user = await getVerifiedUser(req);
  if (!user) return res.status(401).json({error:'Authentification requise.'});
  const { orderId } = req.params;
  db = readDb();
  const order = await loadOrder(orderId);

  if (!order || order.userId !== user.id) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }

  res.setHeader('Cache-Control','no-store');
  if (order.status === 'completed') {
    const {tickets,digitalPurchases}=await loadOrderArtifacts(orderId);
    return res.json({status:'completed',order,tickets,digitalPurchases});
  }

  try {
    const gatewayUrl = getGeniusPayBaseUrl(db.gatewayConfig.env);
    const gpRes = await callGeniusPayApi(`${gatewayUrl}/payments/${order.transactionReference}`, {
      method: 'GET',
      publicKey: db.gatewayConfig.publicKey,
      secretKey: db.gatewayConfig.secretKey,
      timeoutMs: 8000,
      maxRetries: 1,
    });

    if (gpRes.ok && gpRes.data) {
      const gpData = gpRes.data;
      const gatewayStatus = gpData?.status || gpData?.data?.status;

      if (gatewayStatus === 'success' || gatewayStatus === 'completed') {
        await fulfillOrder(order);
        const {tickets,digitalPurchases}=await loadOrderArtifacts(orderId);
        return res.json({status:'completed',order,tickets,digitalPurchases});
      } else if (gatewayStatus === 'failed' || gatewayStatus === 'cancelled') {
        order.status = 'failed';
        saveDb(db);
        return res.json({ status: 'failed', order });
      }
    }
  } catch (err) {}

  res.json({
    status: order.status,
    order,
    expiresInSeconds: Math.max(0, Math.floor((order.reservationExpiresAt - Date.now()) / 1000)),
  });
});

// Webhook
app.post('/api/payments/geniuspay/webhook', async (req, res) => {
  try {
    const sigHeader = req.headers['x-geniuspay-signature'] || req.headers['x-signature'];
    const signature = Array.isArray(sigHeader) ? sigHeader[0] : (sigHeader as string | undefined);
    const rawBodyBuffer = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
    db = readDb();

    const verificationSecret = db.gatewayConfig.webhookSecret;
    if (!verificationSecret || !signature) return res.status(503).json({error:'Webhook non configuré de façon sécurisée.'});
    if (verificationSecret && signature) {
      const hmac = crypto.createHmac('sha256', verificationSecret);
      const expectedSig = hmac.update(rawBodyBuffer).digest('hex');
      if (!timingSafeEqual(expectedSig, signature.toLowerCase())) {
        console.error('Signature webhook invalide');
        return res.status(401).json({ error: 'Signature invalide' });
      }
    }

    const payload = req.body;
    const orderId = payload.data?.metadata?.orderId || payload.orderId || payload.metadata?.orderId;
    const status = payload.data?.status || payload.status || payload.event;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId manquant dans le webhook' });
    }

    const order = await loadOrder(orderId);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    if (!db.orders.some(o=>o.id===order.id)) db.orders.push(order);

    // Reject signed events whose amount/currency/reference contradict the persisted order.
    const webhookAmount = payload.data?.amount ?? payload.amount;
    if (webhookAmount !== undefined && Number(webhookAmount) !== order.totalAmount) {
      return res.status(400).json({error:'Montant du webhook incohérent.'});
    }
    const webhookCurrency = payload.data?.currency ?? payload.currency;
    if (webhookCurrency && !['XOF','FCFA'].includes(String(webhookCurrency).toUpperCase())) {
      return res.status(400).json({error:'Devise du webhook incohérente.'});
    }
    const webhookReference = payload.data?.reference ?? payload.reference ?? payload.data?.transaction_reference;
    if (webhookReference && order.transactionReference && String(webhookReference) !== String(order.transactionReference)) {
      return res.status(400).json({error:'Référence de transaction incohérente.'});
    }

    if (order.status === 'completed') {
      return res.json({ received: true, alreadyCompleted: true });
    }

    if (status === 'success' || status === 'completed' || status === 'payment.completed') {
      fulfillOrder(order);
      db.auditLogs.push({
        id: 'log_' + Date.now(),
        action: 'WEBHOOK_PAYMENT_CONFIRMED',
        details: { orderId, amount: order.totalAmount, reference: order.transactionReference },
        timestamp: new Date().toISOString(),
      });
      saveDb(db);
    } else if (status === 'failed' || status === 'cancelled') {
      order.status = 'failed';
      saveDb(db);
    }

    res.json({ received: true, status: order.status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Fulfill order atomically
async function fulfillOrder(order: any) {
  if (order.status === 'completed') return;

  order.status = 'completed';
  order.completedAt = new Date().toISOString();

  const currentTotal = db.tickets.length;
  for (let i = 0; i < order.quantity; i++) {
    const seq = (currentTotal + i + 1).toString().padStart(4, '0');
    const ticketId = 'tkt_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 6);
    const ticketNumber = `MLDK-2026-${seq}`;

    const rawToken = `${ticketId}:${order.userId}:${order.buyerEmail}:${Date.now()}:${db.gatewayConfig.secretKey.slice(-8)}`;
    const qrTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    db.tickets.push({
      id: ticketId,
      ticketNumber,
      orderId: order.id,
      userId: order.userId,
      attendeeName: order.buyerName,
      attendeeEmail: order.buyerEmail,
      attendeePhone: order.buyerWhatsApp,
      eventTitle: db.event.title,
      eventDate: db.event.date,
      eventTime: db.event.timeRange,
      price: order.unitPrice,
      category: order.category || 'pass_vip',
      categoryName: order.categoryName || 'Passe-Entrée VIP',
      qrTokenHash,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });
  }

  if (Array.isArray(order.digitalProductIds)) {
    for (const prodId of order.digitalProductIds) {
      const prod = db.digitalProducts.find(p => p.id === prodId);
      if (prod) {
        db.userDigitalPurchases.push({
          id: 'udp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          orderId: order.id,
          userId: order.userId,
          productId: prod.id,
          productTitle: prod.title,
          format: prod.format,
          fileName: prod.fileName,
          fileUrl: prod.fileUrl,
          downloadToken: crypto.randomBytes(16).toString('hex'),
          purchasedAt: new Date().toISOString(),
        });
      }
    }
  }

  saveDb(db);
  if (supabaseAdmin) {
    const tickets = db.tickets.filter(t => t.orderId === order.id).map(t => ({id:t.id,ticket_number:t.ticketNumber,order_id:t.orderId,user_id:t.userId,attendee_name:t.attendeeName,attendee_email:t.attendeeEmail,attendee_phone:t.attendeePhone,event_title:t.eventTitle,event_date:t.eventDate,event_time:t.eventTime,price:t.price,qr_token_hash:t.qrTokenHash,status:t.status,created_at:t.createdAt,checked_in_at:t.checkedInAt||null,checked_in_by_agent:t.checkedInByAgent||null}));
    const purchases = db.userDigitalPurchases.filter(p => p.orderId === order.id).map(p => ({id:p.id,user_id:p.userId,order_id:p.orderId,product_id:p.productId,product_title:p.productTitle,price:db.digitalProducts.find(x=>x.id===p.productId)?.price||0,format:p.format,file_name:p.fileName,file_url:p.fileUrl,download_token:p.downloadToken,purchased_at:p.purchasedAt}));
    const writes = [supabaseAdmin.from('orders').upsert(orderToRow(order),{onConflict:'id'}), ...(tickets.length?[supabaseAdmin.from('tickets').upsert(tickets,{onConflict:'id'})]:[]), ...(purchases.length?[supabaseAdmin.from('user_digital_purchases').upsert(purchases,{onConflict:'id'})]:[])];
    const results=await Promise.all(writes); const failure=results.find(r=>r.error); if(failure?.error) throw failure.error;
  }
}

// Secure Order Confirmation: Interdit la génération de billets sans vérification serveur
app.post('/api/orders/confirm', async (req, res) => {
  const user = await getVerifiedUser(req);
  if (!user) return res.status(401).json({success:false,error:'Authentification requise.'});
  const { orderId } = req.body || {};
  db = readDb();
  const order = await loadOrder(orderId);
  if (!order || order.userId !== user.id) return res.status(404).json({success:false,error:'Commande introuvable'});
  if (!db.orders.some(o=>o.id===order.id)) db.orders.push(order);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Commande introuvable' });
  }

  // 1. Si déjà complétée et vérifiée
  if (order.status === 'completed') {
    const {tickets,digitalPurchases}=await loadOrderArtifacts(orderId);
    return res.json({success:true,order,tickets,digitalPurchases});
  }

  // 2. Interrogation directe de la passerelle pour vérifier l'authenticité
  let isVerified = false;
  try {
    const gatewayUrl = getGeniusPayBaseUrl(db.gatewayConfig.env);
    const gpRes = await fetch(`${gatewayUrl}/payments/${order.transactionReference}`, {
      headers: {
        'X-API-Key': db.gatewayConfig.publicKey,
        'X-API-Secret': db.gatewayConfig.secretKey,
        'Authorization': `Bearer ${db.gatewayConfig.secretKey}`,
        'Accept': 'application/json',
      },
    });

    if (gpRes.ok) {
      const gpData = await gpRes.json();
      const gatewayStatus = gpData?.status || gpData?.data?.status;

      if (gatewayStatus === 'success' || gatewayStatus === 'completed' || gatewayStatus === 'paid') {
        isVerified = true;
      } else if (gatewayStatus === 'failed' || gatewayStatus === 'cancelled') {
        order.status = 'failed';
        saveDb(db);
        return res.status(400).json({
          success: false,
          error: 'Le paiement a été rejeté ou annulé par l\'opérateur Wave.',
        });
      }
    }
  } catch (err: any) {
    console.warn('Vérification passerelle:', err.message);
  }

  if (isVerified) {
    fulfillOrder(order);
    db.auditLogs.push({
      id: 'log_conf_' + Date.now(),
      action: 'ORDER_CONFIRMED_GATEWAY_CERTIFIED',
      details: { orderId: order.id, amount: order.totalAmount, reference: order.transactionReference },
      timestamp: new Date().toISOString(),
    });
    saveDb(db);

    const {tickets,digitalPurchases}=await loadOrderArtifacts(orderId);
    return res.json({success:true,order,tickets,digitalPurchases});
  }

  // SÉCURITÉ ABSOLUE : Si non validé par la passerelle officielle, AUCUN BILLET N'EST ÉMIS !
  return res.status(400).json({
    success: false,
    error: 'Paiement non confirmé. La transaction n\'a pas encore été validée sur votre application Wave.',
  });
});

// ----------------- 4. DIGITAL PRODUCTS & ADMIN PROTECTION -----------------
app.use('/api/admin', requireAdmin);

app.get('/api/digital-products', (_req, res) => {
  db = readDb();
  res.json(db.digitalProducts.filter(p => p.isActive));
});

app.post('/api/admin/digital-products', requireAdmin, (req, res) => {
  db = readDb();
  const { title, description, price, format, fileName, fileUrl } = req.body;
  if (!title || !price || !fileName) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  const newProd = {
    id: 'prod_' + Date.now(),
    title: title.trim(),
    description: (description || '').trim(),
    price: Number(price),
    format: format || 'PDF',
    fileName: fileName.trim(),
    fileUrl: fileUrl || `/assets/digital/${fileName}`,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  db.digitalProducts.push(newProd);
  saveDb(db);
  res.json({ success: true, product: newProd });
});

app.get('/api/digital-products/mine', async (req, res) => {
  const user=await getVerifiedUser(req);
  if(!user) return res.status(401).json({error:'Authentification requise.'});
  res.setHeader('Cache-Control','no-store');
  if(supabaseAdmin){
    const {data,error}=await supabaseAdmin.from('user_digital_purchases').select('*').eq('user_id',user.id).order('purchased_at',{ascending:false});
    if(error) return res.status(500).json({error:'Impossible de charger les achats.'});
    return res.json((data||[]).map(p=>({id:p.id,orderId:p.order_id,userId:p.user_id,productId:p.product_id,productTitle:p.product_title,format:p.format,fileName:p.file_name,fileUrl:p.file_url,downloadToken:p.download_token,purchasedAt:p.purchased_at})));
  }
  return res.json(db.userDigitalPurchases.filter(p=>p.userId===user.id));
});

app.get('/api/digital-products/download/:purchaseId', async (req, res) => {
  const user=await getVerifiedUser(req);
  if(!user) return res.status(401).send('Authentification requise.');
  const { purchaseId } = req.params;
  const token = req.query.token as string;
  db = readDb();

  let purchase:any;
  if(supabaseAdmin){
    const {data,error}=await supabaseAdmin.from('user_digital_purchases').select('*').eq('id',purchaseId).eq('user_id',user.id).maybeSingle();
    if(error) return res.status(500).send('Téléchargement indisponible.');
    if(data) purchase={id:data.id,userId:data.user_id,productTitle:data.product_title,format:data.format,fileName:data.file_name,fileUrl:data.file_url,downloadToken:data.download_token,purchasedAt:data.purchased_at};
  } else {
    purchase=db.userDigitalPurchases.find(p=>p.id===purchaseId&&p.userId===user.id);
  }
  if (!purchase) {
    return res.status(404).send('Produit numérique non trouvé.');
  }

  if (purchase.downloadToken !== token) {
    return res.status(403).send('Jeton de téléchargement invalide ou expiré.');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${purchase.fileName}"`);
  res.setHeader('Content-Type', purchase.format === 'PDF' ? 'application/pdf' : 'application/octet-stream');
  res.send(`MALÉDIKÉ PARTY 2026 - DOCUMENT OFFICIEL ACHETÉ
Produit: ${purchase.productTitle}
Format: ${purchase.format}
Titulaire: User ID ${purchase.userId}
Date d'achat: ${purchase.purchasedAt}
Billet sécurisé et accès VIP garantis.`);
});

// ----------------- 5. SCANNER TOKENIZED ACCESS LINKS -----------------
app.get('/api/admin/scanner-tokens', requireAdmin, async (_req, res) => {
  if(!supabaseAdmin) return res.status(503).json({error:'Supabase indisponible'});
  const {data,error}=await supabaseAdmin.from('scanner_tokens').select('id,agent_name,gate_name,event_id,is_active,created_at,last_used_at,scan_count').order('created_at',{ascending:false});
  if(error) return res.status(500).json({error:'Impossible de charger les scanners'});
  return res.json((data||[]).map(t=>({id:t.id,agentName:t.agent_name,gateName:t.gate_name,eventId:t.event_id,isActive:t.is_active,createdAt:t.created_at,lastUsedAt:t.last_used_at,scanCount:t.scan_count})));
});

app.post('/api/admin/scanner-tokens', requireAdmin, async (req, res) => {
  if(!supabaseAdmin) return res.status(503).json({error:'Supabase indisponible'});
  const {agentName,gateName}=req.body||{};
  if(typeof agentName!=='string'||!agentName.trim()) return res.status(400).json({error:"Nom de l'agent requis"});
  const tokenStr='sct_'+crypto.randomBytes(32).toString('hex');
  const row={id:'tok_'+crypto.randomUUID(),token:tokenStr,agent_name:agentName.trim(),gate_name:(typeof gateName==='string'&&gateName.trim())?gateName.trim():'Entrée Principale',event_id:'maledike-party-2026',is_active:true,scan_count:0};
  const {data,error}=await supabaseAdmin.from('scanner_tokens').insert(row).select('id,token,agent_name,gate_name,event_id,is_active,created_at,scan_count').single();
  if(error) return res.status(500).json({error:'Création du scanner impossible'});
  return res.json({success:true,scannerToken:{id:data.id,token:data.token,agentName:data.agent_name,gateName:data.gate_name,eventId:data.event_id,isActive:data.is_active,createdAt:data.created_at,scanCount:data.scan_count}});
});

app.post('/api/admin/scanner-tokens/revoke', requireAdmin, async (req, res) => {
  if(!supabaseAdmin) return res.status(503).json({error:'Supabase indisponible'});
  const {tokenId}=req.body||{};
  const {data,error}=await supabaseAdmin.from('scanner_tokens').update({is_active:false}).eq('id',tokenId).select('id,agent_name,gate_name,is_active').maybeSingle();
  if(error) return res.status(500).json({error:'Révocation impossible'});
  if(!data) return res.status(404).json({error:'Token introuvable'});
  return res.json({success:true,token:{id:data.id,agentName:data.agent_name,gateName:data.gate_name,isActive:data.is_active}});
});

app.get('/api/scanner/verify-token/:token', async (req, res) => {
  if(!supabaseAdmin) return res.status(503).json({error:'Scanner indisponible'});
  const token=String(req.params.token||'');
  const {data:tok,error}=await supabaseAdmin.from('scanner_tokens').select('id,agent_name,gate_name,event_id,is_active,created_at,last_used_at,scan_count').eq('token',token).eq('is_active',true).maybeSingle();
  if(error||!tok) return res.status(401).json({success:false,error:'Accès scanner non autorisé ou révoqué'});
  db=readDb();
  return res.json({valid:true,success:true,agentName:tok.agent_name,gateName:tok.gate_name,eventTitle:db.event.title,tokenInfo:{id:tok.id,agentName:tok.agent_name,gateName:tok.gate_name,eventId:tok.event_id,isActive:tok.is_active,scanCount:tok.scan_count}});
});

app.post('/api/tickets/agent-scan', async (req, res) => {
  if(!supabaseAdmin) return res.status(503).json({error:'Scanner indisponible'});
  const {qrTokenHash,scannerToken}=req.body||{};
  if(typeof scannerToken!=='string'||typeof qrTokenHash!=='string'||!qrTokenHash.trim()) return res.status(400).json({success:false,error:'Code QR ou scanner manquant'});
  let cleanInput=qrTokenHash.trim();
  try { if(cleanInput.startsWith('{')&&cleanInput.endsWith('}')){const parsed=JSON.parse(cleanInput);cleanInput=parsed.qrTokenHash||parsed.ticketNumber||cleanInput;} } catch {}
  const {data,error}=await supabaseAdmin.rpc('maledike_agent_scan',{p_code:cleanInput,p_scanner_token:scannerToken});
  if(error) return res.status(403).json({success:false,message:'Scan refusé ou service indisponible',error:'SCAN_REJECTED'});
  await supabaseAdmin.from('scanner_tokens').update({last_used_at:new Date().toISOString()}).eq('token',scannerToken).eq('is_active',true);
  return res.json(data);
});

app.get('/api/scanner/history/:token', async (req, res) => {
  if(!supabaseAdmin) return res.status(503).json({error:'Historique indisponible'});
  const token=String(req.params.token||'');
  const {data,error}=await supabaseAdmin.rpc('maledike_scanner_history',{p_scanner_token:token});
  if(error) return res.status(403).json({error:'Token non autorisé ou historique indisponible'});
  res.setHeader('Cache-Control','no-store');
  return res.json(data||[]);
});

// ----------------- 6. ANALYTICS -----------------
app.get('/api/admin/analytics', requireAdmin, (_req, res) => {
  db = readDb();
  const completedOrders = db.orders.filter(o => o.status === 'completed');
  const pendingOrders = db.orders.filter(o => o.status === 'pending');
  const failedOrders = db.orders.filter(o => o.status === 'failed' || o.status === 'cancelled');

  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalTicketsSold = db.tickets.filter(t => t.status !== 'cancelled').length;
  const checkedInCount = db.tickets.filter(t => t.status === 'checked_in').length;

  const hourlyMap: Record<string, { amount: number; count: number }> = {};
  for (let h = 0; h < 24; h++) {
    const label = `${String(h).padStart(2, '0')}h`;
    hourlyMap[label] = { amount: 0, count: 0 };
  }

  for (const o of completedOrders) {
    const d = new Date(o.completedAt || o.createdAt);
    const hourKey = `${String(d.getHours()).padStart(2, '0')}h`;
    if (hourlyMap[hourKey]) {
      hourlyMap[hourKey].amount += o.totalAmount;
      hourlyMap[hourKey].count += 1;
    }
  }

  const hourlySales = Object.entries(hourlyMap).map(([hour, data]) => ({
    hour,
    amount: data.amount,
    count: data.count,
  }));

  const operatorMap: Record<string, { count: number; amount: number; color: string }> = {
    wave: { count: 0, amount: 0, color: '#1DC4FF' },
    orange_money: { count: 0, amount: 0, color: '#FF7900' },
    mtn_momo: { count: 0, amount: 0, color: '#FFCC00' },
    moov_money: { count: 0, amount: 0, color: '#005CA9' },
    djamo_card: { count: 0, amount: 0, color: '#3A10E5' },
  };

  for (const o of completedOrders) {
    const op = o.paymentMethod || 'wave';
    if (operatorMap[op]) {
      operatorMap[op].count += 1;
      operatorMap[op].amount += o.totalAmount;
    }
  }

  const operatorData = Object.entries(operatorMap).map(([name, data]) => ({
    name: name === 'wave' ? 'Wave' : name === 'orange_money' ? 'Orange Money' : name === 'mtn_momo' ? 'MTN MoMo' : name === 'moov_money' ? 'Moov Money' : 'Djamo / CB',
    count: data.count,
    amount: data.amount,
    color: data.color,
  }));

  res.json({
    totalRevenueFcfa: totalRevenue,
    totalSalesCount: completedOrders.length,
    completedOrdersCount: completedOrders.length,
    pendingOrdersCount: pendingOrders.length,
    failedOrdersCount: failedOrders.length,
    totalTicketsSold,
    remainingStock: Math.max(0, db.event.totalCapacity - totalTicketsSold),
    checkedInCount,
    hourlySales,
    operatorData,
    recentOrders: completedOrders.slice(-5).reverse(),
  });
});

// ----------------- 7. GATEWAY CONFIG & TEST CLEANUP -----------------
app.get('/api/admin/gateway-config', requireAdmin, (_req, res) => {
  db = readDb();
  res.json({
    env: db.gatewayConfig.env,
    publicKey: '••••••••••••••••••••',
    secretKeyMasked: '••••••••••••••••••••',
    webhookSecretConfigured: Boolean(db.gatewayConfig.webhookSecret),
    isConfigured: Boolean(db.gatewayConfig.publicKey && db.gatewayConfig.secretKey),
  });
});

app.post('/api/admin/gateway-config', requireAdmin, (req, res) => {
  db = readDb();
  const { env, publicKey, secretKey, webhookSecret } = req.body;
  if (env && (env === 'sandbox' || env === 'production')) {
    db.gatewayConfig.env = env;
  }
  if (publicKey && !publicKey.includes('•••')) db.gatewayConfig.publicKey = publicKey.trim();
  if (secretKey && !secretKey.includes('•••')) db.gatewayConfig.secretKey = secretKey.trim();
  if (webhookSecret && !webhookSecret.includes('•••')) db.gatewayConfig.webhookSecret = webhookSecret.trim();

  saveDb(db);
  res.json({
    success: true,
    gatewayConfig: {
      env: db.gatewayConfig.env,
      publicKey: '••••••••••••••••••••',
      secretKeyMasked: '••••••••••••••••••••',
      webhookSecretConfigured: Boolean(db.gatewayConfig.webhookSecret),
    }
  });
});

app.post('/api/admin/purge-test-data', requireAdmin, (_req, res) => {
  db = readDb();
  const beforeCount = db.tickets.length;
  db.orders = [];
  db.tickets = [];
  db.auditLogs = [];

  saveDb(db);
  res.json({
    success: true,
    purgedCount: beforeCount,
    remainingTickets: 0,
  });
});

// ----------------- 8. TICKETS & USER PASSES -----------------
app.get('/api/tickets/mine', async (req, res) => {
  const user=await getVerifiedUser(req);
  if(!user) return res.status(401).json({error:'Authentification requise.'});
  res.setHeader('Cache-Control','no-store');
  if(supabaseAdmin){
    const {data,error}=await supabaseAdmin.from('tickets').select('*').eq('user_id',user.id).order('created_at',{ascending:false});
    if(error) return res.status(500).json({error:'Impossible de charger les billets.'});
    return res.json((data||[]).map(t=>({id:t.id,ticketNumber:t.ticket_number,orderId:t.order_id,userId:t.user_id,attendeeName:t.attendee_name,attendeeEmail:t.attendee_email,attendeePhone:t.attendee_phone,eventTitle:t.event_title,eventDate:t.event_date,eventTime:t.event_time,price:t.price,qrTokenHash:t.qr_token_hash,status:t.status,createdAt:t.created_at,checkedInAt:t.checked_in_at,checkedInByAgent:t.checked_in_by_agent})));
  }
  return res.json(db.tickets.filter(t=>t.userId===user.id));
});

app.post('/api/tickets/scan', (_req, res) => {
  // A public QR endpoint must never perform check-in; use tokenized agent scanning.
  return res.status(403).json({success:false,error:'Scanner autorisé requis. Utilisez le terminal agent.'});
  /*
  const { qrTokenHash } = req.body;
  if (!qrTokenHash) return res.status(400).json({ success: false, message: 'Code QR non fourni.' });

  db = readDb();
  const ticket = db.tickets.find(t => t.qrTokenHash === qrTokenHash.trim());

  if (!ticket) {
    return res.status(404).json({ success: false, message: 'BILLET INTROUVABLE OU NON VALIDE', error: 'NOT_FOUND' });
  }

  if (ticket.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'ATTENTION : BILLET ANNULÉ', error: 'CANCELLED', ticket });
  }

  if (ticket.status === 'checked_in') {
    return res.status(400).json({
      success: false,
      message: `DOUBLE ENTRÉE INTERDITE ! Billet déjà scanné le ${new Date(ticket.checkedInAt || '').toLocaleTimeString('fr-FR')}`,
      error: 'ALREADY_USED',
      ticket,
      alreadyCheckedInAt: ticket.checkedInAt,
    });
  }

  ticket.status = 'checked_in';
  ticket.checkedInAt = new Date().toISOString();
  saveDb(db);

  return res.json({ success: true, message: 'ACCÈS VALIDÉ ! Passe VIP autorisé.', ticket });
  */
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  db = readDb();
  res.json(db.orders.slice().reverse());
});

app.get('/api/admin/tickets', requireAdmin, (_req, res) => {
  db = readDb();
  res.json(db.tickets.slice().reverse());
});

app.post('/api/admin/tickets/cancel', requireAdmin, (req, res) => {
  const { ticketId } = req.body;
  db = readDb();
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket non trouvé' });
  ticket.status = 'cancelled';
  saveDb(db);
  res.json({ success: true, ticket });
});

// ----------------- VITE MIDDLEWARE / STATIC ASSETS -----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MALÉDIKÉ PARTY Production Server active at http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app, startServer };