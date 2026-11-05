import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface SplashScreenProps {
  onEnter: () => void;
  backgroundUrl: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter, backgroundUrl }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (api.isSplashDismissed()) {
      setIsVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      handleEnter();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    api.setSplashDismissed();
    setIsVisible(false);
    onEnter();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
      >
        {/* Continuous Striped Pink Background with cinematic dark vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_85%)]" />

        {/* Ambient Emerald Aura */}
        <div className="absolute w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 rounded-full bg-pink-500/20 blur-3xl -bottom-20 -right-20 pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 max-w-xl mx-auto px-6 text-center flex flex-col items-center">
          {/* Top Brand Tag */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-widest shadow-lg mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Mireza Caribbean présente</span>
          </motion.div>

          {/* Main Title Identity */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="mb-4"
          >
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-white uppercase drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
              MALEDIKE
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-pink-500 font-black italic tracking-normal -mt-2">
                PARTY
              </span>
            </h1>
          </motion.div>

          {/* Date & Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-2 mb-8"
          >
            <div className="inline-block px-3 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/15 text-pink-200 text-sm font-bold uppercase tracking-wider">
              Samedi 28 Novembre 2026 • 23H00 — 06H00
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              ARE YOU READY?
            </p>
            <p className="text-white/70 text-sm max-w-md mx-auto leading-relaxed">
              Une nuit exclusive sans compromis au coeur d'Abidjan. Billetterie officielle ultra-sélecte.
            </p>
          </motion.div>

          {/* Action Button: Emerald Glassmorphism */}
          <motion.button
            onClick={handleEnter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="glass-emerald-btn group relative px-8 py-4 rounded-2xl text-black font-extrabold text-base uppercase tracking-wider flex items-center gap-3 cursor-pointer"
          >
            <span>ENTER THE EXPERIENCE</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>

          {/* Security notice */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="mt-6 text-white/50 text-[11px] tracking-widest uppercase"
          >
            Passe-entrée unique • 10.000 FCFA • Accès strictement sécurisé
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
