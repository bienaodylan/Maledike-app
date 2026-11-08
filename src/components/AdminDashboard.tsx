import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Ticket as TicketIcon,
  Users,
  Search,
  ScanLine,
  Image as ImageIcon,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  X,
  MapPin,
  Lock,
  Unlock,
  DollarSign,
  QrCode,
  Link as LinkIcon,
  Copy,
  Trash2,
  Plus,
  ExternalLink,
  FileText,
  Key,
  Database,
  Radio,
  Upload,
} from 'lucide-react';
import {
  EventConfig,
  SiteAssets,
  Order,
  Ticket,
  CheckInResult,
  UserProfile,
  ScannerToken,
  DigitalProduct,
  HourlySalesData,
  OperatorSalesData,
} from '../types';
import { api } from '../services/api';
import { TicketPassCard } from './TicketPassCard';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventConfig;
  siteAssets: SiteAssets;
  onEventUpdated: (updated: EventConfig) => void;
  onSiteAssetsUpdated: (updated: SiteAssets) => void;
  currentUser: UserProfile | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  event,
  siteAssets,
  onEventUpdated,
  onSiteAssetsUpdated,
  currentUser,
}) => {
  const isDylanAdmin = Boolean(
    currentUser &&
    currentUser.role === 'admin' &&
    currentUser.email?.toLowerCase().trim() === 'bienaodylan428@gmail.com'
  );
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(isDylanAdmin);

  type AdminTab = 'overview' | 'orders' | 'scanner' | 'scanner-links' | 'digital-products' | 'gateway' | 'customization';
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Stats & Analytics
  const [analytics, setAnalytics] = useState<{
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
  }>({
    totalRevenueFcfa: 0,
    totalSalesCount: 0,
    completedOrdersCount: 0,
    pendingOrdersCount: 0,
    failedOrdersCount: 0,
    totalTicketsSold: 0,
    remainingStock: event.totalCapacity,
    checkedInCount: 0,
    hourlySales: [],
    operatorData: [],
    recentOrders: [],
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketForPreview, setSelectedTicketForPreview] = useState<Ticket | null>(null);

  // Scanner direct state
  const [scanInputHash, setScanInputHash] = useState('');
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Scanner Tokens Management
  const [scannerTokens, setScannerTokens] = useState<ScannerToken[]>([]);
  const [newAgentName, setNewAgentName] = useState('');
  const [newGateName, setNewGateName] = useState('Entrée Principale VIP');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Digital Products Management
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(2500);
  const [newProdFormat, setNewProdFormat] = useState<'PDF' | 'ZIP' | 'PNG' | 'JPG'>('PDF');
  const [newProdFileName, setNewProdFileName] = useState('');

  // Gateway Config & Maintenance
  const [gatewayConfig, setGatewayConfig] = useState<{
    env: 'sandbox' | 'production';
    publicKey: string;
    secretKeyMasked: string;
    webhookSecretConfigured: boolean;
  }>({
    env: 'production',
    publicKey: '',
    secretKeyMasked: '',
    webhookSecretConfigured: false,
  });
  const [newPublicKeyInput, setNewPublicKeyInput] = useState('');
  const [newSecretKeyInput, setNewSecretKeyInput] = useState('');
  const [newWebhookSecretInput, setNewWebhookSecretInput] = useState('');
  const [isUpdatingGateway, setIsUpdatingGateway] = useState(false);
  const [gatewayUpdateMsg, setGatewayUpdateMsg] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccessMsg, setPurgeSuccessMsg] = useState<string | null>(null);

  // Customization state
  const [editCapacity, setEditCapacity] = useState(event.totalCapacity);
  const [editTicketPrice, setEditTicketPrice] = useState(event.ticketPrice);
  const [editSecretAddress, setEditSecretAddress] = useState(event.secretLocationAddress);
  const [editRevealSecret, setEditRevealSecret] = useState(event.isSecretLocationRevealed);

  const [editBgUrl, setEditBgUrl] = useState(siteAssets.backgroundImageUrl);
  const [editFlyerUrl, setEditFlyerUrl] = useState(siteAssets.heroFlyerUrl);
  const [editMood1Url, setEditMood1Url] = useState(siteAssets.moodImage1);
  const [editMood2Url, setEditMood2Url] = useState(siteAssets.moodImage2);
  const [editGalleryImages, setEditGalleryImages] = useState<string[]>(siteAssets.galleryImages || []);
  const [newGalleryImgInput, setNewGalleryImgInput] = useState('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setEditBgUrl(siteAssets.backgroundImageUrl);
    setEditFlyerUrl(siteAssets.heroFlyerUrl);
    setEditMood1Url(siteAssets.moodImage1);
    setEditMood2Url(siteAssets.moodImage2);
    setEditGalleryImages(siteAssets.galleryImages || []);
  }, [siteAssets]);

  useEffect(() => {
    setIsAdminAuthenticated(isDylanAdmin);
  }, [isDylanAdmin]);

  const loadDashboardData = async () => {
    if (!isDylanAdmin) return;
    try {
      const [analyticsData, ordersData, ticketsData, tokensData, prodsData, gwData] = await Promise.all([
        api.getAnalytics(),
        api.getAdminOrders(),
        api.getAdminTickets(),
        api.getScannerTokens(),
        api.getDigitalProducts(),
        api.getGatewayConfig(),
      ]);
      setAnalytics(analyticsData);
      setOrders(ordersData);
      setTickets(ticketsData);
      setScannerTokens(tokensData);
      setDigitalProducts(prodsData);
      setGatewayConfig(gwData);
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  useEffect(() => {
    if (isOpen && isAdminAuthenticated && isDylanAdmin) {
      loadDashboardData();
    }
  }, [isOpen, isAdminAuthenticated, isDylanAdmin]);

  // Perform atomic Check-in Scan
  const handlePerformScan = async (hashToScan?: string) => {
    const token = (hashToScan || scanInputHash).trim();
    if (!token) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await api.scanTicket(token);
      setScanResult(res);
      if (res.success) {
        setScanInputHash('');
        loadDashboardData();
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || 'Erreur lors de la validation du billet.',
        error: 'NETWORK_ERROR',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Create Scanner Token
  const handleCreateScannerToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    try {
      const res = await api.createScannerToken(newAgentName.trim(), newGateName.trim());
      if (res.success && res.scannerToken) {
        setScannerTokens(prev => [res.scannerToken!, ...prev]);
        setNewAgentName('');
      }
    } catch (err) {
      console.error('Failed to create scanner token', err);
    }
  };

  // Revoke Scanner Token
  const handleRevokeToken = async (tokenId: string) => {
    try {
      const res = await api.revokeScannerToken(tokenId);
      if (res.success) {
        setScannerTokens(prev =>
          prev.map(t => (t.id === tokenId ? { ...t, isActive: false } : t))
        );
      }
    } catch (err) {
      console.error('Failed to revoke scanner token', err);
    }
  };

  // Copy Scanner Link
  const handleCopyScannerLink = (token: string, id: string) => {
    const origin = window.location.origin;
    const scannerUrl = `${origin}/scanner?token=${token}`;
    navigator.clipboard.writeText(scannerUrl);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  // Create Digital Product
  const handleCreateDigitalProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdTitle.trim() || !newProdFileName.trim()) return;

    try {
      const res = await api.createDigitalProduct({
        title: newProdTitle.trim(),
        description: newProdDesc.trim(),
        price: Number(newProdPrice),
        format: newProdFormat,
        fileName: newProdFileName.trim(),
      });
      if (res.success && res.product) {
        setDigitalProducts(prev => [res.product!, ...prev]);
        setNewProdTitle('');
        setNewProdDesc('');
        setNewProdFileName('');
      }
    } catch (err) {
      console.error('Failed to create digital product', err);
    }
  };

  // Toggle Gateway Environment
  const handleToggleGatewayEnv = async (newEnv: 'sandbox' | 'production') => {
    try {
      const res = await api.updateGatewayConfig({ env: newEnv });
      if (res.success && res.gatewayConfig) {
        setGatewayConfig(prev => ({ ...prev, env: res.gatewayConfig!.env }));
      }
    } catch (err) {
      console.error('Failed to update gateway config', err);
    }
  };

  // Safe update for gateway API keys without exposing secrets
  const handleUpdateGatewayKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingGateway(true);
    setGatewayUpdateMsg(null);
    try {
      const payload: any = {};
      if (newPublicKeyInput.trim()) payload.publicKey = newPublicKeyInput.trim();
      if (newSecretKeyInput.trim()) payload.secretKey = newSecretKeyInput.trim();
      if (newWebhookSecretInput.trim()) payload.webhookSecret = newWebhookSecretInput.trim();

      const res = await api.updateGatewayConfig(payload);
      if (res.success) {
        setGatewayUpdateMsg('Clés d\'API de la passerelle mises à jour et protégées avec succès.');
        setNewPublicKeyInput('');
        setNewSecretKeyInput('');
        setNewWebhookSecretInput('');
        loadDashboardData();
      }
    } catch (err: any) {
      setGatewayUpdateMsg('Erreur lors de la mise à jour des clés : ' + err.message);
    } finally {
      setIsUpdatingGateway(false);
    }
  };

  // Purge Test Data
  const handlePurgeTestData = async () => {
    if (!window.confirm('Voulez-vous vraiment purger toutes les commandes et billets de test simulés ? Cette action est irréversible.')) {
      return;
    }
    setIsPurging(true);
    setPurgeSuccessMsg(null);
    try {
      const res = await api.purgeTestData();
      if (res.success) {
        setPurgeSuccessMsg(`${res.purgedCount} éléments de test purgés. Billets restants réels : ${res.remainingTickets}.`);
        loadDashboardData();
      }
    } catch (err: any) {
      setPurgeSuccessMsg('Erreur lors de la purge : ' + err.message);
    } finally {
      setIsPurging(false);
    }
  };

  // Save Event Configuration & All Site Visual Assets
  const handleSaveEventCustomization = async () => {
    setIsSavingCustom(true);
    try {
      const updated = await api.updateEvent({
        totalCapacity: editCapacity,
        ticketPrice: editTicketPrice,
        secretLocationAddress: editSecretAddress,
        isSecretLocationRevealed: editRevealSecret,
      });

      const updatedAssets = await api.updateSiteAssets({
        backgroundImageUrl: editBgUrl,
        heroFlyerUrl: editFlyerUrl,
        moodImage1: editMood1Url,
        moodImage2: editMood2Url,
        galleryImages: editGalleryImages,
      });

      if (updated.success) onEventUpdated(updated.event);
      if (updatedAssets.success) onSiteAssetsUpdated(updatedAssets.siteAssets);

      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to save customization', err);
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleAddGalleryImage = (urlToAdd?: string) => {
    const url = (urlToAdd || newGalleryImgInput).trim();
    if (!url) return;
    if (!editGalleryImages.includes(url)) {
      setEditGalleryImages(prev => [...prev, url]);
    }
    setNewGalleryImgInput('');
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setEditGalleryImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'flyer' | 'bg' | 'mood1' | 'mood2' | 'gallery'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingTarget(target);
    setUploadError(null);

    try {
      if (target === 'gallery') {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const res = await api.uploadImage(file);
          if (res.success && res.url) {
            setEditGalleryImages(prev => [...prev, res.url!]);
          } else {
            setUploadError(res.error || 'Erreur lors du téléversement de la photo');
          }
        }
      } else {
        const file = files[0];
        const res = await api.uploadImage(file);
        if (res.success && res.url) {
          if (target === 'flyer') setEditFlyerUrl(res.url);
          else if (target === 'bg') setEditBgUrl(res.url);
          else if (target === 'mood1') setEditMood1Url(res.url);
          else if (target === 'mood2') setEditMood2Url(res.url);
        } else {
          setUploadError(res.error || 'Erreur lors du téléversement du visuel');
        }
      }
    } catch (err: any) {
      setUploadError(err.message || 'Erreur inconnue lors du téléversement');
    } finally {
      setUploadingTarget(null);
      e.target.value = '';
    }
  };

  // Filter orders or tickets
  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.buyerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.transactionReference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTickets = tickets.filter(t =>
    t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.attendeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.attendeeEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.qrTokenHash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="min-h-screen w-full bg-[#080512] text-white flex flex-col z-50">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-[#0d0918]/95 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Administration Centrale
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                gatewayConfig.env === 'production' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
              }`}>
                GeniusPay {gatewayConfig.env}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black uppercase text-white font-display tracking-tight mt-0.5">
              MALÉDIKÉ PARTY <span className="text-pink-400">PAGE D'ADMINISTRATION</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {isAdminAuthenticated && (
            <button
              onClick={loadDashboardData}
              className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white cursor-pointer transition-colors"
              title="Actualiser les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase flex items-center gap-2 cursor-pointer transition-colors shadow-md"
          >
            <span>← Retour au site public</span>
          </button>
        </div>
      </header>

      {/* Main Admin Page Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col">

        {/* AUTH GATEWAY SCREEN IF NOT LOGGED IN */}
        {!isAdminAuthenticated ? (
          <div className="p-8 sm:p-14 text-center max-w-md mx-auto my-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase text-white font-display tracking-tight">
                Accès Strictement Restreint
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Ce portail d'administration et de gestion des finances est strictement réservé au compte super-administrateur (<span className="text-emerald-400 font-bold font-mono">bienaodylan428@gmail.com</span>).
              </p>
              <p className="text-[11px] text-white/40">
                Les comptes abonnés et visiteurs ne sont pas autorisés à accéder à cet espace.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full glass-emerald-btn py-3.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-xl"
              >
                ← Retourner au site public
              </button>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED TABS & VIEWS */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Horizontal Tabs Menu */}
            <div className="flex items-center gap-1 sm:gap-2 px-6 pt-3 border-b border-white/10 bg-black/30 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Analytics & Ventes</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <TicketIcon className="w-4 h-4" />
                <span>Commandes & Billets ({tickets.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('scanner-links')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'scanner-links'
                    ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>Liens Scanner ({scannerTokens.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('digital-products')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'digital-products'
                    ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Produits Numériques ({digitalProducts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('gateway')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'gateway'
                    ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Passerelle & Nettoyage</span>
              </button>

              <button
                onClick={() => setActiveTab('scanner')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'scanner'
                    ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <ScanLine className="w-4 h-4" />
                <span>Scanner Direct</span>
              </button>

              <button
                onClick={() => setActiveTab('customization')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'customization'
                    ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Lieu & Visuels</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-6">
              {/* ================= 1. OVERVIEW & CHARTS ================= */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                        Chiffre d'Affaires Réel
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white font-display">
                        {analytics.totalRevenueFcfa.toLocaleString()}{' '}
                        <span className="text-xs font-bold text-emerald-400">FCFA</span>
                      </div>
                      <div className="text-[10px] text-white/50">
                        {analytics.completedOrdersCount} commande(s) confirmée(s)
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                        Billets Vendus
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white font-display">
                        {analytics.totalTicketsSold}{' '}
                        <span className="text-xs font-bold text-white/40">/ {event.totalCapacity}</span>
                      </div>
                      <div className="text-[10px] text-emerald-300">
                        {analytics.remainingStock} place(s) restante(s)
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                        Entrées Validées au Filtrage
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white font-display">
                        {analytics.checkedInCount}{' '}
                        <span className="text-xs font-bold text-white/40">
                          ({analytics.totalTicketsSold > 0 ? Math.round((analytics.checkedInCount / analytics.totalTicketsSold) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="text-[10px] text-white/50">
                        Double-entrée bloquée automatiquement
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">
                        Passerelle de Paiement
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
                        <span className="capitalize">{gatewayConfig.env}</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Clés chiffrées & protégées</span>
                      </div>
                    </div>
                  </div>

                  {/* Recharts: Hourly Sales Graph & Operator Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Hourly Sales Area Chart */}
                    <div className="lg:col-span-2 p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black uppercase text-white font-display">
                            Volume des Ventes par Heure (24H)
                          </h4>
                          <p className="text-[11px] text-white/50">
                            Montant cumulé des réservations validées en FCFA
                          </p>
                        </div>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.hourlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="hour" stroke="#666" fontSize={10} />
                            <YAxis stroke="#666" fontSize={10} tickFormatter={val => `${val / 1000}k`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#10b981', borderRadius: '12px', fontSize: '11px' }}
                              formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`, 'Chiffre d\'affaires']}
                            />
                            <Area
                              type="monotone"
                              dataKey="amount"
                              stroke="#10b981"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#emeraldGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Operator Distribution Pie Chart */}
                    <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
                      <div>
                        <h4 className="text-sm font-black uppercase text-white font-display">
                          Répartition par Opérateur
                        </h4>
                        <p className="text-[11px] text-white/50">
                          Wave, Orange Money, MTN, Moov, Djamo/CB
                        </p>
                      </div>

                      <div className="h-48 w-full flex items-center justify-center">
                        {analytics.operatorData.some(d => d.count > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.operatorData.filter(d => d.count > 0)}
                                dataKey="amount"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={65}
                                innerRadius={35}
                                paddingAngle={3}
                              >
                                {analytics.operatorData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px', fontSize: '10px' }}
                                formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`, 'Total']}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-xs text-white/40 text-center">
                            En attente des premières transactions
                          </div>
                        )}
                      </div>

                      {/* Legend List */}
                      <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
                        {analytics.operatorData.map(op => (
                          <div key={op.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: op.color }} />
                              <span className="text-white/80">{op.name}</span>
                            </div>
                            <span className="font-mono text-white/60 font-semibold">{op.count} tx</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 2. ORDERS & TICKETS ================= */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, email, billet..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-black/60 text-white/50 uppercase text-[10px] tracking-wider border-b border-white/10">
                          <tr>
                            <th className="p-3.5">Numéro Billet</th>
                            <th className="p-3.5">Acheteur VIP</th>
                            <th className="p-3.5">WhatsApp / Contact</th>
                            <th className="p-3.5">Statut Filtrage</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredTickets.map(t => (
                            <tr key={t.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-emerald-400">
                                {t.ticketNumber}
                              </td>
                              <td className="p-3.5">
                                <div className="font-bold text-white">{t.attendeeName}</div>
                                <div className="text-[10px] text-white/50">{t.attendeeEmail}</div>
                              </td>
                              <td className="p-3.5 font-mono text-white/80">
                                {t.attendeePhone || '—'}
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                    t.status === 'checked_in'
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                      : t.status === 'confirmed'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  }`}
                                >
                                  {t.status === 'checked_in' ? 'Entrée Validée' : t.status === 'confirmed' ? 'Valide' : 'Annulé'}
                                </span>
                                {t.checkedInAt && (
                                  <div className="text-[9px] text-white/40 mt-0.5">
                                    {new Date(t.checkedInAt).toLocaleTimeString('fr-FR')}
                                  </div>
                                )}
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => setSelectedTicketForPreview(t)}
                                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white cursor-pointer"
                                  title="Aperçu Pass Sécurisé"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredTickets.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-white/40">
                                Aucun billet trouvé.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 3. SCANNER TOKENS & LINKS ================= */}
              {activeTab === 'scanner-links' && (
                <div className="space-y-6">
                  {/* Create New Scanner Link Card */}
                  <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
                    <div>
                      <h4 className="text-sm font-black uppercase text-white font-display">
                        Générer un Lien d'Accès Scanner Sécurisé
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">
                        Les agents d'accueil accèdent directement à l'interface de contrôle sans voir les finances ni les données sensibles.
                      </p>
                    </div>

                    <form onSubmit={handleCreateScannerToken} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Nom de l'agent (ex: Agent Jean, Garde Marc)"
                        value={newAgentName}
                        onChange={e => setNewAgentName(e.target.value)}
                        className="bg-black/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Porte / Poste (ex: Entrée Principale VIP, Coupe-File)"
                        value={newGateName}
                        onChange={e => setNewGateName(e.target.value)}
                        className="bg-black/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        className="glass-emerald-btn py-2.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Créer le Lien d'Accès</span>
                      </button>
                    </form>
                  </div>

                  {/* Active Tokens List */}
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        Postes de Filtrage Autorisés ({scannerTokens.length})
                      </span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {scannerTokens.map(tok => {
                        const origin = window.location.origin;
                        const linkUrl = `${origin}/scanner?token=${tok.token}`;
                        const isCopied = copiedTokenId === tok.id;

                        return (
                          <div key={tok.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${tok.isActive ? 'bg-emerald-400' : 'bg-red-500'}`} />
                                <span className="font-extrabold text-white text-sm">{tok.gateName}</span>
                                <span className="text-xs text-white/60">• {tok.agentName}</span>
                              </div>
                              <div className="text-[11px] font-mono text-emerald-400 truncate max-w-md">
                                {linkUrl}
                              </div>
                              <div className="text-[10px] text-white/40">
                                Scans validés : <strong className="text-white">{tok.scanCount}</strong> • Créé le {new Date(tok.createdAt).toLocaleDateString('fr-FR')}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleCopyScannerLink(tok.token, tok.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ${
                                  isCopied
                                    ? 'bg-emerald-500 text-black'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                              >
                                {isCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{isCopied ? 'Lien Copié !' : 'Copier le Lien'}</span>
                              </button>

                              <a
                                href={`/scanner?token=${tok.token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
                                title="Tester l'interface scanner"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {tok.isActive && (
                                <button
                                  onClick={() => handleRevokeToken(tok.id)}
                                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer"
                                  title="Révoquer cet accès"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 4. DIGITAL PRODUCTS ================= */}
              {activeTab === 'digital-products' && (
                <div className="space-y-6">
                  {/* Create Product Card */}
                  <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
                    <div>
                      <h4 className="text-sm font-black uppercase text-white font-display">
                        Ajouter un Produit Numérique à Vendre
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">
                        Guides PDF VIP, packs visuels collectors, sets musicaux exclusifs téléchargeables.
                      </p>
                    </div>

                    <form onSubmit={handleCreateDigitalProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Titre (ex: Livret Guide VIP 2026)"
                        value={newProdTitle}
                        onChange={e => setNewProdTitle(e.target.value)}
                        className="bg-black/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Prix en FCFA (ex: 2500)"
                        value={newProdPrice}
                        onChange={e => setNewProdPrice(Number(e.target.value))}
                        className="bg-black/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <select
                        value={newProdFormat}
                        onChange={e => setNewProdFormat(e.target.value as any)}
                        className="bg-black/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="PDF">Document PDF</option>
                        <option value="ZIP">Archive ZIP</option>
                        <option value="PNG">Image PNG HD</option>
                        <option value="JPG">Photo JPG</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Nom du fichier (ex: Guide_VIP_2026.pdf)"
                        value={newProdFileName}
                        onChange={e => setNewProdFileName(e.target.value)}
                        className="bg-black/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <div className="sm:col-span-2 lg:col-span-3">
                        <input
                          type="text"
                          placeholder="Description marketing courte du produit numérique"
                          value={newProdDesc}
                          onChange={e => setNewProdDesc(e.target.value)}
                          className="w-full bg-black/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="glass-emerald-btn py-2.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Mettre en Vente</span>
                      </button>
                    </form>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {digitalProducts.map(p => (
                      <div key={p.id} className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                              {p.format}
                            </span>
                            <h5 className="font-extrabold text-white text-sm mt-1">{p.title}</h5>
                            <p className="text-xs text-white/60 line-clamp-2 mt-0.5">{p.description}</p>
                          </div>
                          <span className="font-display font-black text-emerald-400 text-lg">
                            {p.price.toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="text-[10px] text-white/40 font-mono">
                          Fichier : {p.fileName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= 5. GATEWAY & MAINTENANCE ================= */}
              {activeTab === 'gateway' && (
                <div className="space-y-6">
                  {/* Gateway Environment Switch */}
                  <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black uppercase text-white font-display">
                          Environnement de la Passerelle Sécurisée
                        </h4>
                        <p className="text-xs text-white/60 mt-0.5">
                          Basculez entre le mode Sandbox (tests) et le mode Production (vrais paiements Mobile Money & Cartes).
                        </p>
                      </div>
                      <div className="flex bg-black/80 p-1 rounded-xl border border-white/15 shrink-0">
                        <button
                          onClick={() => handleToggleGatewayEnv('sandbox')}
                          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                            gatewayConfig.env === 'sandbox'
                              ? 'bg-amber-500 text-black'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Sandbox
                        </button>
                        <button
                          onClick={() => handleToggleGatewayEnv('production')}
                          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                            gatewayConfig.env === 'production'
                              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Production
                        </button>
                      </div>
                    </div>

                    {/* Masked Key Status Cards (Zero Plaintext Exposure) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px] tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Clé Publique Client</span>
                        </div>
                        <div className="font-mono text-white/70 text-xs">
                          ••••••••••••••••••••
                        </div>
                        <div className="text-[10px] text-emerald-400/80">Configurée & Chiffrée</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                        <div className="flex items-center gap-1.5 text-pink-400 font-bold uppercase text-[10px] tracking-wider">
                          <Key className="w-3.5 h-3.5" />
                          <span>Clé Secrète Serveur</span>
                        </div>
                        <div className="font-mono text-white/70 text-xs">
                          ••••••••••••••••••••
                        </div>
                        <div className="text-[10px] text-pink-400/80">Stockée côté serveur</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                        <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-[10px] tracking-wider">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Signature Webhook HMAC</span>
                        </div>
                        <div className="font-mono text-white/70 text-xs">
                          ••••••••••••••••••••
                        </div>
                        <div className="text-[10px] text-cyan-400/80">Contrôle cryptographique</div>
                      </div>
                    </div>
                  </div>

                  {/* Formulaire de Mise à Jour Sécurisée des Clés */}
                  <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
                    <div>
                      <h4 className="text-sm font-black uppercase text-white font-display">
                        Mettre à Jour les Clés d'API (Masquées à la Saisie)
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">
                        Si vos identifiants ont changé ou si l'API retourne « The provided API key is invalid », entrez vos nouvelles clés ci-dessous. Elles seront immédiatement chiffrées côté serveur.
                      </p>
                    </div>

                    {gatewayUpdateMsg && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        gatewayUpdateMsg.includes('Erreur')
                          ? 'bg-red-950/80 border border-red-500/50 text-red-200'
                          : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                      }`}>
                        {gatewayUpdateMsg.includes('Erreur') ? (
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span>{gatewayUpdateMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleUpdateGatewayKeys} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-white/60 block mb-1">
                          Nouvelle Clé Publique (ex: pk_live_...)
                        </label>
                        <input
                          type="password"
                          value={newPublicKeyInput}
                          onChange={e => setNewPublicKeyInput(e.target.value)}
                          placeholder="Laisser vide pour ne pas modifier"
                          className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-white/60 block mb-1">
                          Nouvelle Clé Secrète Serveur (ex: sk_live_...)
                        </label>
                        <input
                          type="password"
                          value={newSecretKeyInput}
                          onChange={e => setNewSecretKeyInput(e.target.value)}
                          placeholder="Laisser vide pour ne pas modifier"
                          className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-pink-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-white/60 block mb-1">
                          Secret de Signature Webhook (ex: whsec_...)
                        </label>
                        <input
                          type="password"
                          value={newWebhookSecretInput}
                          onChange={e => setNewWebhookSecretInput(e.target.value)}
                          placeholder="Laisser vide pour ne pas modifier"
                          className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdatingGateway || (!newPublicKeyInput.trim() && !newSecretKeyInput.trim() && !newWebhookSecretInput.trim())}
                        className="glass-emerald-btn px-6 py-2.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isUpdatingGateway ? 'Enregistrement sécurisé...' : 'Enregistrer et Protéger les Clés'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Purge Test Data Card */}
                  <div className="p-5 rounded-3xl bg-red-950/30 border border-red-500/30 space-y-4">
                    <div>
                      <h4 className="text-sm font-black uppercase text-red-300 font-display">
                        Nettoyage des Données de Test & Faux Billets
                      </h4>
                      <p className="text-xs text-white/70 mt-0.5">
                        Supprime toutes les commandes de simulation et réinitialise les billets de test (`ord_seed_101`, `tkt_seed_101`, etc.) afin que seuls les billets réels soient valides à l'entrée.
                      </p>
                    </div>

                    {purgeSuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{purgeSuccessMsg}</span>
                      </div>
                    )}

                    <button
                      onClick={handlePurgeTestData}
                      disabled={isPurging}
                      className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xl disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isPurging ? 'Purge en cours...' : 'Purger les Données & Billets de Test'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ================= 6. SCANNER DIRECT ================= */}
              {activeTab === 'scanner' && (
                <div className="max-w-xl mx-auto space-y-6">
                  <div className="text-center space-y-1">
                    <h4 className="text-lg font-black uppercase text-white font-display">
                      Poste de Filtrage Express
                    </h4>
                    <p className="text-xs text-white/60">
                      Saisissez le hash cryptographique SHA-256 ou le numéro de billet pour contrôler l'accès.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coller le token hash crypté ou MLDK-2026-..."
                      value={scanInputHash}
                      onChange={e => setScanInputHash(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handlePerformScan();
                      }}
                      className="flex-1 bg-black/70 border border-white/20 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handlePerformScan()}
                      disabled={isScanning || !scanInputHash.trim()}
                      className="glass-emerald-btn px-6 py-3 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      {isScanning ? 'Scan...' : 'Scanner'}
                    </button>
                  </div>

                  {/* Scan Result Box */}
                  {scanResult && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`p-5 rounded-2xl border text-center space-y-3 ${
                        scanResult.success
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                          : scanResult.error === 'ALREADY_USED'
                          ? 'bg-red-950/80 border-red-500 text-red-200'
                          : 'bg-amber-950/80 border-amber-500 text-amber-200'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-black/40">
                        {scanResult.success ? (
                          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-400" />
                        )}
                      </div>
                      <h4 className="font-black uppercase text-base font-display">
                        {scanResult.message}
                      </h4>
                      {scanResult.ticket && (
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-left space-y-1">
                          <div className="flex justify-between">
                            <span className="text-white/60">Titulaire :</span>
                            <span className="font-bold text-white">{scanResult.ticket.attendeeName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Billet :</span>
                            <span className="font-mono text-emerald-400">{scanResult.ticket.ticketNumber}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* URL VIA SCAN CARD (Direct QR + Link for Entrance Staff) */}
                  <div className="p-5 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-sm font-black uppercase text-white font-display">
                          URL Directe & QR Code pour les Agents de Scan
                        </h4>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Scan Mobile
                      </span>
                    </div>

                    <p className="text-xs text-white/70">
                      Les agents d'entrée peuvent flasher ce QR Code avec l'appareil photo de leur smartphone pour ouvrir l'application de contrôle sans aucun mot de passe.
                    </p>

                    {(() => {
                      const activeToken = scannerTokens.find(t => t.isActive)?.token || 'mlk_scan_vip_door_2026';
                      const scanUrl = `${window.location.origin}/scanner?token=${activeToken}`;
                      return (
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/60 p-4 rounded-2xl border border-white/10">
                          {/* QR Code preview */}
                          <div className="w-32 h-32 shrink-0 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(scanUrl)}`}
                              alt="QR Code Scanner"
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex-1 space-y-2.5 text-xs w-full">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-white/50 block">URL via Scan :</span>
                              <div className="font-mono text-emerald-400 text-xs bg-black/80 px-3 py-2 rounded-xl border border-white/10 break-all select-all">
                                {scanUrl}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(scanUrl);
                                  setCopiedTokenId('quick-scan');
                                  setTimeout(() => setCopiedTokenId(null), 2500);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ${
                                  copiedTokenId === 'quick-scan'
                                    ? 'bg-emerald-500 text-black'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                              >
                                {copiedTokenId === 'quick-scan' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedTokenId === 'quick-scan' ? 'URL Copiée !' : 'Copier l\'URL'}</span>
                              </button>

                              <a
                                href={scanUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-emerald-btn px-3 py-1.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5"
                              >
                                <span>Ouvrir l'App Scanner</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ================= 7. CUSTOMIZATION ================= */}
              {activeTab === 'customization' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {saveSuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Modifications et visuels enregistrés avec succès.</span>
                    </div>
                  )}

                  {/* Secret Location Settings */}
                  <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-pink-400" />
                        <h4 className="text-sm font-black uppercase text-white font-display">
                          Lieu Secret & Révélation VIP
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditRevealSecret(!editRevealSecret)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                          editRevealSecret
                            ? 'bg-emerald-500 text-black'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {editRevealSecret ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>{editRevealSecret ? 'Révélé au Public' : 'Tenu Secret'}</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                        Adresse complète confidentielle
                      </label>
                      <input
                        type="text"
                        value={editSecretAddress}
                        onChange={e => setEditSecretAddress(e.target.value)}
                        className="w-full bg-black/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Pricing & Capacity */}
                  <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
                    <h4 className="text-sm font-black uppercase text-white font-display">
                      Capacité & Tarif Unique
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                          Capacité Maximale (places)
                        </label>
                        <input
                          type="number"
                          value={editCapacity}
                          onChange={e => setEditCapacity(Number(e.target.value))}
                          className="w-full bg-black/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                          Tarif Unique (FCFA)
                        </label>
                        <input
                          type="number"
                          value={editTicketPrice}
                          onChange={e => setEditTicketPrice(Number(e.target.value))}
                          className="w-full bg-black/70 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Site Imagery & Visual Assets Manager */}
                  <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-5">
                    <div>
                      <h4 className="text-sm font-black uppercase text-white font-display">
                        Gestionnaire des Images du Site
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">
                        Gérez et prévisualisez toutes les images publiques : arrière-plan, flyer d'entrée, ambiance et galerie photo. Vous pouvez importer directement vos fichiers depuis votre appareil ou saisir un lien.
                      </p>
                    </div>

                    {uploadError && (
                      <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    <div className="space-y-4 text-xs">
                      {/* 1. Flyer Hero Principal */}
                      <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-neutral-900 shadow-md">
                          <img src={editFlyerUrl} alt="Flyer Hero" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 w-full space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-white/80 font-bold block uppercase text-[11px] tracking-wider">
                              Flyer Principal (Format Carré Hero)
                            </label>
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer text-[10px] font-bold uppercase transition-colors">
                              {uploadingTarget === 'flyer' ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Téléversement...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3" />
                                  <span>Importer photo</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingTarget === 'flyer'}
                                onChange={e => handleFileUpload(e, 'flyer')}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            value={editFlyerUrl}
                            onChange={e => setEditFlyerUrl(e.target.value)}
                            placeholder="URL ou chemin de l'image"
                            className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* 2. Image de fond continue */}
                      <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-neutral-900 shadow-md">
                          <img src={editBgUrl} alt="Fond d'écran" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 w-full space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-white/80 font-bold block uppercase text-[11px] tracking-wider">
                              Image d'Arrière-Plan Continue (Rayures Vibe)
                            </label>
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer text-[10px] font-bold uppercase transition-colors">
                              {uploadingTarget === 'bg' ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Téléversement...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3" />
                                  <span>Importer photo</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingTarget === 'bg'}
                                onChange={e => handleFileUpload(e, 'bg')}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            value={editBgUrl}
                            onChange={e => setEditBgUrl(e.target.value)}
                            placeholder="URL ou chemin de l'image"
                            className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* 3. Mood Image 1 */}
                      <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-neutral-900 shadow-md">
                          <img src={editMood1Url} alt="Mood 1" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 w-full space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-white/80 font-bold block uppercase text-[11px] tracking-wider">
                              Photo Section « L'Expérience »
                            </label>
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer text-[10px] font-bold uppercase transition-colors">
                              {uploadingTarget === 'mood1' ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Téléversement...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3" />
                                  <span>Importer photo</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingTarget === 'mood1'}
                                onChange={e => handleFileUpload(e, 'mood1')}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            value={editMood1Url}
                            onChange={e => setEditMood1Url(e.target.value)}
                            placeholder="URL ou chemin de l'image"
                            className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* 4. Mood Image 2 */}
                      <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/20 bg-neutral-900 shadow-md">
                          <img src={editMood2Url} alt="Mood 2" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 w-full space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-white/80 font-bold block uppercase text-[11px] tracking-wider">
                              Photo Section « Le Concept »
                            </label>
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer text-[10px] font-bold uppercase transition-colors">
                              {uploadingTarget === 'mood2' ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Téléversement...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3 h-3" />
                                  <span>Importer photo</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingTarget === 'mood2'}
                                onChange={e => handleFileUpload(e, 'mood2')}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            value={editMood2Url}
                            onChange={e => setEditMood2Url(e.target.value)}
                            placeholder="URL ou chemin de l'image"
                            className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* 5. Complete Gallery Images Management */}
                      <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-white font-bold block uppercase text-[11px] tracking-wider">
                            Galerie Photos du Site ({editGalleryImages.length} images)
                          </label>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer text-[10px] font-bold uppercase transition-colors self-start sm:self-auto">
                            {uploadingTarget === 'gallery' ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Téléversement en cours...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Importer des photos depuis l'appareil</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              disabled={uploadingTarget === 'gallery'}
                              onChange={e => handleFileUpload(e, 'gallery')}
                            />
                          </label>
                        </div>

                        {/* Thumbnails list with delete */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {editGalleryImages.map((imgUrl, index) => (
                            <div key={index} className="relative group rounded-xl overflow-hidden border border-white/15 aspect-square bg-neutral-900">
                              <img src={imgUrl} alt={`Galerie ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(index)}
                                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow-md cursor-pointer transition-opacity"
                                title="Supprimer cette photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute bottom-1 left-1.5 text-[9px] font-mono text-white/80 bg-black/60 px-1 rounded">
                                #{index + 1}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add image form */}
                        <div className="pt-2 flex gap-2">
                          <input
                            type="text"
                            placeholder="Entrez l'URL d'une nouvelle photo (ex: /assets/... ou https://...)"
                            value={newGalleryImgInput}
                            onChange={e => setNewGalleryImgInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddGalleryImage();
                              }
                            }}
                            className="flex-1 bg-black/80 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddGalleryImage()}
                            className="glass-emerald-btn px-4 py-2 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Ajouter</span>
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="pt-1">
                          <span className="text-[10px] uppercase font-bold text-white/40 block mb-1.5">
                            Raccourcis photos disponibles :
                          </span>
                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleAddGalleryImage('/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg')}
                              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                            >
                              + Flyer Carré
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddGalleryImage('/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.33_6cfe3486.jpeg')}
                              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                            >
                              + Photo Ambiance 1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddGalleryImage('/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.32_d946a24f.jpeg')}
                              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                            >
                              + Photo Ambiance 2
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddGalleryImage('/assets/aistudio/gallery_vibe_01.png')}
                              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                            >
                              + Soirée Abidjan
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveEventCustomization}
                    disabled={isSavingCustom}
                    className="w-full glass-emerald-btn py-3.5 rounded-xl text-black font-extrabold text-sm uppercase tracking-wider cursor-pointer shadow-xl"
                  >
                    {isSavingCustom ? 'Enregistrement...' : 'Enregistrer Toutes les Modifications'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Ticket Preview Modal */}
      {selectedTicketForPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
          <div className="relative max-w-sm w-full">
            <button
              onClick={() => setSelectedTicketForPreview(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <TicketPassCard
              ticket={selectedTicketForPreview}
              secretLocationRevealed={event.isSecretLocationRevealed}
              secretAddress={event.secretLocationAddress}
            />
          </div>
        </div>
      )}
    </div>
  );
};
