import React, { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';
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

export const HeroSection: React.FC<HeroSectionProps> = ({ event, flyerUrl, onOpenBooking }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(event.targetDateIso || '2026-11-28T23:00:00').getTime();
    const updateTimer = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event.targetDateIso]);

  const image = flyerUrl || '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg';

  return (
    <section id="home" className="relative w-full m-0 p-0 overflow-hidden">
      <div className="w-full max-w-[1920px] mx-auto">
        <div className="relative w-full aspect-[16/9] sm:rounded-xl overflow-hidden bg-black">
          <img src={image} alt="Affiche officielle MALEDIKE PARTY" className="absolute inset-0 w-full h-full object-cover object-center" loading="eager" onError={e => { (e.target as HTMLImageElement).src = '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg'; }} />
        </div>
        <div className="relative -mt-1 sm:mt-0 px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 bg-black/45 sm:bg-transparent">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-white">
            {([['J', timeLeft.days], ['H', timeLeft.hours], ['M', timeLeft.minutes], ['S', timeLeft.seconds]] as [string, number][]).map(([label, value]) => <div key={label} className="min-w-[48px] sm:min-w-[58px] px-2 py-1.5 sm:py-2 rounded-md bg-black/55 border border-white/15 text-center"><div className="text-lg sm:text-2xl font-black tabular-nums leading-tight">{String(value).padStart(2, '0')}</div><div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/65">{label}</div></div>)}
          </div>
          <button onClick={onOpenBooking} disabled={event.status === 'sold_out'} className="glass-emerald-btn px-5 sm:px-7 py-2.5 sm:py-3 rounded-lg text-black font-extrabold text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"><Ticket className="w-4 h-4" />{event.status === 'sold_out' ? 'COMPLET / SOLD OUT' : 'RÉSERVER MON BILLET'}</button>
        </div>
      </div>
    </section>
  );
};
