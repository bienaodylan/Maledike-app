import React from 'react';
import { motion } from 'motion/react';
import { Crown, Sparkles, Users, ShieldCheck, ArrowRight, Phone, CheckCircle2 } from 'lucide-react';
import { SALON_CATEGORIES, TicketCategory } from '../types';

interface SalonsSectionProps {
  onSelectFormula: (category: TicketCategory) => void;
  conciergePhone?: string;
}

export const SalonsSection: React.FC<SalonsSectionProps> = ({
  onSelectFormula,
  conciergePhone = '+225 07 58 98 83 60',
}) => {
  return (
    <section id="salons" className="relative py-10 sm:py-28 px-4 sm:px-6 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-950/60 border border-pink-500/40 text-pink-400 text-xs font-black uppercase tracking-widest mb-4 shadow-lg shadow-pink-950/40">
            <Crown className="w-3.5 h-3.5 text-pink-400" />
            <span>Espaces VIP Privatifs & Salons</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase font-display tracking-tight text-white">
            RÉSERVEZ VOTRE <span className="text-pink-400">SALON VIP</span>
          </h2>
          <p className="text-sm sm:text-base text-white/70 mt-3 leading-relaxed">
            Profitez de la soirée dans des conditions d'exception. Salons privatifs avec places assises, service personnalisé et carré VIP Mireza Caribbean.
          </p>
        </div>

        {/* Featured Flyer & Salons Presentation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
          {/* Official Flyer Poster */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden border border-pink-500/30 shadow-[0_20px_50px_rgba(236,72,153,0.25)] max-w-sm w-full group"
            >
              <img
                src="/assets/aistudio/f98ee1d1-62d9-46c5-a504-98e04f243230_f5e3c5c4.jpeg"
                alt="Flyer Officiel Salons VIP - MALEDIKE PARTY"
                className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5">
                <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">
                  Affiche Officielle Salons
                </span>
                <span className="text-base font-extrabold text-white">
                  Mireza Caribbean Présente
                </span>
                <span className="text-xs text-white/70">
                  Infoline & Réservation : 07 58 98 83 60
                </span>
              </div>
            </motion.div>
          </div>

          {/* Salons Pricing Cards */}
          <div className="lg:col-span-7 space-y-4">
            {SALON_CATEGORIES.map(category => {
              const isUniquePass = category.id === 'pass_vip';
              return (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                    category.id === 'salon_sexy_nana'
                      ? 'bg-gradient-to-r from-amber-950/40 via-black/60 to-black/80 border-amber-500/50 shadow-[0_10px_30px_rgba(245,158,11,0.2)]'
                      : category.id === 'salon_pole_dance'
                      ? 'bg-gradient-to-r from-purple-950/40 via-black/60 to-black/80 border-purple-500/40 shadow-[0_10px_30px_rgba(168,85,247,0.2)]'
                      : category.id === 'salon_twerk'
                      ? 'bg-gradient-to-r from-pink-950/40 via-black/60 to-black/80 border-pink-500/40 shadow-[0_10px_30px_rgba(236,72,153,0.2)]'
                      : 'bg-black/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg sm:text-xl font-black text-white uppercase font-display truncate">
                          {category.name}
                        </h4>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                          category.id === 'salon_sexy_nana'
                            ? 'bg-amber-400 text-black font-extrabold'
                            : category.id === 'salon_pole_dance'
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                            : category.id === 'salon_twerk'
                            ? 'bg-pink-500/30 text-pink-300 border border-pink-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {category.capacity} place{category.capacity > 1 ? 's' : ''} {category.capacity > 1 ? 'assises' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">
                        {category.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                      <div className="text-left sm:text-right">
                        <div className="text-xl sm:text-2xl font-black text-emerald-400 font-display">
                          {category.price.toLocaleString()}{' '}
                          <span className="text-xs text-white/60 font-medium">FCFA</span>
                        </div>
                        <div className="text-[10px] text-white/50 uppercase font-semibold">
                          {isUniquePass ? 'Tarif unique' : 'Paiement direct sécurisé'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectFormula(category.id)}
                        className={`px-4 sm:px-5 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform active:scale-95 ${
                          isUniquePass
                            ? 'bg-white/10 hover:bg-white/20 text-white'
                            : 'glass-emerald-btn text-black'
                        }`}
                      >
                        <span>Réserver</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Concierge / Infoline Bar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Infoline & Réservations Tables
              </div>
              <div className="text-sm font-extrabold text-pink-300">
                07 58 98 83 60 (Mireza Caribbean)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:+2250758988360"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Appeler</span>
            </a>
            <a
              href="https://wa.me/2250758988360?text=Bonjour%20Mireza%20Caribbean,%20je%20souhaite%20r%C3%A9server%20un%20Salon%20VIP%20pour%20la%20Maledike%20Party."
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
