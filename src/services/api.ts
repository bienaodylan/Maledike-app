/**
 * MALÉDIKÉ PARTY — Client API & Persistence Service
 */
import {
  EventConfig,
  SiteAssets,
  UserProfile,
  Order,
  Ticket,
  CheckInResult,
  PaymentProvider,
  TicketCategory,
  DigitalProduct,
  UserDigitalPurchase,
  ScannerToken,
  GatewayConfig,
  HourlySalesData,
  OperatorSalesData,
} from '../types';

import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

const API_BASE = '/api';

const STORAGE_KEYS = {
  USER: 'maledike_auth_user',
  PENDING_ORDER: 'maledike_pending_order',
  SPLASH_DISMISSED: 'maledike_splash_dismissed',
  SCANNER_TOKEN: 'maledike_agent_scanner_token',
};

/**
 * Lecture JSON tolérante : une réponse vide ou non-JSON (ex. route /api absente,
 * page HTML) ne lève plus "Unexpected end of JSON input" ; elle devient une erreur lisible.
 */
async function parseJson<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      success: false,
      error: `Le service est momentanément indisponible (code ${res.status}). Réessayez dans quelques instants.`,
    } as unknown as T;
  }
}

/** Traduit une erreur Supabase Auth en message clair pour le client. */
function translateAuthError(err: { message?: string; code?: string; status?: number } | null | undefined): string {
  if (!err) return 'Une erreur est survenue. Réessayez.';
  const code = (err.code || '').toLowerCase();
  const msg = (err.message || '').toLowerCase();

  if (code === 'user_already_exists' || msg.includes('already registered')) {
    return 'Un compte avec cette adresse email existe déjà. Connectez-vous.';
  }
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Adresse email non confirmée. Cliquez sur le lien reçu par email, puis connectez-vous.';
  }
  if (code === 'weak_password' || msg.includes('password should') || msg.includes('weak password')) {
    return 'Mot de passe trop faible : choisissez-en un plus long, avec des lettres et des chiffres.';
  }
  if (code === 'email_address_invalid' || msg.includes('invalid format') || msg.includes('unable to validate email')) {
    return 'Adresse email invalide.';
  }
  if (code === 'signup_disabled' || msg.includes('signups not allowed')) {
    return 'Les inscriptions sont momentanément fermées.';
  }
  if (code.includes('rate_limit') || msg.includes('rate limit') || err.status === 429) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed')) {
    return 'Connexion au serveur impossible. Vérifiez votre connexion internet et réessayez.';
  }
  return err.message || 'Une erreur est survenue. Réessayez.';
}

/** Construit le profil applicatif depuis l'utilisateur Supabase + tables profiles / user_roles. */
async function loadUserProfile(user: User): Promise<UserProfile> {
  const [profileRes, roleRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
  ]);

  const profile: any = profileRes.data || {};
  const meta: any = user.user_metadata || {};
  const rawRole = (roleRes.data as any)?.role;

  return {
    id: user.id,
    email: user.email || profile.email || '',
    firstName: profile.first_name || meta.firstName || '',
    lastName: profile.last_name || meta.lastName || '',
    whatsappNumber: profile.whatsapp_number || meta.whatsappNumber || '',
    countryCode: profile.country_code || meta.countryCode || '+225',
    role: rawRole === 'admin' || rawRole === 'founder' ? 'admin' : 'user',
    createdAt: profile.created_at || user.created_at,
  };
}

function cacheUser(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {
    /* stockage indisponible (navigation privée) : la session Supabase reste valable */
  }
}

