import React from 'react';
import { motion } from 'motion/react';
import { Lock, Headphones, Clock, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';

interface ConceptSectionProps {
  onOpenBooking: () => void;
  conciergePhone: string;
}

export const ConceptSection: React.FC<ConceptSectionProps> = ({ onOpenBooking, conciergePhone }) => {
  return (
    <section id="concept" className="relative py-8 sm:py-24 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tight font-display">
            THE <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">concept</span>
          </h2>
          <p className="text-white/70 text-sm max-w-lg mx-auto mt-2">
            Trois piliers fondamentaux garantissant une nuit sans compromis.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Pillar 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-smoked-card rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase text-white mb-3 font-display tracking-tight">
                VILLA PRIVÉE
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Pour préserver le caractère exclusif, l'adresse précise sera communiquée par message aux seuls titulaires de billets 24h avant l'événement.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Sécurité privée & filtrage strict</span>
            </div>
          </motion.div>

          {/* Pillar 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-smoked-card rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-950/60 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-6">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase text-white mb-3 font-display tracking-tight">
                SON CARIBÉEN & AFROBEAT
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Une sélection musicale de pointe orchestrée par les meilleurs DJs de la capitale : Dancehall, Shatta, Amapiano, Afrobeat & Hip-Hop pour une immersion totale jusqu'au lever du jour.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-semibold text-pink-400">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span>Système son & Light-show de clubbing privé</span>
            </div>
          </motion.div>

          {/* Pillar 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-smoked-card rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase text-white mb-3 font-display tracking-tight">
                LE STYLE
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Come as you are. Just make it sexy.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Clock className="w-4 h-4" />
              <span>Ouverture des portes : 23h00 précises</span>
            </div>
          </motion.div>
        </div>

        {/* WhatsApp Concierge Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-4 sm:p-6 rounded-2xl glass-smoked border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white/90 font-medium">
                Des questions ou une réservation de groupe ?{' '}
                <a
                  href={`https://wa.me/2250150049489?text=${encodeURIComponent('Bonjour, je souhaite réserver ou avoir des informations pour la MALEDIKE PARTY.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-400 underline decoration-emerald-500/50 hover:text-emerald-300"
                >
                  Contacter la Conciergerie Privée (WhatsApp)
                </a>
              </p>
            </div>
          </div>

          <button
            onClick={onOpenBooking}
            className="glass-emerald-btn px-6 py-2.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider shrink-0 cursor-pointer flex items-center gap-2 shadow-lg"
          >
            <span>Prendre mes places</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
