import React from 'react';
import { ArrowUp, Phone, ShieldCheck } from 'lucide-react';

import { UserProfile } from '../types';

interface FooterProps {
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  conciergePhone: string;
  currentUser?: UserProfile | null;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAccount, conciergePhone }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-white/10 bg-black/90 pt-12 pb-8 px-4 sm:px-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1 flex items-center justify-center md:justify-start gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Mireza Caribbean présente</span>
            </div>
            <h3 className="text-2xl font-black uppercase text-white font-display tracking-tight">
              MALEDIKE <span className="text-pink-400">PARTY</span>
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Samedi 28 Novembre 2026 • Abidjan • Passe-Entrée 10.000 FCFA
            </p>
          </div>

          {/* Nav links — public footer contains no admin/portal entry */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase font-bold tracking-wider text-white/70">
            <button
              onClick={onOpenAccount}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Mon Compte / Mes Billets
            </button>
            <a
              href={`https://wa.me/2250150049489?text=${encodeURIComponent("Bonjour, demande d'information MALEDIKE PARTY")}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>Conciergerie Privée VIP</span>
            </a>
          </div>

          {/* Back to top */}
          <button
            onClick={scrollToTop}
            title="Haut de page"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Legal & Security copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/40 text-center sm:text-left">
          <p>© 2026 Mireza Caribbean & MALEDIKE PARTY. Tous droits réservés.</p>
          <div className="flex items-center gap-2 text-emerald-400/80">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Billetterie officielle chiffrée • Contrôle d'accès inviolable</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
