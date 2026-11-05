import React from 'react';
import { Ticket, User, ShieldCheck, Menu } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentUser: UserProfile | null;
  onOpenBooking: () => void;
  onOpenAccount: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenBooking,
  onOpenAccount,
  onOpenAuth,
  onOpenAdmin,
  onOpenDrawer,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-2 sm:px-6 py-2.5 sm:py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5 rounded-2xl bg-[#0e0a16]/85 border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Brand Logo */}
        <a href="#home" className="flex items-center gap-2 group shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-display font-black text-white text-xs sm:text-sm shadow-[0_0_12px_rgba(236,72,153,0.4)] group-hover:scale-105 transition-transform">
            M
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-white text-sm sm:text-lg leading-none font-display">
              MALEDIKE<span className="text-pink-400 ml-1 font-black text-xs sm:text-sm">PARTY</span>
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-emerald-400 font-semibold">
              Mireza Caribbean
            </span>
          </div>
        </a>

        {/* Desktop Anchor Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs uppercase font-bold tracking-wider text-white/80">
          <a href="#home" className="hover:text-emerald-400 transition-colors py-1">
            Accueil
          </a>
          <a href="#salons" className="text-pink-300 hover:text-pink-400 font-extrabold transition-colors py-1">
            Salons VIP
          </a>
          <a href="#experience" className="hover:text-emerald-400 transition-colors py-1">
            L'Expérience
          </a>
          <a href="#gallery" className="hover:text-emerald-400 transition-colors py-1">
            Galerie
          </a>
          <a href="#concept" className="hover:text-emerald-400 transition-colors py-1">
            Le Concept
          </a>
          <a href="#faq" className="hover:text-emerald-400 transition-colors py-1">
            FAQ
          </a>
        </nav>

        {/* Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Admin shortcut button (desktop/tablet only) */}
          <button
            onClick={onOpenAdmin}
            title="Panneau d'Administration"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin</span>
          </button>

          {/* User Account / Login (desktop only - mobile accessible inside drawer) */}
          {currentUser ? (
            <button
              onClick={onOpenAccount}
              className="hidden sm:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-emerald-500/30 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                {currentUser.firstName.charAt(0)}
              </div>
              <span className="font-medium text-emerald-300">
                {currentUser.firstName}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-pink-400" />
              <span>Connexion</span>
            </button>
          )}

          {/* Primary CTA (Desktop/Tablet only - on mobile it lives inside the drawer) */}
          <button
            onClick={onOpenBooking}
            className="hidden sm:flex glass-emerald-btn px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider items-center gap-1.5 cursor-pointer shadow-md shrink-0"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Réserver (10 000 F)</span>
          </button>

          {/* Mobile Menu Drawer Toggle - Clean, uncluttered, always visible on mobile */}
          <button
            onClick={onOpenDrawer}
            className="lg:hidden p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/15 cursor-pointer shrink-0 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-emerald-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
