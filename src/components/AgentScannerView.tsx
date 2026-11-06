import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  CameraOff,
  RefreshCw,
  ShieldCheck,
  User,
  Ticket as TicketIcon,
  LogOut,
  History,
} from 'lucide-react';
import { api } from '../services/api';
import { ScannerToken } from '../types';

interface AgentScannerViewProps {
  initialToken?: string;
  onExit?: () => void;
}

export const AgentScannerView: React.FC<AgentScannerViewProps> = ({
  initialToken = '',
  onExit,
}) => {
  const [token, setToken] = useState<string>(initialToken);
  const [tokenInfo, setTokenInfo] = useState<ScannerToken | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState<boolean>(true);

  // Scan state
  const [manualCode, setManualCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
    ticket?: any;
    alreadyCheckedInAt?: string;
  } | null>(null);

  // Camera scanner state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Recent scans for this agent session
  const [recentScans, setRecentScans] = useState<
    Array<{
      id: string;
      time: string;
      success: boolean;
      attendeeName: string;
      ticketNumber: string;
      status: string;
      note?: string;
    }>
  >([]);

  // Sound synthesis for instant acoustic feedback
  const playBeep = (type: 'success' | 'duplicate' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // Crisp dual chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'duplicate') {
        // Heavy buzzing warning
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {}
  };

  // 1. Validate scanner token upon mount or change
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const activeToken = token || urlParams.get('token') || hashParams.get('token') || '';

    if (!activeToken) {
      setIsValidatingToken(false);
      setTokenError('Lien d\'accès invalide ou manquant. Aucun jeton scanner fourni.');
      return;
    }

    setToken(activeToken);
    verifyToken(activeToken);
  }, []);

  const verifyToken = async (tok: string) => {
    setIsValidatingToken(true);
    setTokenError(null);
    try {
      const res = await api.verifyScannerToken(tok);
      if (res.valid && res.tokenInfo) {
        setTokenInfo(res.tokenInfo);
        // Load existing audit history for this scanner
        api.getScannerHistory(tok).then(logs => {
          if (Array.isArray(logs) && logs.length > 0) {
            const mapped = logs.map(l => ({
              id: l.id,
              time: new Date(l.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              success: l.action === 'TICKET_CHECKED_IN',
              attendeeName: l.details?.attendeeName || 'Visiteur VIP',
              ticketNumber: l.details?.ticketNumber || l.details?.rawInput || 'MLDK',
              status: l.action === 'TICKET_CHECKED_IN' ? 'VALIDÉ' : l.action === 'DUPLICATE_SCAN_REJECTED' ? 'DOUBLON REFUSÉ' : 'REFUSÉ',
              note: l.details?.alreadyCheckedInAt ? `Déjà scanné à ${new Date(l.details.alreadyCheckedInAt).toLocaleTimeString('fr-FR')}` : undefined,
            }));
            setRecentScans(mapped);
          }
        });
      } else {
        setTokenError(res.message || 'Jeton de filtrage révoqué ou expiré.');
      }
    } catch (err: any) {
      setTokenError(err.message || 'Erreur de connexion au serveur de contrôle.');
    } finally {
      setIsValidatingToken(false);
    }
  };

  // 2. Camera video feed lifecycle
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Votre navigateur ne prend pas en charge la caméra.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(err.message || 'Impossible d\'accéder à la caméra de l\'appareil.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 3. Process Ticket Code
  const handleVerifyTicket = async (codeToVerify?: string) => {
    const rawCode = (codeToVerify || manualCode).trim();
    if (!rawCode) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await api.agentScanTicket(rawCode, token);
      setScanResult(res);

      if (res.success) {
        playBeep('success');
        const scannedTicket = res.ticket;
        setRecentScans(prev => [
          {
            id: 'scan_' + Date.now(),
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            success: true,
            attendeeName: scannedTicket?.attendeeName || 'Visiteur VIP',
            ticketNumber: scannedTicket?.ticketNumber || rawCode.slice(0, 14),
            status: 'VALIDÉ',
          },
          ...prev.slice(0, 19),
        ]);
        setManualCode('');
      } else {
        const isDuplicate = res.error === 'ALREADY_USED';
        if (isDuplicate) {
          playBeep('duplicate');
        } else {
          playBeep('error');
        }

        const scannedTicket = res.ticket;
        setRecentScans(prev => [
          {
            id: 'scan_' + Date.now(),
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            success: false,
            attendeeName: scannedTicket?.attendeeName || 'Inconnu',
            ticketNumber: scannedTicket?.ticketNumber || rawCode.slice(0, 14),
            status: isDuplicate ? 'DOUBLON REFUSÉ' : 'REFUSÉ',
            note: res.alreadyCheckedInAt ? `Déjà scanné à ${new Date(res.alreadyCheckedInAt).toLocaleTimeString('fr-FR')}` : undefined,
          },
          ...prev.slice(0, 19),
        ]);
      }
    } catch (err: any) {
      playBeep('error');
      setScanResult({
        success: false,
        message: err.message || 'Erreur de connexion au serveur.',
        error: 'NETWORK_ERROR',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // 4. Token validation view
  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-[#07050c] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-12 h-12 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin mb-4" />
        <h2 className="text-lg font-black uppercase tracking-wider font-display">
          Validation du terminal de filtrage...
        </h2>
        <p className="text-xs text-white/50 mt-1">Connexion sécurisée au poste de contrôle MALEDIKE PARTY</p>
      </div>
    );
  }

  // 5. Token error view
  if (tokenError || !tokenInfo) {
    return (
      <div className="min-h-screen bg-[#07050c] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-wider font-display text-white">
          Accès Scanner Interdit
        </h2>
        <p className="text-sm text-red-300 max-w-md mx-auto mt-2">
          {tokenError || 'Ce lien d\'accès agent est expiré, inexistant ou a été révoqué par la direction de Mireza Caribbean.'}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold uppercase tracking-wider"
          >
            Réessayer
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="px-5 py-2.5 rounded-xl glass-emerald-btn text-black text-xs font-black uppercase tracking-wider"
            >
              Retour à l'accueil
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07050c] text-white flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Header Bar */}
      <header className="border-b border-emerald-500/20 bg-black/80 backdrop-blur-xl sticky top-0 z-20 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Poste de Filtrage Actif
              </span>
            </div>
            <h1 className="text-sm font-black text-white uppercase font-display leading-tight">
              {tokenInfo.gateName} • <span className="text-white/60 font-sans text-xs font-medium">{tokenInfo.agentName}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onExit && (
            <button
              onClick={onExit}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
              title="Quitter le scanner"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Scanner Container */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Anti-fraud status pill */}
        <div className="p-3 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white/70">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Chiffrement anti-fraude SHA-256 actif</span>
          </div>
          <span className="text-emerald-400 font-mono font-bold text-[11px]">
            Total scans: {tokenInfo.scanCount}
          </span>
        </div>

        {/* Scan Result Feedback Card */}
        <AnimatePresence mode="wait">
          {scanResult && (
            <motion.div
              key={scanResult.message + (scanResult.ticket?.id || '')}
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`p-5 rounded-3xl border-2 text-center space-y-3 shadow-2xl ${
                scanResult.success
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.35)]'
                  : scanResult.error === 'ALREADY_USED'
                  ? 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                  : 'bg-amber-950/90 border-amber-500 text-amber-100'
              }`}
            >
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-black/40 border border-white/20">
                {scanResult.success ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                ) : scanResult.error === 'ALREADY_USED' ? (
                  <XCircle className="w-10 h-10 text-red-400 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-amber-400" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-black uppercase font-display tracking-tight">
                  {scanResult.message}
                </h3>
                {scanResult.alreadyCheckedInAt && (
                  <p className="text-xs font-semibold text-red-300 mt-1">
                    Premier passage enregistré à {new Date(scanResult.alreadyCheckedInAt).toLocaleTimeString('fr-FR')}
                  </p>
                )}
              </div>

              {scanResult.ticket && (
                <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-left space-y-1 text-xs">
                  <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                    <span className="text-white/60">Titulaire</span>
                    <span className="font-extrabold text-white text-sm">{scanResult.ticket.attendeeName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Numéro de Billet</span>
                    <span className="font-mono font-bold text-emerald-400">{scanResult.ticket.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Tarif Certifié</span>
                    <span className="font-bold text-white">10 000 FCFA</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera Scanner View / Toggle */}
        <div className="p-4 rounded-3xl bg-black/50 border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-white/80">
              Caméra QR Code
            </span>
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                cameraActive
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {cameraActive ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Arrêter la caméra</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Activer la caméra</span>
                </>
              )}
            </button>
          </div>

          {cameraActive && (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-emerald-500/40 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scan target reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-300" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-300" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-300" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-300" />
                </div>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs">
              {cameraError}
            </div>
          )}
        </div>

        {/* Manual Code / Laser Gun Input */}
        <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
            Saisie manuelle ou Douchette Laser
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Coller le hash SHA-256 ou MLDK-2026-..."
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleVerifyTicket();
              }}
              className="flex-1 bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={() => handleVerifyTicket()}
              disabled={isScanning || !manualCode.trim()}
              className="glass-emerald-btn px-6 py-3 rounded-xl text-black font-black text-xs uppercase tracking-wider cursor-pointer disabled:opacity-40"
            >
              {isScanning ? 'Scan...' : 'Valider'}
            </button>
          </div>
        </div>

        {/* Session Scan History */}
        {recentScans.length > 0 && (
          <div className="p-4 rounded-3xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white/60">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Historique récent de ce poste</span>
            </div>
            <div className="space-y-2">
              {recentScans.map(s => (
                <div
                  key={s.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    s.success
                      ? 'bg-emerald-950/20 border-emerald-500/20'
                      : s.status.includes('DOUBLON')
                      ? 'bg-red-950/40 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div>
                    <span className="font-bold text-white block">{s.attendeeName}</span>
                    <span className="text-[10px] text-white/50 font-mono">{s.ticketNumber} • {s.time}</span>
                    {s.note && (
                      <span className="text-[10px] text-red-400 font-semibold block mt-0.5">{s.note}</span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      s.success
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