export const api = {
  // 1. Event
  async getEvent(): Promise<EventConfig & { remainingCount: number }> {
    try {
      const res = await fetch(`${API_BASE}/event`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getEvent fallback', e);
    }
    return {
      id: 'maledike-party-2026',
      title: 'MALEDIKE PARTY',
      subtitle: 'Mireza Caribbean présente — Une nuit exclusive sans compromis au coeur d\'Abidjan.',
      date: 'Samedi 28 Novembre 2026',
      targetDateIso: '2026-11-28T23:00:00',
      timeRange: '23H00 — 06H00',
      ticketPrice: 10000,
      currency: 'FCFA',
      totalCapacity: 350,
      soldCount: 0,
      status: 'open',
      remainingCount: 350,
      secretLocationAddress: 'Villa Rêve d\'Émeraude, Zone Bld de Marseille, Biétry / Marcory, Abidjan (Accès filtré)',
      isSecretLocationRevealed: false,
      conciergeWhatsApp: '+2250150049489',
      conciergeDisplayPhone: '+225 01 50 04 94 89',
    };
  },

  async updateEvent(updates: Partial<EventConfig>): Promise<{ success: boolean; event: EventConfig }> {
    const res = await fetch(`${API_BASE}/event/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return parseJson(res);
  },

  // 2. Site Assets
  async getSiteAssets(): Promise<SiteAssets> {
    try {
      const res = await fetch(`${API_BASE}/site-assets`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getSiteAssets fallback', e);
    }
    return {
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
    };
  },

  async updateSiteAssets(assets: Partial<SiteAssets>): Promise<{ success: boolean; siteAssets: SiteAssets }> {
    const res = await fetch(`${API_BASE}/site-assets/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assets),
    });
    return parseJson(res);
  },

  async uploadImage(file: File): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileData = reader.result as string;
          const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileData, fileName: file.name }),
          });
          const json = await parseJson(res);
          resolve(json);
        } catch (err: any) {
          resolve({ success: false, error: err.message || 'Erreur réseau lors du téléversement' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Impossible de lire le fichier local' });
      };
      reader.readAsDataURL(file);
    });
  },

  // 3. Auth
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    whatsappNumber: string;
    countryCode?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const email = data.email.trim().toLowerCase();
      const countryCode = data.countryCode || '+225';

      const { data: signUp, error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          // Lues par le déclencheur SQL qui crée le profil et le rôle (fondateur = admin automatique)
          data: {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            whatsappNumber: data.whatsappNumber.trim(),
            countryCode,
          },
        },
      });

      if (error) return { success: false, error: translateAuthError(error) };

      // Quand la confirmation email est active, Supabase renvoie un faux utilisateur sans identité
      // si l'adresse est déjà inscrite (pas d'erreur explicite).
      if (signUp.user && Array.isArray(signUp.user.identities) && signUp.user.identities.length === 0) {
        return { success: false, error: 'Un compte avec cette adresse email existe déjà. Connectez-vous.' };
      }

      let sessionUser: User | null = signUp.session?.user ?? null;

      // Pas de session immédiate : on connecte directement le nouveau compte.
      if (!sessionUser) {
        const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });
        if (signInError) {
          const needsConfirmation =
            (signInError.code || '').toLowerCase() === 'email_not_confirmed' ||
            (signInError.message || '').toLowerCase().includes('email not confirmed');
          if (needsConfirmation) {
            return {
              success: false,
              error: 'Compte créé. Confirmez votre adresse email via le lien reçu, puis connectez-vous.',
            };
          }
          return { success: false, error: translateAuthError(signInError) };
        }
        sessionUser = signIn.user;
      }

      const user = await loadUserProfile(sessionUser);
      cacheUser(user);
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err) };
    }
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error || !data.user) return { success: false, error: translateAuthError(error) };

      const user = await loadUserProfile(data.user);
      cacheUser(user);
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err) };
    }
  },

  getSavedUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /** Recharge la session Supabase au démarrage ; nettoie le cache local si elle a expiré. */
  async restoreSession(): Promise<UserProfile | null> {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        localStorage.removeItem(STORAGE_KEYS.USER);
        return null;
      }
      const user = await loadUserProfile(data.session.user);
      cacheUser(user);
      return user;
    } catch {
      return api.getSavedUser();
    }
  },

  logoutUser(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
      /* ignore */
    }
    supabase.auth.signOut().catch(() => {});
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;
      if (!authUser || authUser.id !== userId) {
        return { success: false, error: 'Session expirée. Reconnectez-vous.' };
      }

      const updates: Record<string, string> = { updated_at: new Date().toISOString() };
      if (data.firstName !== undefined) updates.first_name = data.firstName.trim();
      if (data.lastName !== undefined) updates.last_name = data.lastName.trim();
      if (data.whatsappNumber !== undefined) updates.whatsapp_number = data.whatsappNumber.trim();
      if (data.countryCode !== undefined) updates.country_code = data.countryCode.trim();

      const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (error) return { success: false, error: 'Impossible d\'enregistrer le profil. Réessayez.' };

      const user = await loadUserProfile(authUser);
      cacheUser(user);
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: translateAuthError(err) };
    }
  },

  // 4. Orders & Genius Pay Real Gateway
  async createOrder(data: {
    userId: string; buyerName: string; buyerEmail: string; buyerWhatsApp: string; countryCode: string;
    quantity: number; digitalProductIds?: string[]; category?: TicketCategory; categoryName?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string; geniusPayPublicKey?: string; env?: string }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('create-order', { body: data });
      if (error) return { success: false, error: error.message || 'Impossible de créer la réservation.' };
      return result || { success: false, error: 'Réponse invalide du service de réservation.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Connexion au service de réservation impossible.' };
    }
  },

  async initiateGeniusPayPayment(data: {
    orderId: string; paymentMethod: PaymentProvider; paymentPhone: string; countryCode: string;
  }): Promise<{ success: boolean; session?: any; checkoutUrl?: string; error?: string }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('geniuspay-initiate', { body: data });
      if (error) return { success: false, error: error.message || 'Initialisation du paiement impossible.' };
      return result || { success: false, error: 'Réponse invalide de la passerelle de paiement.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Connexion à la passerelle de paiement impossible.' };
    }
  },

  async checkOrderStatus(orderId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    order?: Order; tickets?: Ticket[]; digitalPurchases?: UserDigitalPurchase[]; expiresInSeconds?: number;
  }> {
    try {
      const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (error || !order) return { status: 'failed' };
      const { data: tickets } = await supabase.from('tickets').select('*').eq('order_id', orderId);
      return { status: order.status, order: {
        id: order.id, userId: order.user_id, buyerName: order.buyer_name, buyerEmail: order.buyer_email,
        buyerWhatsApp: order.buyer_whatsapp, countryCode: order.country_code, quantity: order.quantity,
        unitPrice: order.unit_price, totalAmount: order.total_amount, currency: order.currency,
        paymentMethod: order.payment_method, paymentPhone: order.payment_phone, transactionReference: order.transaction_reference,
        checkoutUrl: order.checkout_url, status: order.status, reservationExpiresAt: Date.parse(order.reservation_expires_at),
        createdAt: order.created_at, completedAt: order.completed_at, digitalProductIds: order.digital_product_ids || [],
      }, tickets: (tickets || []).map((t:any)=>({id:t.id,ticketNumber:t.ticket_number,orderId:t.order_id,userId:t.user_id,attendeeName:t.attendee_name,attendeeEmail:t.attendee_email,attendeePhone:t.attendee_phone,eventTitle:t.event_title,eventDate:t.event_date,eventTime:t.event_time,price:t.price,qrTokenHash:t.qr_token_hash,status:t.status,createdAt:t.created_at,checkedInAt:t.checked_in_at,checkedInByAgent:t.checked_in_by_agent})) };
    } catch { return { status: 'failed' }; }
  },

  async confirmPayment(orderId: string, transactionId?: string): Promise<{
    success: boolean;
    order?: Order;
    tickets?: Ticket[];
    digitalPurchases?: UserDigitalPurchase[];
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/orders/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, transactionId }),
    });
    return parseJson(res);
  },

  // 5. Digital Products
  async getDigitalProducts(): Promise<DigitalProduct[]> {
    try {
      const res = await fetch(`${API_BASE}/digital-products`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getDigitalProducts fallback', e);
    }
    return [];
  },

  async createDigitalProduct(data: Partial<DigitalProduct>): Promise<{ success: boolean; product?: DigitalProduct }> {
    const res = await fetch(`${API_BASE}/admin/digital-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseJson(res);
  },

  async getMyDigitalPurchases(userId: string): Promise<UserDigitalPurchase[]> {
    try {
      // RLS : chaque utilisateur ne voit que ses propres achats
      const { data, error } = await supabase
        .from('user_digital_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });
      if (error || !data) return [];
      return data.map((p: any) => ({
        id: p.id,
        orderId: p.order_id,
        userId: p.user_id,
        productId: p.product_id,
        productTitle: p.product_title,
        format: p.format,
        fileName: p.file_name,
        fileUrl: p.file_url,
        downloadToken: p.download_token,
        purchasedAt: p.purchased_at,
      }));
    } catch (e) {
      console.warn('getMyDigitalPurchases error', e);
    }
    return [];
  },

  // 6. Tickets & Check-in
  async getMyTickets(userId: string): Promise<{
    tickets: Ticket[];
    secretLocationRevealed: boolean;
    secretLocationAddress: string | null;
  }> {
    try {
      // RLS : chaque utilisateur ne voit que ses propres billets
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      const tickets: Ticket[] = error || !data
        ? []
        : data.map((t: any) => ({
            id: t.id,
            ticketNumber: t.ticket_number,
            orderId: t.order_id,
            userId: t.user_id,
            attendeeName: t.attendee_name,
            attendeeEmail: t.attendee_email,
            attendeePhone: t.attendee_phone,
            eventTitle: t.event_title,
            eventDate: t.event_date,
            eventTime: t.event_time,
            price: t.price,
            qrTokenHash: t.qr_token_hash,
            status: t.status,
            checkedInAt: t.checked_in_at || undefined,
            checkedInByAgent: t.checked_in_by_agent || undefined,
            createdAt: t.created_at,
            category: t.category || 'pass_vip',
            categoryName: t.category_name || 'Passe-Entrée VIP',
          }));

      // L'adresse secrète n'est communiquée qu'aux détenteurs d'un billet, une fois révélée
      let revealed = false;
      let address: string | null = null;
      if (tickets.length > 0) {
        const { data: ev } = await supabase
          .from('event_config')
          .select('is_secret_location_revealed, secret_location_address')
          .limit(1)
          .maybeSingle();
        revealed = Boolean(ev?.is_secret_location_revealed);
        address = revealed ? ev?.secret_location_address ?? null : null;
      }

      return { tickets, secretLocationRevealed: revealed, secretLocationAddress: address };
    } catch (e) {
      console.warn('getMyTickets error', e);
      return { tickets: [], secretLocationRevealed: false, secretLocationAddress: null };
    }
  },

  async scanTicket(qrTokenHash: string): Promise<CheckInResult> {
    const res = await fetch(`${API_BASE}/tickets/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrTokenHash }),
    });
    return parseJson(res);
  },

  // 7. Scanner Access Tokens
  async getScannerTokens(): Promise<ScannerToken[]> {
    const res = await fetch(`${API_BASE}/admin/scanner-tokens`);
    const data = await parseJson<any>(res);
    return Array.isArray(data) ? data : [];
  },

  async createScannerToken(agentName: string, gateName?: string): Promise<{ success: boolean; scannerToken?: ScannerToken }> {
    const res = await fetch(`${API_BASE}/admin/scanner-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentName, gateName }),
    });
    return parseJson(res);
  },

  async revokeScannerToken(tokenId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/scanner-tokens/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId }),
    });
    return parseJson(res);
  },

  async verifyScannerToken(token: string): Promise<{
    valid: boolean;
    success: boolean;
    agentName?: string;
    gateName?: string;
    eventTitle?: string;
    tokenInfo?: ScannerToken;
    message?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/scanner/verify-token/${encodeURIComponent(token)}`);
    return parseJson(res);
  },

  async agentScanTicket(qrTokenHash: string, scannerToken: string): Promise<CheckInResult> {
    const res = await fetch(`${API_BASE}/tickets/agent-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrTokenHash, scannerToken }),
    });
    return parseJson(res);
  },

  async getScannerHistory(token: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/scanner/history/${encodeURIComponent(token)}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('getScannerHistory error', e);
    }
    return [];
  },

  // 8. Analytics & Admin
  async getAnalytics(): Promise<{
    totalRevenueFcfa: number;
    totalSalesCount: number;
    completedOrdersCount: number;
    pendingOrdersCount: number;
    failedOrdersCount: number;
    totalTicketsSold: number;
    remainingStock: number;
    checkedInCount: number;
    hourlySales: HourlySalesData[];
    operatorData: OperatorSalesData[];
    recentOrders: Order[];
  }> {
    const res = await fetch(`${API_BASE}/admin/analytics`);
    return parseJson(res);
  },

  async getAdminOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/admin/orders`);
    const data = await parseJson<any>(res);
    return Array.isArray(data) ? data : [];
  },

  async getAdminTickets(): Promise<Ticket[]> {
    const res = await fetch(`${API_BASE}/admin/tickets`);
    const data = await parseJson<any>(res);
    return Array.isArray(data) ? data : [];
  },

  async cancelTicket(ticketId: string): Promise<{ success: boolean; ticket?: Ticket }> {
    const res = await fetch(`${API_BASE}/admin/tickets/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId }),
    });
    return parseJson(res);
  },

  async getGatewayConfig(): Promise<{
    env: 'sandbox' | 'production';
    publicKey: string;
    secretKeyMasked: string;
    webhookSecretConfigured: boolean;
  }> {
    const res = await fetch(`${API_BASE}/admin/gateway-config`);
    return parseJson(res);
  },

  async updateGatewayConfig(config: Partial<GatewayConfig>): Promise<{ success: boolean; gatewayConfig?: GatewayConfig }> {
    const res = await fetch(`${API_BASE}/admin/gateway-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return parseJson(res);
  },

  async purgeTestData(): Promise<{ success: boolean; purgedCount: number; remainingTickets: number }> {
    const res = await fetch(`${API_BASE}/admin/purge-test-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return parseJson(res);
  },

  // Splash Screen Session state
  isSplashDismissed(): boolean {
    return sessionStorage.getItem(STORAGE_KEYS.SPLASH_DISMISSED) === 'true';
  },

  setSplashDismissed(): void {
    sessionStorage.setItem(STORAGE_KEYS.SPLASH_DISMISSED, 'true');
  },
};
