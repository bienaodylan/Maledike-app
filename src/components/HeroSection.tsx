import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventConfig } from '../types';

interface HeroSectionProps {
  event: EventConfig & { remainingCount: number };
  flyerUrl: string;
  heroImages?: string[];
  onOpenBooking: () => void;
  onExplore: () => void;
  secretLocationRevealed: boolean;
  secretAddress: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  event,
  flyerUrl,
  heroImages = [],
  onOpenBooking,
  onExplore,
  secretLocationRevealed,
  secretAddress,
}) => {
  const slides = Array.from(new Set([flyerUrl, ...heroImages].filter(Boolean)));
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setActiveSlide(index => (index + 1) % slides.length), 6000);
    return (
    <section id="home" className="relative w-full min-h-[calc(100svh-72px)] flex items-center justify-center px-0 sm:px-4 lg:px-6 py-0 sm:py-5 overflow-hidden">
      <div className="relative w-full max-w-[1920px] aspect-video sm:rounded-2xl overflow-hidden bg-black shadow-2xl border-y sm:border border-white/10">
        <img
          key={slides[activeSlide] || flyerUrl}
          src={slides[activeSlide] || flyerUrl || '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg'}
          alt={`Affiche MALEDIKE PARTY ${activeSlide + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/10 pointer-events-none"/>
        {slides.length > 1 && <>
          <button type="button" aria-label="Image précédente" onClick={() => setActiveSlide(i => (i - 1 + slides.length) % slides.length)} className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 rounded-full bg-black/55 hover:bg-black/85 text-white p-1.5 sm:p-3 border border-white/20"><ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6"/></button>
          <button type="button" aria-label="Image suivante" onClick={() => setActiveSlide(i => (i + 1) % slides.length)} className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 rounded-full bg-black/55 hover:bg-black/85 text-white p-1.5 sm:p-3 border border-white/20"><ChevronRight className="w-4 h-4 sm:w-6 sm:h-6"/></button>
          <div className="absolute top-3 sm:top-5 left-0 right-0 flex justify-center gap-1.5 sm:gap-2">
            {slides.map((_, i) => <button key={i} type="button" aria-label={`Afficher l’image ${i + 1}`} onClick={() => setActiveSlide(i)} className={`h-1.5 sm:h-2 rounded-full transition-all ${i === activeSlide ? 'w-5 sm:w-7 bg-white' : 'w-1.5 sm:w-2 bg-white/60'}`}/>)}
          </div>
        </>}
        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-6 lg:p-10 flex flex-col items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-3 text-white">
            {[
              ['J', timeLeft.days], ['H', timeLeft.hours], ['M', timeLeft.minutes], ['S', timeLeft.seconds]
            ].map(([label, value]) => <div key={label} className="min-w-[42px] sm:min-w-[72px] px-1.5 sm:px-3 py-1 sm:py-2 rounded-md sm:rounded-xl bg-black/55 border border-white/20 backdrop-blur-md text-center">
              <div className="text-base sm:text-3xl lg:text-4xl font-black tabular-nums leading-tight">{String(value).padStart(2,'0')}</div>
              <div className="text-[8px] sm:text-xs uppercase tracking-wider text-white/75">{label}</div>
            </div>)}
          </div>
          <button onClick={onOpenBooking} disabled={event.status === 'sold_out'} className="glass-emerald-btn px-4 sm:px-8 py-2 sm:py-4 rounded-lg sm:rounded-xl text-black font-extrabold text-[10px] sm:text-sm lg:text-base uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl disabled:opacity-50">
            <Ticket className="w-3.5 h-3.5 sm:w-5 sm:h-5"/>{event.status === 'sold_out' ? 'COMPLET / SOLD OUT' : 'RÉSERVER MON BILLET'}
          </button>
        </div>
      </div>
    </section>
  );
};
