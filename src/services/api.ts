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

const API_BASE = '/api';

// Parse les réponses API de façon robuste : les erreurs Vercel en texte/HTML ne doivent jamais déclencher « Unexpected token… ».
async function readApiJson<T = any>(res: Response): Promise<T> {
  const raw = await res.text();
  try { return JSON.parse(raw) as T; }
  catch { throw new Error(`Réponse API invalide (HTTP ${res.status}). ${raw.slice(0, 180) || 'Réponse vide'}`); }
}

function getAdminHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const user = api.getSavedUser();
  const headers: Record<string, string> = { ...extra };
  if (user?.email) {
    headers['x-admin-email'] = user.email.toLowerCase().trim();
  }
  return headers;
}

const STORAGE_KEYS = {
  USER: 'maledike_auth_user',
  PENDING_ORDER: 'maledike_pending_order',
  SPLASH_DISMISSED: 'maledike_splash_dismissed',
  SCANNER_TOKEN: 'maledike_agent_scanner_token',
};

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
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    });
    return readApiJson(res);
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
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(assets),
    });
    return res.json();
  },

  async uploadImage(file: File): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileData = reader.result as string;
          const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ fileData, fileName: file.name }),
          });
          const json = await res.json();
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
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await readApiJson(res);
    if (result.success && result.user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
    }
    return result;
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await readApiJson(res);
    if (result.success && result.user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
    }
    return result;
  },

  getSavedUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  logoutUser(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<{ success: boolean; user?: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data }),
    });
    const result = await res.json();
    if (result.success && result.user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
    }
    return result;
  },

  // 4. Orders & Genius Pay Real Gateway
  async createOrder(data: {
    userId: string;
    buyerName: string;
    buyerEmail: string;
    buyerWhatsApp: string;
    countryCode: string;
    quantity: number;
    digitalProductIds?: string[];
    category?: TicketCategory;
    categoryName?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string; geniusPayPublicKey?: string; env?: string }> {
    const res = await fetch(`${API_BASE}/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async initiateGeniusPayPayment(data: {
    orderId: string;
    paymentMethod: PaymentProvider;
    paymentPhone: string;
    countryCode: string;
  }): Promise<{ success: boolean; session?: any; checkoutUrl?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/payments/geniuspay/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async checkOrderStatus(orderId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    order?: Order;
    tickets?: Ticket[];
    digitalPurchases?: UserDigitalPurchase[];
    expiresInSeconds?: number;
  }> {
    const res = await fetch(`${API_BASE}/payments/status/${encodeURIComponent(orderId)}`);
    return res.json();
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
    return res.json();
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
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMyDigitalPurchases(userId: string): Promise<UserDigitalPurchase[]> {
    try {
      const res = await fetch(`${API_BASE}/digital-products/mine?userId=${encodeURIComponent(userId)}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getMyDigitalPurchases fallback', e);
    }
    return [];
  },

  // 6. Tickets & Check-in
  async getMyTickets(userId: string): Promise<{
    tickets: Ticket[];
    secretLocationRevealed: boolean;
    secretLocationAddress: string | null;
  }> {
    const res = await fetch(`${API_BASE}/tickets/mine?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },

  async scanTicket(qrTokenHash: string): Promise<CheckInResult> {
    const res = await fetch(`${API_BASE}/tickets/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrTokenHash }),
    });
    return res.json();
  },

  // 7. Scanner Access Tokens
  async getScannerTokens(): Promise<ScannerToken[]> {
    const res = await fetch(`${API_BASE}/admin/scanner-tokens`, {
      headers: getAdminHeaders(),
    });
    return res.json();
  },

  async createScannerToken(agentName: string, gateName?: string): Promise<{ success: boolean; scannerToken?: ScannerToken }> {
    const res = await fetch(`${API_BASE}/admin/scanner-tokens`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ agentName, gateName }),
    });
    return res.json();
  },

  async revokeScannerToken(tokenId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/scanner-tokens/revoke`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ tokenId }),
    });
    return res.json();
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
    return res.json();
  },

  async agentScanTicket(qrTokenHash: string, scannerToken: string): Promise<CheckInResult> {
    const res = await fetch(`${API_BASE}/tickets/agent-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrTokenHash, scannerToken }),
    });
    return res.json();
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
    const res = await fetch(`${API_BASE}/admin/analytics`, {
      headers: getAdminHeaders(),
    });
    return res.json();
  },

  async getAdminOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/admin/orders`, {
      headers: getAdminHeaders(),
    });
    return res.json();
  },

  async getAdminTickets(): Promise<Ticket[]> {
    const res = await fetch(`${API_BASE}/admin/tickets`, {
      headers: getAdminHeaders(),
    });
    return res.json();
  },

  async cancelTicket(ticketId: string): Promise<{ success: boolean; ticket?: Ticket }> {
    const res = await fetch(`${API_BASE}/admin/tickets/cancel`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ticketId }),
    });
    return res.json();
  },

  async getGatewayConfig(): Promise<{
    env: 'sandbox' | 'production';
    publicKey: string;
    secretKeyMasked: string;
    webhookSecretConfigured: boolean;
  }> {
    const res = await fetch(`${API_BASE}/admin/gateway-config`, {
      headers: getAdminHeaders(),
    });
    return res.json();
  },

  async updateGatewayConfig(config: Partial<GatewayConfig>): Promise<{ success: boolean; gatewayConfig?: GatewayConfig }> {
    const res = await fetch(`${API_BASE}/admin/gateway-config`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async purgeTestData(): Promise<{ success: boolean; purgedCount: number; remainingTickets: number }> {
    const res = await fetch(`${API_BASE}/admin/purge-test-data`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
    });
    return res.json();
  },

  // Splash Screen Session state
  isSplashDismissed(): boolean {
    return sessionStorage.getItem(STORAGE_KEYS.SPLASH_DISMISSED) === 'true';
  },

  setSplashDismissed(): void {
    sessionStorage.setItem(STORAGE_KEYS.SPLASH_DISMISSED, 'true');
  },
};
