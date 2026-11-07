import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Quel est le tarif d\'entrée et quelles sont les formules ?',
    a: 'La MALEDIKE PARTY propose un tarif unique et certifié de 10 000 FCFA par personne. Aucun surcoût : tous les invités bénéficient de l\'accès complet à l\'expérience, au dancefloor et aux sets DJs.',
  },
  {
    q: 'Comment et quand le lieu secret est-il communiqué ?',
    a: 'Afin de préserver la confidentialité et l\'exclusivité de la soirée, l\'adresse exacte (située dans une villa prestigieuse à Abidjan) est débloquée exactement 24h avant l\'événement directement dans votre espace ("Mon Compte") et transmise par notification.',
  },
  {
    q: 'Puis-je apporter mes propres boissons (BYOB) ?',
    a: 'Oui, c\'est une soirée BYOB : apportez vos bouteilles. Nous fournissons les glaçons, les verres et les softs. Profitez avec modération et ne prenez pas le volant.',
  },
  {
    q: 'Quel est le Dress Code requis ?',
    a: '"Come as you are. Just make it sexy." Aucun uniforme strict : nous encourageons un style chic, glamour, audacieux et soigné pour sublimer l\'énergie de la nuit.',
  },
  {
    q: 'Comment fonctionne le billet numérique et le contrôle à l\'entrée ?',
    a: 'Dès validation de votre paiement, un billet électronique doté d\'un QR code personnel, valable pour un seul passage, est immédiatement généré et consultable dans votre espace.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-8 sm:py-24 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-widest mb-3 backdrop-blur-md">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Informations Importantes</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight font-display">
            QUESTIONS <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-300">fréquentes</span>
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl glass-smoked-card border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-white text-sm sm:text-base font-display">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-5 sm:px-6 pb-6 pt-1 text-white/70 text-xs sm:text-sm leading-relaxed border-t border-white/5"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
