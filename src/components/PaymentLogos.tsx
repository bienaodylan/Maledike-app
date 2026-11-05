import React from 'react';

interface LogoProps {
  className?: string;
  imgClassName?: string;
}

/**
 * 1. Wave Mobile Money Official Logo
 */
export const WaveLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10', imgClassName = 'w-full h-full object-contain' }) => (
  <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-[#1DC4FF] shadow-md p-1 ${className}`}>
    <img
      src="/assets/payment-logos/wave.png"
      alt="Wave Mobile Money"
      className={imgClassName}
      loading="eager"
    />
  </div>
);

/**
 * 2. Orange Money Official Logo
 */
export const OrangeMoneyLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10', imgClassName = 'w-full h-full object-contain' }) => (
  <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-white shadow-md p-1 border border-white/10 ${className}`}>
    <img
      src="/assets/payment-logos/orange-money.png"
      alt="Orange Money"
      className={imgClassName}
      loading="eager"
    />
  </div>
);

/**
 * 3. MTN MoMo Official Logo
 */
export const MtnMomoLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10', imgClassName = 'w-full h-full object-contain' }) => (
  <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-[#FFCC00] shadow-md p-0.5 ${className}`}>
    <img
      src="/assets/payment-logos/mtn-momo.png"
      alt="MTN MoMo"
      className={imgClassName}
      loading="eager"
    />
  </div>
);

/**
 * 4. Moov Money Official Logo
 */
export const MoovMoneyLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10', imgClassName = 'w-full h-full object-contain' }) => (
  <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-white shadow-md p-0.5 ${className}`}>
    <img
      src="/assets/payment-logos/moov-money.png"
      alt="Moov Money"
      className={imgClassName}
      loading="eager"
    />
  </div>
);

/**
 * 5. Carte Bancaire / Djamo Official Logo
 */
export const DjamoCardLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10', imgClassName = 'w-full h-full object-contain' }) => (
  <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-[#110f1a] shadow-md p-1 border border-white/10 ${className}`}>
    <img
      src="/assets/payment-logos/djamo.png"
      alt="Djamo & Carte Bancaire"
      className={imgClassName}
      loading="eager"
    />
  </div>
);
