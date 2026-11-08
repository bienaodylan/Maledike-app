import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Ticket as TicketIcon,
  LogOut,
  Phone,
  ShieldCheck,
  MapPin,
  Check,
  Download,
  FileText,
  FileArchive,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import { UserProfile, Ticket, UserDigitalPurchase } from '../types';
import { api } from '../services/api';
import { TicketPassCard } from './TicketPassCard';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserUpdate: (updated: UserProfile) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenBooking: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onLogout,
  onOpenAdmin,
  onOpenBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'downloads' | 'profile'>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [digitalPurchases, setDigitalPurchases] = useState<UserDigitalPurchase[]>([]);
  const [secretLocationRevealed, setSecretLocationRevealed] = useState(false);
  const [secretLocationAddress, setSecretLocationAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit profile state
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser.whatsappNumber);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadUserData();
      setFirstName(currentUser.firstName);
      setLastName(currentUser.lastName);
      setWhatsappNumber(currentUser.whatsappNumber);
    }
  }, [isOpen, currentUser]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const [ticketsRes, downloadsRes] = await Promise.all([
        api.getMyTickets(currentUser.id),
        api.getMyDigitalPurchases(currentUser.id),
      ]);
      setTickets(ticketsRes.tickets || []);
      setSecretLocationRevealed(ticketsRes.secretLocationRevealed);
      setSecretLocationAddress(ticketsRes.secretLocationAddress);
      setDigitalPurchases(downloadsRes || []);
    } catch (err) {
      console.error('Error fetching user account data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMessage(false);
    try {
      const res = await api.updateProfile(currentUser.id, {
        firstName,
        lastName,
        whatsappNumber,
      });
      if (res.success && res.user) {
        onUserUpdate(res.user);
        setProfileSuccessMessage(true);
        setTimeout(() => setProfileSuccessMessage(false), 3000);
      }
    } catch (err) {
      console.error('Error saving profile', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDownloadFile = (purchase: UserDigitalPurchase) => {
    const downloadUrl = `/api/digital-products/download/${purchase.id}?token=${encodeURIComponent(purchase.downloadToken)}`;
    window.open(downloadUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-xl"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-2xl rounded-3xl glass-smoked border border-emerald-500/30 p-5 sm:p-8 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center font-black text-white text-base shadow">
              {currentUser.firstName.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-black uppercase text-white font-display">
                ESPACE PERSONNEL VIP
              </h3>
              <p className="text-xs text-emerald-400 font-semibold">
                {currentUser.firstName} {currentUser.lastName} • {currentUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-emerald-500 text-black font-extrabold shadow-lg'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <TicketIcon className="w-4 h-4" />
            <span>Mes Pass ({tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'downloads'
                ? 'bg-emerald-500 text-black font-extrabold shadow-lg'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Produits Numériques ({digitalPurchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-500 text-black font-extrabold shadow-lg'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil & WhatsApp</span>
          </button>
        </div>

        {/* TAB 1: TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {/* Secret Location Info Banner */}
            {tickets.length > 0 && (
              <div className={`p-4 rounded-2xl border ${
                secretLocationRevealed
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                  : 'bg-black/50 border-white/10 text-white/80'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${secretLocationRevealed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-pink-400'}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white uppercase text-xs tracking-wider mb-1">
                      {secretLocationRevealed ? '📍 LOCALISATION OFFICIELLE DÉBLOQUÉE' : '🔒 LIEU SECRET CONFIDENTIEL'}
                    </h5>
                    {secretLocationRevealed && secretLocationAddress ? (
                      <p className="text-xs font-semibold text-emerald-100">
                        {secretLocationAddress}
                      </p>
                    ) : (
                      <p className="text-xs text-white/60">
                        Pour préserver le caractère exclusif de la soirée, l'adresse exacte d'Abidjan sera débloquée sur cette page et envoyée sur votre WhatsApp (+225 {currentUser.whatsappNumber}) exactement 24h avant l'ouverture des portes.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tickets list */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-white/50">
                <div className="w-6 h-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto mb-2" />
                Chargement de vos billets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center glass-smoked rounded-2xl border border-white/10 p-6 space-y-3">
                <TicketIcon className="w-12 h-12 text-white/20 mx-auto" />
                <h4 className="text-base font-bold text-white uppercase font-display">
                  Aucun billet actif pour le moment
                </h4>
                <p className="text-xs text-white/60 max-w-xs mx-auto">
                  Réservez dès maintenant votre passe pour la MALEDIKE PARTY au tarif unique de 10 000 FCFA.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenBooking();
                  }}
                  className="glass-emerald-btn px-6 py-2.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg inline-flex items-center gap-2"
                >
                  <TicketIcon className="w-4 h-4" />
                  <span>Réserver mon passe (10 000 F)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {tickets.map((t, idx) => (
                  <div key={t.id} className="space-y-2">
                    {tickets.length > 1 && (
                      <div className="text-xs font-black uppercase tracking-wider text-emerald-400 px-1">
                        Billet {idx + 1} • {t.ticketNumber}
                      </div>
                    )}
                    <TicketPassCard
                      ticket={t}
                      secretLocationRevealed={secretLocationRevealed}
                      secretAddress={secretLocationAddress}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DIGITAL PRODUCTS DOWNLOADS */}
        {activeTab === 'downloads' && (
          <div className="space-y-4">
            <div className="text-xs text-white/70 mb-2">
              Téléchargez vos guides officiels, affiches haute définition et contenus exclusifs achetés.
            </div>

            {digitalPurchases.length === 0 ? (
              <div className="py-12 text-center glass-smoked rounded-2xl border border-white/10 p-6 space-y-3">
                <FileText className="w-12 h-12 text-white/20 mx-auto" />
                <h4 className="text-base font-bold text-white uppercase font-display">
                  Aucun produit numérique acheté
                </h4>
                <p className="text-xs text-white/60 max-w-xs mx-auto">
                  Les livrets VIP, affiches collector et playlists achetés lors de vos commandes apparaîtront ici avec liens de téléchargement sécurisés.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {digitalPurchases.map(purchase => (
                  <div
                    key={purchase.id}
                    className="p-4 rounded-2xl glass-smoked-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        {purchase.format === 'PDF' ? (
                          <FileText className="w-5 h-5" />
                        ) : purchase.format === 'ZIP' ? (
                          <FileArchive className="w-5 h-5" />
                        ) : (
                          <ImageIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-white">{purchase.productTitle}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
                          <span className="font-bold text-emerald-400 uppercase">{purchase.format}</span>
                          <span>•</span>
                          <span>{purchase.fileName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-white/40" />
                            {new Date(purchase.purchasedAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadFile(purchase)}
                      className="glass-emerald-btn px-4 py-2.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profil mis à jour avec succès.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">
                Numéro WhatsApp
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  className="w-full bg-black/70 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
              </div>
              <p className="text-[10px] text-white/50 mt-1">
                Ce numéro reçoit les notifications, le pass digital et la révélation du lieu secret.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">
                Adresse Email (Non modifiable)
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white/50 cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="glass-emerald-btn px-6 py-3 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSavingProfile ? 'Enregistrement...' : 'Sauvegarder les modifications'}
              </button>
            </div>
          </form>
        )}

        {/* Footer Actions */}
        <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          {currentUser.role === 'admin' && currentUser.email?.toLowerCase().trim() === 'bienaodylan428@gmail.com' && (
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Accéder au Panneau d'Administration</span>
            </button>
          )}

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
