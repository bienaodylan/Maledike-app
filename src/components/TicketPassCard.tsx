import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Ticket as TicketType } from '../types';
import { Download, Share2, ShieldCheck, MapPin, Calendar, Clock, User, CheckCircle2 } from 'lucide-react';

interface TicketPassCardProps {
  ticket: TicketType;
  secretLocationRevealed?: boolean;
  secretAddress?: string | null;
  onDownloadPdf?: () => void;
  onShareWhatsApp?: () => void;
}

export const TicketPassCard: React.FC<TicketPassCardProps> = ({
  ticket,
  secretLocationRevealed = false,
  secretAddress = null,
  onDownloadPdf,
  onShareWhatsApp,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket.qrTokenHash) {
      QRCode.toDataURL(ticket.qrTokenHash, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Error generating QR code', err));
    }
  }, [ticket.qrTokenHash]);

  const handleShare = () => {
    if (onShareWhatsApp) {
      onShareWhatsApp();
      return;
    }
    const message = `🎉 J'ai mon Billet Officiel pour la MALEDIKE PARTY !
N° Billet : ${ticket.ticketNumber}
Date : Samedi 28 Novembre 2026 (23H00 - 06H00)
Lieu : Secret Location Abidjan
Come as you are. Just make it sexy! 🔥`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownload = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }
    // Clean print view or image download
    window.print();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Visual VIP Ticket Pass with Glassmorphism & Emerald Glow */}
      <div
        ref={cardRef}
        className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#171222] via-[#0f0c18] to-[#0a0812] border border-emerald-500/40 shadow-[0_15px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(16,185,129,0.2)] p-6 text-white text-left"
      >
        {/* Top Hologram Ribbon */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pink-500 via-emerald-400 to-rose-500" />

        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

        {/* Pass Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{ticket.categoryName || 'Pass Officiel VIP • Entrée Unique'}</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white font-display">
              MALEDIKE <span className="text-pink-400 font-extrabold italic">PARTY</span>
            </h3>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">
              Mireza Caribbean Présente
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-black font-mono">
              {ticket.ticketNumber}
            </span>
            <div className="text-[10px] text-white/50 mt-1 uppercase font-semibold">
              {ticket.price.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        {/* Attendee Details */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] text-white/50 uppercase font-bold flex items-center gap-1 mb-1">
              <User className="w-3 h-3 text-pink-400" />
              <span>Titulaire</span>
            </div>
            <div className="font-bold text-white truncate text-sm">
              {ticket.attendeeName}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] text-white/50 uppercase font-bold flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span>Date & Heure</span>
            </div>
            <div className="font-bold text-white text-xs truncate">
              {ticket.eventDate}
            </div>
            <div className="text-[10px] text-white/60 font-medium">
              {ticket.eventTime}
            </div>
          </div>
        </div>

        {/* Location info */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 mb-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-400 mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Lieu de l'événement</span>
          </div>
          {secretLocationRevealed && secretAddress ? (
            <div className="text-xs text-white font-semibold">
              📍 {secretAddress}
            </div>
          ) : (
            <div className="text-xs text-white/70 italic flex items-center justify-between">
              <span>🔒 Lieu Secret (Communiqué 24h avant sur WhatsApp)</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Abidjan</span>
            </div>
          )}
        </div>

        {/* Scannable High Resolution QR Code */}
        <div className="p-4 rounded-2xl bg-white text-black text-center shadow-xl flex flex-col items-center justify-center my-3">
          <div className="relative">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Billet Officiel"
                className="w-44 h-44 object-contain mx-auto"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-black/50">
                Génération QR...
              </div>
            )}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500 opacity-60 animate-scanline pointer-events-none" />
          </div>

          <div className="mt-2 text-center">
            <div className="text-[9px] font-mono tracking-widest text-black/60 uppercase">
              SCAN DE CONTRÔLE À L'ENTRÉE
            </div>
            <div className="text-[10px] font-black text-black tracking-wider uppercase flex items-center justify-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>BILLET CRYPTÉ ANTI-FRAUDE UNIQUE</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            {ticket.status === 'checked_in' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                <CheckCircle2 className="w-3 h-3" /> Validé à l'entrée
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Billet Confirmé
              </span>
            )}
          </div>
          <span className="text-[10px] text-white/40 font-mono">
            ID: {ticket.id.slice(0, 12)}...
          </span>
        </div>
      </div>

      {/* Action Buttons for ticket */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleDownload}
          className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Imprimer / PDF</span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 glass-emerald-btn py-3 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <Share2 className="w-4 h-4 text-black" />
          <span>Partager WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
