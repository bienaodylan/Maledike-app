/**
 * MALÉDIKÉ PARTY — Type Definitions
 */

export interface EventConfig {
  id: string;
  title: string;
  subtitle: string;
  date: string; // ISO or formatted date e.g. "28 Novembre 2026"
  targetDateIso: string; // "2026-11-28T23:00:00"
  timeRange: string; // "23H00 — 06H00"
  ticketPrice: number; // 10000 FCFA (tarif unique)
  currency: string; // "FCFA"
  totalCapacity: number; // e.g. 350
  soldCount: number;
  status: 'open' | 'sold_out';
  secretLocationAddress: string;
  isSecretLocationRevealed: boolean;
  conciergeWhatsApp: string; // "+2250150049489"
  conciergeDisplayPhone: string; // "+225 01 50 04 94 89"
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  whatsappNumber: string;
  countryCode: string; // e.g. "+225"
  role: 'user' | 'admin';
  createdAt: string;
}

export type PaymentProvider = 'wave' | 'orange_money' | 'mtn_momo' | 'moov_money' | 'djamo_card';

export type TicketCategory = 'pass_vip' | 'salon_twerk' | 'salon_pole_dance' | 'salon_sexy_nana';

export interface SalonCategoryConfig {
  id: TicketCategory;
  name: string;
  shortName: string;
  price: number;
  capacity: number;
  description: string;
  badge: string;
  color: string;
}

export const SALON_CATEGORIES: SalonCategoryConfig[] = [
  {
    id: 'pass_vip',
    name: 'Passe-Entrée Unique VIP',
    shortName: 'Pass VIP (1 place)',
    price: 10000,
    capacity: 1,
    description: 'Accès individuel certifié • Dancefloor & Bar VIP',
    badge: '10 000 FCFA',
    color: 'emerald',
  },
  {
    id: 'salon_twerk',
    name: 'Salon Twerk',
    shortName: 'Salon Twerk (5 places)',
    price: 50000,
    capacity: 5,
    description: '5 places assises privatives • Espace lounge réservé',
    badge: '50 000 FCFA',
    color: 'pink',
  },
  {
    id: 'salon_pole_dance',
    name: 'Salon Pole Dance',
    shortName: 'Salon Pole Dance (10 places)',
    price: 100000,
    capacity: 10,
    description: '10 places assises VIP privatives • Vue piste & service dédié',
    badge: '100 000 FCFA',
    color: 'purple',
  },
  {
    id: 'salon_sexy_nana',
    name: 'Salon Sexy Nana',
    shortName: 'Salon Sexy Nana (15 places)',
    price: 150000,
    capacity: 15,
    description: '15 places assises Ultra VIP • Carré d\'or prestige Mireza',
    badge: '150 000 FCFA',
    color: 'amber',
  },
];

export interface Order {
  id: string;
  userId: string;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsApp: string;
  countryCode: string;
  quantity: number;
  unitPrice: number; // 10000, 50000, 100000, 150000
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentProvider;
  paymentPhone: string;
  transactionReference: string;
  checkoutUrl?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  reservationExpiresAt: number; // timestamp ms (15 min countdown)
  createdAt: string;
  completedAt?: string;
  digitalProductIds?: string[];
  category?: TicketCategory;
  categoryName?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g. "MLDK-2026-0001"
  orderId: string;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  price: number;
  qrTokenHash: string; // unique cryptographically generated token
  status: 'confirmed' | 'checked_in' | 'cancelled';
  checkedInAt?: string;
  checkedInByAgent?: string;
  createdAt: string;
  category?: TicketCategory;
  categoryName?: string;
}

export interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  price: number; // in FCFA
  format: 'PDF' | 'PNG' | 'JPG' | 'JPEG' | 'ZIP';
  fileName: string;
  fileUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserDigitalPurchase {
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
}

export interface ScannerToken {
  id: string;
  token: string;
  agentName: string;
  gateName: string;
  eventId: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  scanCount: number;
}

export interface GatewayConfig {
  env: 'sandbox' | 'production';
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
}

export interface HourlySalesData {
  hour: string;
  amount: number;
  count: number;
}

export interface OperatorSalesData {
  name: string;
  count: number;
  amount: number;
  color: string;
}

export interface ScanLog {
  id: string;
  ticketNumber: string;
  attendeeName: string;
  agentName: string;
  gateName: string;
  timestamp: string;
  status: 'valid' | 'duplicate_rejected' | 'invalid';
  message: string;
}

export interface SiteAssets {
  backgroundImageUrl: string;
  heroFlyerUrl: string;
  moodImage1: string;
  moodImage2: string;
  galleryImages: string[];
}

export interface CheckInResult {
  success: boolean;
  message: string;
  ticket?: Ticket;
  alreadyCheckedInAt?: string;
  error?: string;
}
