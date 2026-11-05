import React from 'react';
import { motion } from 'motion/react';
import { Flame, Sparkles } from 'lucide-react';

interface MoodSectionProps {
  moodImage1: string;
  moodImage2: string;
}

export const MoodSection: React.FC<MoodSectionProps> = ({ moodImage1, moodImage2 }) => {
  return (
    <section id="experience" className="relative py-16 sm:py-24 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-12 sm:mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase tracking-widest mb-3 backdrop-blur-md">
            <Flame className="w-3.5 h-3.5" />
            <span>L'Atmosphère</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tight font-display">
            THE <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">mood</span>
          </h2>
          <p className="text-white/70 text-sm max-w-lg mx-auto mt-3">
            Une scénographie immersive pensée pour celles et ceux qui vivent la nuit avec passion et élégance.
          </p>
        </div>

        {/* 2-Column Mood Feature Grid with zero mobile text overlap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-smoked-card rounded-3xl p-5 sm:p-7 border border-white/10 flex flex-col justify-between group hover:border-pink-500/30 transition-all duration-500"
          >
            {/* Responsive Media Container */}
            <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden mb-6 bg-black/40 shadow-inner">
              <img
                src={moodImage1}
                alt="Mireza Girls People Atmosphere"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-pink-300 border border-pink-500/30">
                Signature Vibe
              </div>
            </div>

            {/* Content with strict breathing margin to prevent any mobile overlap */}
            <div className="pt-2">
              <h3 className="text-xl sm:text-2xl font-black uppercase text-white mb-2.5 font-display tracking-tight">
                "COME AS YOU ARE. JUST MAKE IT SEXY."
              </h3>
              <p className="text-white/70 text-sm leading-relaxed font-normal">
                Aucun protocole guindé. Viens avec ton flow le plus captivant, entouré de tes amis pour célébrer la vie jusqu'au lever du jour dans une ambiance survoltée et intimiste.
              </p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="glass-smoked-card rounded-3xl p-5 sm:p-7 border border-white/10 flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-500"
          >
            {/* Responsive Media Container */}
            <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden mb-6 bg-black/40 shadow-inner">
              <img
                src={moodImage2}
                alt="Mireza Private Party Atmosphere"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                11PM — 6AM
              </div>
            </div>

            {/* Content with strict breathing margin */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  EXPÉRIENCE SIGNATURE EXCLUSIVE
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase text-white mb-2.5 font-display tracking-tight">
                UNE NUIT SANS COMPROMIS
              </h3>
              <p className="text-white/70 text-sm leading-relaxed font-normal">
                Musique caribéenne, shatta, amapiano, afrobeat & hip-hop orchestrée par les meilleurs DJs dans un cadre confidentiel et ultra-sélect au coeur d'Abidjan.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
