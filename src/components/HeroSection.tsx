
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Ticket, ChevronDown, ShieldCheck } from 'lucide-react';
import { EventConfig } from '../types';

interface HeroSectionProps {
  event: EventConfig & { remainingCount: number };
  flyerUrl: string;
  onOpenBooking: () => void;
  onExplore: () => void;
  secretLocationRevealed: boolean;
  secretAddress: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  event,
  flyerUrl,
  onOpenBooking,
  onExplore,
  secretLocationRevealed,
  secretAddress,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(
      event.targetDateIso || '2026-11-28T23:00:00'
    ).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [event.targetDateIso]);

  return (
    <section
      id="home"
      className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-center">

          {/* Left Column: Event Presentation & Countdown */}
          <div className="lg:col-span-7 min-w-0 flex flex-col items-start text-left z-10">

            {/* Tagline Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 shadow-lg backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Mireza Caribbean présente</span>
            </motion.div>

            {/* Main Headline: MALEDIKE on one line, PARTY underneath */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl 2xl:text-7xl font-black uppercase tracking-tight text-white font-display leading-[0.95] drop-shadow-2xl max-w-full"
            >
              <span className="block whitespace-nowrap">
                MALEDIKE
              </span>

              <span className="block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-pink-500 font-black italic">
                PARTY
              </span>
            </motion.h1>

            {/* Quick Specs Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap items-center gap-2 sm:gap-3 my-4 sm:my-5"
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white/90 text-[11px] sm:text-xs font-semibold backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span>SAMEDI 28 NOVEMBRE 2026</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white/90 text-[11px] sm:text-xs font-semibold backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>23H00 — 06H00</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs font-bold backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>SECRET LOCATION</span>
              </div>
            </motion.div>

            {/* Secret Location Banner */}
            {secretLocationRevealed && secretAddress && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full mb-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-start gap-2.5 backdrop-blur-md"
              >
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-white block uppercase tracking-wide">
                    📍 Adresse Débloquée pour les Titulaires :
                  </span>
                  <span className="text-emerald-100">{secretAddress}</span>
                </div>
              </motion.div>
            )}

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="w-full max-w-xl glass-smoked p-4 sm:p-5 rounded-2xl border border-white/10 mb-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Compte à rebours officiel</span>
                </div>

                <div className="text-[10px] sm:text-[11px] font-semibold text-white/50 uppercase tracking-widest">
                  28 NOV • 23H
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                <div className="glass-emerald-card rounded-xl p-2 sm:p-3 text-center border border-emerald-500/30">
                  <div className="text-xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                    {String(timeLeft.days).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-emerald-300">
                    Jours
                  </div>
                </div>

                <div className="glass-emerald-card rounded-xl p-2 sm:p-3 text-center border border-emerald-500/30">
                  <div className="text-xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-emerald-300">
                    Heures
                  </div>
                </div>

                <div className="glass-emerald-card rounded-xl p-2 sm:p-3 text-center border border-emerald-500/30">
                  <div className="text-xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-emerald-300">
                    Minutes
                  </div>
                </div>

                <div className="glass-emerald-card rounded-xl p-2 sm:p-3 text-center border border-emerald-500/30">
                  <div className="text-xl sm:text-4xl font-extrabold text-white font-display tracking-tight text-emerald-400">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-emerald-300">
                    Secondes
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"
            >
              <button
                onClick={onOpenBooking}
                disabled={event.status === 'sold_out'}
                className="glass-emerald-btn group px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                <span>
                  {event.status === 'sold_out'
                    ? 'COMPLET / SOLD OUT'
                    : 'RÉSERVER MON BILLET (10.000 FCFA)'}
                </span>
              </button>

              <button
                onClick={onExplore}
                className="px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-md"
              >
                <span>Découvrir l'univers</span>
                <ChevronDown className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </motion.div>

            {/* Security Guarantee */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex items-center gap-2 mt-4 sm:mt-5 text-[10px] sm:text-[11px] text-white/60"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Paiement mobile sécurisé • Billet QR code personnel, valable pour un seul passage.
              </span>
            </motion.div>
          </div>

          {/* Right Column: Hero Flyer */}
          <div className="lg:col-span-5 min-w-0 flex justify-center z-10 mt-8 sm:mt-10 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-sm sm:max-w-md"
            >
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-pink-500/30 via-emerald-500/20 to-purple-500/30 blur-2xl opacity-75" />

              <div className="relative aspect-square w-full rounded-2xl overflow-hidden glass-smoked border border-white/15 shadow-2xl group flex items-center justify-center bg-black/60">
                <img
                  src={flyerUrl}
                  alt="Affiche Officielle MALEDIKE PARTY"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
