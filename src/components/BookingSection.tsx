import React from 'react';
import { motion } from 'motion/react';
import { Ticket as TicketIcon, Calendar, MapPin, CheckCircle2, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { EventConfig, UserProfile } from '../types';

interface BookingSectionProps {
  event: EventConfig & { remainingCount: number };
  currentUser: UserProfile | null;
  onStartBooking: (quantity: number) => void;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  event,
  currentUser,
  onStartBooking,
}) => {
  const [selectedQty, setSelectedQty] = React.useState<number>(1);
  const unitPrice = event.ticketPrice || 10000;
  const totalAmount = selectedQty * unitPrice;

  return (
    <section id="ticketing" className="relative py-16 sm:py-24 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight font-display">
            RÉSERVATION DU <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">PASSE-ENTRÉE</span>
          </h2>
          <p className="text-white/70 text-sm max-w-md mx-auto mt-2">
            Tarif unique de 10 000 FCFA. Billet 100% nominatif avec QR Code infalsifiable.
          </p>
        </div>

        {/* Embedded Booking Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-smoked-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden"
        >
          {/* Top Decorative Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-pink-500 to-emerald-400" />

          {/* Event Badge */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-400">
                MIREZA CARIBBEAN • MALEDIKE PARTY
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Samedi 28 Nov. 2026 — 23h à 06h
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  Secret Location, Abidjan
                </span>
              </div>
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                {event.remainingCount > 0 ? `En stock (${event.remainingCount} restants)` : 'Épuisé'}
              </span>
            </div>
          </div>

          {/* Ticket Product Box */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/15 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-black text-white uppercase font-display">
                    PASSE-ENTRÉE OFFICIEL
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    BILLET UNIQUE
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-0.5">
                  Votre passe d'entrée officiel pour toute la nuit de la MALEDIKE PARTY.
                </p>
              </div>

              {/* Price & Quantity Selector */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xl font-black text-white font-display">
                    10 000 <span className="text-xs text-emerald-400 font-bold">FCFA</span>
                  </div>
                  <div className="text-[10px] text-white/40">par personne</div>
                </div>

                <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/15">
                  <button
                    onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                    disabled={selectedQty <= 1}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-base font-black text-white font-display w-6 text-center">
                    {selectedQty}
                  </span>
                  <button
                    onClick={() => setSelectedQty(Math.min(10, selectedQty + 1))}
                    disabled={selectedQty >= Math.min(10, event.remainingCount)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5 text-xs text-white/70 border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Billet digital nominatif sécurisé avec QR Code anti-fraude</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Révélation de l'adresse secrète 24h avant par WhatsApp & Espace Client</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Accès complet à la soirée, dancefloor & DJ sets (23h — 06h)</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
            <div>
              <div className="text-[11px] uppercase font-bold text-white/50 tracking-wider">
                {selectedQty} passe{selectedQty > 1 ? 's' : ''} sélectionné{selectedQty > 1 ? 's' : ''}
              </div>
              <div className="text-2xl font-black text-emerald-400 font-display">
                {totalAmount.toLocaleString()} FCFA
              </div>
            </div>

            <button
              onClick={() => onStartBooking(selectedQty)}
              disabled={event.remainingCount === 0}
              className="w-full sm:w-auto glass-emerald-btn px-8 py-3.5 rounded-xl text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl disabled:opacity-50"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
