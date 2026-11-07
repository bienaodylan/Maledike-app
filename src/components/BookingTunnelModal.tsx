import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X,
  Plus,
  Minus,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Smartphone,
  RotateCcw,
  Phone,
  Sparkles,
} from 'lucide-react';
import { EventConfig, UserProfile, Order, Ticket, PaymentProvider, DigitalProduct, TicketCategory, SALON_CATEGORIES } from '../types';
import { api } from '../services/api';
import { TicketPassCard } from './TicketPassCard';

interface BookingTunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventConfig & { remainingCount: number };
  currentUser: UserProfile | null;
  onRequireAuth: (pendingQuantity: number) => void;
  onOpenAccount: () => void;
  initialQuantity?: number;
  initialCategory?: TicketCategory;
}

const COUNTRY_CODES = [
  { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: '+221', country: 'Sénégal', flag: '🇸🇳' },
  { code: '+229', country: 'Bénin', flag: '🇧🇯' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+237', country: 'Cameroun', flag: '🇨🇲' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
];

// Liens officiels des portails et applications fournis par les opérateurs en Côte d'Ivoire
export const OPERATOR_OFFICIAL_LINKS: Record<PaymentProvider, { label: string; portalUrl: string; appName: string }> = {
  orange_money: {
    label: 'Portail Orange CI',
    portalUrl: 'https://www.orange.ci/',
    appName: 'Orange Money (Max it CI)',
  },
  djamo_card: {
    label: 'Portail Djamo CI',
    portalUrl: 'https://www.djamo.com/en-ci',
    appName: 'Djamo CI & Carte Visa',
  },
  mtn_momo: {
    label: 'Portail MTN MoMo',
    portalUrl: 'https://www.mtn.ci/momo/',
    appName: 'MTN MoMo CI',
  },
  moov_money: {
    label: 'Portail Moov Africa',
    portalUrl: 'https://www.moov-africa.ci/moov-money/?cookie_reset=',
    appName: 'Moov Money Flooz',
  },
  wave: {
    label: 'Portail Wave',
    portalUrl: 'https://pay.wave.com/',
    appName: 'Wave Mobile Money',
  },
};

// Protocoles de basculement automatique vers les applications mobiles des opérateurs lors de la sélection
export const OPERATOR_MOBILE_PROTOCOLS: Record<PaymentProvider, string> = {
  orange_money: 'orange-money://',
  mtn_momo: 'mtn-money://',
  moov_money: 'moov-money://',
  wave: 'wave://',
  djamo_card: 'djamo://',
};

// Codes USSD officiels d'autorisation et validation en Côte d'Ivoire
export const OPERATOR_USSD_CODES: Partial<Record<PaymentProvider, { code: string; label: string; dialUrl: string }>> = {
  orange_money: {
    code: '#144*82#',
    label: 'Composer #144*82#',
    dialUrl: 'tel:*144*82%23',
  },
  mtn_momo: {
    code: '*133#',
    label: 'Composer *133#',
    dialUrl: 'tel:*133%23',
  },
  moov_money: {
    code: '*155#',
    label: 'Composer *155#',
    dialUrl: 'tel:*155%23',
  },
};

// Fonction de résolution des liens de redirection directe vers les applications des opérateurs
export function getOperatorAppRedirectUrl(method: PaymentProvider, checkoutUrl?: string | null): string {
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  switch (method) {
    case 'orange_money':
      if (isAndroid) {
        return 'https://play.google.com/store/apps/details?id=com.orange.orangemoneyafrique';
      }
      if (isIOS) {
        return 'https://apps.apple.com/fr/app/orange-money-afrique/id1313536959';
      }
      return checkoutUrl || 'https://www.orange.ci/';

    case 'djamo_card':
      return checkoutUrl || 'https://www.djamo.com/en-ci';

    case 'mtn_momo':
      return checkoutUrl || 'https://www.mtn.ci/momo/';

    case 'moov_money':
      return checkoutUrl || 'https://www.moov-africa.ci/moov-money/?cookie_reset=';

    case 'wave':
      return checkoutUrl || 'https://pay.wave.com/';

    default:
      return checkoutUrl || 'https://www.orange.ci/';
  }
}

export const BookingTunnelModal: React.FC<BookingTunnelModalProps> = ({
  isOpen,
  onClose,
  event,
  currentUser,
  onRequireAuth,
  onOpenAccount,
  initialQuantity = 1,
  initialCategory = 'pass_vip',
}) => {
  // STRICT 5-STEP TUNNEL ARCHITECTURE
  // 1. Billets -> 2. Récapitulatif -> 3. Paiement -> 4. Autorisation du paiement -> 5. Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory>(initialCategory);
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+225');
  const [paymentPhone, setPaymentPhone] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentProvider>('wave');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [issuedTickets, setIssuedTickets] = useState<Ticket[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [gatewayEnv, setGatewayEnv] = useState<'sandbox' | 'production'>('production');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'failed' | 'completed'>('pending');

  // Digital Products add-on state
  const [availableDigitalProducts, setAvailableDigitalProducts] = useState<DigitalProduct[]>([]);
  const [selectedDigitalProductIds, setSelectedDigitalProductIds] = useState<string[]>([]);

  // 15-minute countdown for reservation lock
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number>(15 * 60);

  // Polling ref to safely clear interval
  const pollTimerRef = useRef<any>(null);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.countryCode) {
        setSelectedCountryCode(currentUser.countryCode);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialQuantity && initialQuantity > 0) {
      setQuantity(initialQuantity);
    }
  }, [initialQuantity]);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Load digital products for add-on selection
  useEffect(() => {
    api.getDigitalProducts().then(prods => setAvailableDigitalProducts(prods)).catch(() => {});
  }, []);

  // Tick lock timer down when in step 2, 3, or 4
  useEffect(() => {
    if (step >= 2 && step <= 4) {
      const timer = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setErrorMessage('Le délai de réservation de 15 minutes a expiré. Veuillez recommencer.');
            setStep(1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  // Clean up polling interval on unmount or step change
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const formatLockTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentCategoryConfig = SALON_CATEGORIES.find(c => c.id === selectedCategory) || SALON_CATEGORIES[0];
  const unitPrice = currentCategoryConfig.price;
  const ticketsAmount = quantity * unitPrice;
  const digitalAddonsAmount = selectedDigitalProductIds.reduce((sum, id) => {
    const p = availableDigitalProducts.find(prod => prod.id === id);
    return sum + (p ? p.price : 0);
  }, 0);
  const totalAmount = ticketsAmount + digitalAddonsAmount;

  const toggleDigitalProduct = (id: string) => {
    setSelectedDigitalProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // -------------------------------------------------------------
  // STEP 1 -> STEP 2: BILLET -> RÉCAPITULATIF
  // -------------------------------------------------------------
  const handleProceedToStep2 = async () => {
    setErrorMessage(null);
    if (!currentUser) {
      onRequireAuth(quantity);
      return;
    }

    if (quantity > event.remainingCount) {
      setErrorMessage(`Désolé, il ne reste que ${event.remainingCount} place(s) disponible(s).`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.createOrder({
        userId: currentUser.id,
        buyerName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        buyerEmail: currentUser.email,
        buyerWhatsApp: currentUser.whatsappNumber,
        countryCode: selectedCountryCode,
        quantity,
        category: selectedCategory,
        categoryName: currentCategoryConfig.name,
        digitalProductIds: selectedDigitalProductIds,
      });

      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setGatewayEnv(res.env === 'sandbox' ? 'sandbox' : 'production');
        setLockTimeRemaining(15 * 60);
        setStep(2);
      } else {
        setErrorMessage(res.error || 'Erreur lors de la création de la réservation.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur réseau');
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2 -> STEP 3: RÉCAPITULATIF -> PAIEMENT
  // -------------------------------------------------------------
  const handleProceedToStep3 = () => {
    setErrorMessage(null);
    setStep(3);
  };

  // -------------------------------------------------------------
  // SÉLECTION DE L'OPÉRATEUR & BASCULEMENT VERS L'APPLICATION MOBILE
  // -------------------------------------------------------------
  const handleSelectPaymentMethod = (method: PaymentProvider) => {
    setSelectedPaymentMethod(method);
    setErrorMessage(null);

    // Basculement automatique vers l'application mobile lors de la sélection (orange-money://, mtn-money://, moov-money://, wave://)
    const protocol = OPERATOR_MOBILE_PROTOCOLS[method];
    if (protocol && typeof window !== 'undefined') {
      try {
        const link = document.createElement('a');
        link.href = protocol;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          try {
            document.body.removeChild(link);
          } catch {}
        }, 1000);
      } catch {}
    }
  };

  // -------------------------------------------------------------
  // STEP 3 -> STEP 4: PAIEMENT -> REDIRECTION SÉCURISÉE OFFICIELLE
  // -------------------------------------------------------------
  const handleExecutePayment = async () => {
    if (!currentOrder) return;
    if (!paymentPhone.trim()) {
      setErrorMessage('Veuillez renseigner votre numéro de téléphone.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Création de la transaction officielle sur la passerelle
      const initRes = await api.initiateGeniusPayPayment({
        orderId: currentOrder.id,
        paymentMethod: selectedPaymentMethod,
        paymentPhone: paymentPhone.trim(),
        countryCode: selectedCountryCode,
      });

      if (!initRes.success) {
        const errorText = typeof initRes.error === 'string'
          ? initRes.error
          : (initRes.error && typeof initRes.error === 'object' && (initRes.error as any).message
              ? String((initRes.error as any).message)
              : 'Échec de l\'initialisation de la transaction sécurisée.');
        throw new Error(errorText);
      }

      // Déclenchement de l'application Wave directement sur smartphone sans quitter notre site
      if (typeof window !== 'undefined') {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          try {
            const waveLink = document.createElement('a');
            waveLink.href = 'wave://';
            waveLink.style.display = 'none';
            document.body.appendChild(waveLink);
            waveLink.click();
            setTimeout(() => {
              try { document.body.removeChild(waveLink); } catch {}
            }, 500);
          } catch {}
        }
      }

      if (initRes.session?.env) {
        setGatewayEnv(initRes.session.env);
      }

      // Transition immédiate vers l'étape 4 : En attente de la confirmation
      setPaymentStatus('pending');
      setIsProcessing(false);
      setStep(4);

      // Lancement de la vérification automatique
      startPaymentPolling(currentOrder.id);
    } catch (err: any) {
      setIsProcessing(false);
      const msg = typeof err === 'string'
        ? err
        : (typeof err?.message === 'string'
            ? err.message
            : (typeof err?.error === 'string'
                ? err.error
                : (err?.error?.message ? String(err.error.message) : 'Une erreur est survenue lors de la création de la transaction.')));
      setErrorMessage(msg);
    }
  };

  // Contrôle après retour de Mireza : la validation vient exclusivement du serveur/passerelle.
  const handlePaymentReturnCheck = async () => {
    if (!currentOrder || isProcessing) return;
    setIsProcessing(true); setErrorMessage(null);
    try {
      const result = await api.confirmPayment(currentOrder.id);
      if (result.success && result.tickets?.length) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setIssuedTickets(result.tickets); setPaymentStatus('completed'); setStep(5);
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#ec4899', '#f43f5e', '#ffffff'] });
      } else { setPaymentStatus('pending'); setErrorMessage(result.error || 'Paiement pas encore confirmé par la passerelle.'); }
    } catch (e: any) { setErrorMessage(e?.message || 'Vérification impossible. Réessayez.'); }
    finally { setIsProcessing(false); }
  };

  // Polling logic for Step 4
  const startPaymentPolling = (orderId: string) => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    let attempts = 0;
    const maxAttempts = 36; // 36 * 2.5s = 90 seconds timeout

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      try {
        const statusRes = await api.checkOrderStatus(orderId);

        // ONLY when status is completed: generate tickets and move to Step 5
        if (statusRes.status === 'completed' && statusRes.tickets && statusRes.tickets.length > 0) {
          clearInterval(pollTimerRef.current);
          setIssuedTickets(statusRes.tickets);
          setPaymentStatus('completed');
          setStep(5);

          // Celebration confetti
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#ec4899', '#f43f5e', '#ffffff'],
          });
        } else if (statusRes.status === 'failed' || statusRes.status === 'cancelled') {
          clearInterval(pollTimerRef.current);
          setPaymentStatus('failed');
          setErrorMessage('La transaction a été rejetée ou annulée par l\'opérateur.');
        } else if (attempts >= maxAttempts) {
          clearInterval(pollTimerRef.current);
          setPaymentStatus('pending');
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 2500);
  };

  const handleReset = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setStep(1);
    setCurrentOrder(null);
    setIssuedTickets([]);
    setErrorMessage(null);
    setCheckoutUrl(null);
    setPaymentStatus('pending');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
      {/* Dark blur backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-xl"
      />

      {/* Modal Container in Smoked Glass */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-xl rounded-3xl bg-[#0c0816]/95 border border-emerald-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden my-auto"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/40">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Passe-Entrée Sécurisé • Paiement Agréé
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase text-white font-display tracking-tight mt-0.5">
              MALEDIKE <span className="text-pink-400">PARTY</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* STRICT 5-STEP PROGRESS BAR */}
        <div className="px-3 sm:px-6 pt-3 pb-2 bg-black/30 border-b border-white/5">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center text-[8px] sm:text-[10px] font-black uppercase tracking-wider">
            <div className={`pb-1.5 border-b-2 transition-colors ${step >= 1 ? 'border-emerald-400 text-emerald-400' : 'border-white/10 text-white/40'}`}>
              1. Billets
            </div>
            <div className={`pb-1.5 border-b-2 transition-colors ${step >= 2 ? 'border-emerald-400 text-emerald-400' : 'border-white/10 text-white/40'}`}>
              2. Récap
            </div>
            <div className={`pb-1.5 border-b-2 transition-colors ${step >= 3 ? 'border-emerald-400 text-emerald-400' : 'border-white/10 text-white/40'}`}>
              3. Paiement
            </div>
            <div className={`pb-1.5 border-b-2 transition-colors ${step >= 4 ? 'border-emerald-400 text-emerald-400' : 'border-white/10 text-white/40'}`}>
              4. Autorisation
            </div>
            <div className={`pb-1.5 border-b-2 transition-colors ${step === 5 ? 'border-emerald-400 text-emerald-400' : 'border-white/10 text-white/40'}`}>
              5. Confirmation
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {/* ======================================================== */}
          {/* STEP 1: BILLETS & SALONS                                  */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-5">
              {/* Event Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-black/50 border border-white/10 flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">
                    Mireza Caribbean
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white uppercase font-display">
                    {currentCategoryConfig.name}
                  </h4>
                  <p className="text-xs text-white/60 mt-0.5">
                    Samedi 28 Nov. 2026 • 23H — 06H • Secret Location, Abidjan
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                    {event.remainingCount > 0 ? 'En stock' : 'Épuisé'}
                  </span>
                </div>
              </div>

              {/* Formules / Salons Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-2">
                  Sélectionnez votre formule (Pass ou Salon VIP)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {SALON_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'bg-black/50 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white">{cat.shortName}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          selectedCategory === cat.id ? 'bg-emerald-400 text-black' : 'bg-white/10 text-emerald-300'
                        }`}>
                          {cat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 line-clamp-1">{cat.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Quantity Selector */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/15">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase font-bold text-white/50 tracking-wider">
                      {currentCategoryConfig.name}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white font-display">
                      {unitPrice.toLocaleString()}{' '}
                      <span className="text-xs sm:text-sm font-semibold text-emerald-400">
                        FCFA / {selectedCategory === 'pass_vip' ? 'billet' : 'salon'}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-2.5 sm:gap-3 bg-black/70 p-1 rounded-xl border border-white/15">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-base sm:text-lg font-black text-white font-display w-6 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      disabled={quantity >= Math.min(10, event.remainingCount)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total & Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="text-[10px] sm:text-[11px] uppercase font-bold text-white/50 tracking-wider">
                    {quantity} {selectedCategory === 'pass_vip' ? `passe${quantity > 1 ? 's' : ''} VIP` : `salon${quantity > 1 ? 's' : ''}`}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-display">
                    {totalAmount.toLocaleString()} FCFA
                  </div>
                </div>

                <button
                  onClick={handleProceedToStep2}
                  disabled={isProcessing || event.remainingCount === 0}
                  className="w-full sm:w-auto glass-emerald-btn px-6 sm:px-8 py-3.5 rounded-xl text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl disabled:opacity-50"
                >
                  <span>{isProcessing ? 'Réservation...' : 'Continuer vers le Récapitulatif'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: RÉCAPITULATIF                                     */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-5">
              {/* 15-Minute Countdown Lock Notice */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Réservation temporaire verrouillée :</span>
                </div>
                <div className="font-mono text-sm sm:text-base font-black text-emerald-300">
                  {formatLockTimer(lockTimeRemaining)}
                </div>
              </div>

              {/* Order Recap */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="text-xs uppercase font-bold text-white/50 tracking-wider pb-2 border-b border-white/10">
                  Détail de la commande
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">{currentCategoryConfig.name} (x{quantity})</span>
                  <span className="font-bold text-white">{ticketsAmount.toLocaleString()} FCFA</span>
                </div>

                <div className="flex justify-between text-xs text-white/60">
                  <span>Frais de billetterie & passerelle sécurisée</span>
                  <span className="text-emerald-400 font-semibold">Offerts (0 FCFA)</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="font-bold text-white uppercase text-xs sm:text-sm">Total à payer</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 font-display">
                    {totalAmount.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-3.5 sm:px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>

                <button
                  onClick={handleProceedToStep3}
                  className="flex-1 glass-emerald-btn py-3.5 rounded-xl text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl"
                >
                  <span>Passer au Paiement</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: PAIEMENT (CHOIX OPÉRATEUR & NUMÉRO)              */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-5">
              {/* Phone Selector with Country Code */}
              <div>
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white/80 mb-1.5">
                  Numéro de Paiement Mobile Money
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedCountryCode}
                    onChange={e => setSelectedCountryCode(e.target.value)}
                    className="bg-black/70 border border-white/20 rounded-xl px-2.5 sm:px-3 py-2.5 sm:py-3 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code} className="bg-neutral-900 text-white">
                        {c.flag} {c.code} ({c.country})
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    placeholder="Entrez votre numéro de compte (ex: 07 08 09 10 11)"
                    value={paymentPhone}
                    onChange={e => setPaymentPhone(e.target.value)}
                    className="flex-1 bg-black/70 border border-white/20 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm font-semibold text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Exclusive Wave Mobile Money Provider Card */}
              <div className="space-y-3">
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white/80">
                  Moyen de Paiement Officiel & Garanti
                </label>

                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1DC4FF]/20 via-black/70 to-black/90 border border-[#1DC4FF]/40 shadow-[0_0_30px_rgba(29,196,255,0.2)]">
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1DC4FF] flex items-center justify-center p-1.5 shadow-lg shadow-[#1DC4FF]/30 shrink-0">
                      <img src="/assets/payment-logos/wave.png" alt="Wave" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-white text-base">Wave Mobile Money</h4>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#1DC4FF]/25 text-[#1DC4FF] border border-[#1DC4FF]/40 uppercase">
                          1% Frais
                        </span>
                      </div>
                      <p className="text-xs text-sky-200/80 mt-0.5">
                        Côte d'Ivoire & Sénégal • Débit sécurisé & validation instantanée
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Infoline Help note for other methods */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px] text-white/70">
                <span>Autre moyen ou assistance ? Infoline Mireza :</span>
                <a
                  href="https://wa.me/2250758988360?text=Bonjour%20Mireza%20Caribbean,%20je%20souhaite%20r%C3%A9server%20pour%20la%20Maledike%20Party."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>07 58 98 83 60</span>
                </a>
              </div>

              {/* Security Seal */}
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] text-white/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Passerelle chiffrée SSL 256 bits (Wave Mobile Money)</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  gatewayEnv === 'production' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {gatewayEnv === 'production' ? 'Paiement Sécurisé' : 'Mode Test'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={isProcessing}
                  className="px-3.5 sm:px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour</span>
                </button>

                <button
                  onClick={handleExecutePayment}
                  disabled={isProcessing}
                  className="flex-1 glass-emerald-btn py-3.5 rounded-xl text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-black" />
                  <span>
                    {isProcessing ? 'Création de la transaction...' : `Payer avec Wave (${totalAmount.toLocaleString()} FCFA)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: AUTORISATION & ATTENTE DE CONFIRMATION WAVE       */}
          {/* ======================================================== */}
          {step === 4 && (
            <div className="space-y-6 text-center py-6 sm:py-8">
              {/* Animated status badge */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#1DC4FF]/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-[#1DC4FF]/15 border-2 border-[#1DC4FF] flex items-center justify-center text-[#1DC4FF] shadow-[0_0_25px_rgba(29,196,255,0.4)]">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              </div>

              {/* Waiting messages */}
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black uppercase text-white font-display">
                  Paiement via Mireza en cours
                </h3>
                <p className="text-sm sm:text-base font-bold text-sky-300">
                  En attente de la confirmation de votre paiement...
                </p>
                <p className="text-xs text-white/60 max-w-sm mx-auto">
                  Veuillez valider le débit de <strong className="text-white">{totalAmount.toLocaleString()} FCFA</strong> dans votre application Mireza. Dès validation, vos billets et QR Codes sont générés automatiquement.
                </p>
              </div>

              {/* Live Status indicator */}
              <div className="p-4 rounded-2xl bg-black/60 border border-[#1DC4FF]/30 max-w-sm mx-auto space-y-2 text-left shadow-lg shadow-[#1DC4FF]/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">Validation automatique sécurisée</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Dès que Mireza confirme le débit, cette page se mettra à jour toute seule pour générer vos billets certifiés avec QR Code anti-fraude.
                </p>
              </div>

              {/* Mobile app trigger & modify options */}
              <div className="pt-2 max-w-sm mx-auto flex flex-col gap-2.5">
                <a
                  href="mireza://"
                  className="w-full py-3 px-4 rounded-xl bg-[#1DC4FF]/15 border border-[#1DC4FF]/30 hover:bg-[#1DC4FF]/25 text-[#1DC4FF] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Ouvrir l'application Mireza</span>
                </a>

                <button type="button" disabled={isProcessing} onClick={handlePaymentReturnCheck} className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors">
                  {isProcessing ? 'Vérification sécurisée…' : "J'ai confirmé mon paiement"}
                </button>
                <button type="button" onClick={() => setStep(3)} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors">Modifier le numéro ou la commande</button>
                {errorMessage && <p role="alert" className="text-amber-300 text-xs">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: CONFIRMATION & BILLETS (NO STARS / SPARKLES)      */}
          {/* ======================================================== */}
          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                {/* Clean geometric emerald seal badge without any stars/sparkles */}
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase text-white font-display tracking-tight">
                  RÉSERVATION CONFIRMÉE
                </h3>
                <p className="text-xs text-white/80 max-w-sm mx-auto">
                  Votre transaction a été validée et confirmée avec succès. Vos passes officiels avec QR Code crypté sont disponibles ci-dessous.
                </p>
              </div>

              {/* Tickets Render List */}
              <div className="space-y-5">
                {issuedTickets.map((t, idx) => (
                  <div key={t.id} className="pt-1">
                    {issuedTickets.length > 1 && (
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
                        Billet {idx + 1} sur {issuedTickets.length}
                      </div>
                    )}
                    <TicketPassCard
                      ticket={t}
                      secretLocationRevealed={event.isSecretLocationRevealed}
                      secretAddress={event.secretLocationAddress}
                    />
                  </div>
                ))}
              </div>

              {/* Bottom Navigation */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAccount();
                  }}
                  className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Voir dans Mon Compte
                </button>
                <button
                  onClick={handleReset}
                  className="w-full glass-emerald-btn py-3.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Terminer
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
