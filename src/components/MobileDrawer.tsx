import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Home, Flame, Crown, Image as ImageIcon, MapPin, User, Ticket, ShieldCheck, HelpCircle, PhoneCall, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenBooking: () => void;
  onOpenAccount: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  conciergePhone: string;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenBooking,
  onOpenAccount,
  onOpenAuth,
  onOpenAdmin,
  conciergePhone,
}) => {
  const handleNavClick = (anchor: string) => {
    onClose();
    setTimeout(() => {
      const element = document.querySelector(anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Drawer content in translucent smoked glass */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="relative w-full max-w-[320px] h-full bg-[#0d0914]/95 backdrop-blur-2xl border-l border-white/10 p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-display font-black text-white text-sm shadow-[0_0_12px_rgba(236,72,153,0.4)]">
                    M
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight text-white font-display leading-none">
                      MALEDIKE <span className="text-pink-400">PARTY</span>
                    </h3>
                    <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-semibold mt-0.5">
                      Mireza Caribbean
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="mt-5 space-y-1.5">
                <button
                  onClick={() => handleNavClick('#home')}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-white/10 text-white/90 hover:text-white text-sm font-semibold transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-pink-400" />
                    <span>Accueil</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
                </button>

                <button
                  onClick={() => handleNavClick('#salons')}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-pink-950/30 border border-pink-500/20 hover:bg-pink-900/30 text-pink-300 hover:text-white text-sm font-bold transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Crown className="w-4 h-4 text-pink-400" />
                    <span>Salons VIP & Formules</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-pink-400/50 group-hover:text-pink-300 transition-colors" />
                </button>

                <button
                  onClick={() => handleNavClick('#experience')}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-white/10 text-white/90 hover:text-white text-sm font-semibold transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    <span>L'Expérience & The Mood</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
                </button>

                <button
                  onClick={() => handleNavClick('#gallery')}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-white/10 text-white/90 hover:text-white text-sm font-semibold transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-4 h-4 text-pink-400" />
                    <span>Galerie</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
                </button>

                <button
                  onClick={() => handleNavClick('#concept')}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-white/10 text-white/90 hover:text-white text-sm font-semibold transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Le Concept & Lieu Secret</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
                </button>

                <button
                  onClick={() => handleNavClick('#faq')}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-white/10 text-white/90 hover:text-white text-sm font-semibold transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-white/50" />
                    <span>Questions Fréquentes</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
                </button>
              </div>

              {/* User Account Section */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2.5 px-1">
                  Espace Personnel
                </div>
                {currentUser ? (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAccount();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-emerald-500/20 text-left hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {currentUser.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {currentUser.firstName} {currentUser.lastName}
                        </div>
                        <div className="text-[11px] text-emerald-400">Mes Billets Numériques</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-pink-400" />
                      <span>Se connecter / S'inscrire</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-5 border-t border-white/10 space-y-2.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenBooking();
                }}
                className="w-full glass-emerald-btn py-3.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Ticket className="w-4 h-4 text-black" />
                <span>RÉSERVER MON BILLET (10 000 F)</span>
              </button>

              {currentUser && currentUser.email?.trim().toLowerCase() === 'bienaodylan428@gmail.com' && currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer border border-emerald-500/30"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Portail Administrateur</span>
                </button>
              )}

              {/* WhatsApp direct contact */}
              <a
                href={`https://wa.me/2250150049489?text=${encodeURIComponent('Bonjour MALÉDIKÉ PARTY, je souhaite des informations sur l\'événement.')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 text-[10px] text-white/50 hover:text-emerald-400 pt-1"
              >
                <PhoneCall className="w-3 h-3 text-emerald-400" />
                <span>Conciergerie Privée VIP (WhatsApp)</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

