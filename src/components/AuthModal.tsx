import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  pendingQuantity?: number;
}

const COUNTRY_CODES = [
  { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: '+221', country: 'Sénégal', flag: '🇸🇳' },
  { code: '+229', country: 'Bénin', flag: '🇧🇯' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+237', country: 'Cameroun', flag: '🇨🇲' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pendingQuantity,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('+225');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!firstName.trim() || !lastName.trim() || !whatsappNumber.trim()) {
          throw new Error('Veuillez remplir tous les champs requis.');
        }

        const res = await api.register({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          whatsappNumber: whatsappNumber.trim(),
          countryCode,
        });

        if (res.success && res.requiresEmailConfirmation) {
          setSuccessMessage(
            res.message || 'Compte créé. Consultez votre boîte mail pour confirmer votre adresse avant de vous connecter.'
          );
          setIsRegister(false);
          setPassword('');
        } else if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Erreur lors de l’inscription.');
        }
      } else {
        const res = await api.login(email.trim(), password);
        if (res.success && res.user) {
          onSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Email ou mot de passe incorrect.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-xl"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-md rounded-3xl glass-smoked border border-emerald-500/30 p-6 sm:p-8 shadow-2xl my-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white/70 hover:text-white cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Accès Sécurisé VIP</span>
          </div>
          <h3 className="text-2xl font-black uppercase text-white font-display">
            {isRegister ? 'CRÉER UN COMPTE' : 'CONNEXION CLIENT'}
          </h3>
          <p className="text-xs text-white/60 mt-1">
            {pendingQuantity
              ? `Authentification requise pour réserver vos ${pendingQuantity} place(s).`
              : 'Accédez à vos passes officiels et révélations secrètes.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/60 border border-white/10 mb-6 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              !isRegister ? 'bg-emerald-500 text-black font-extrabold shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            Se Connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              isRegister ? 'bg-emerald-500 text-black font-extrabold shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            S'Inscrire
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex. Dylan"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex. Bienao"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Adresse Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="nom@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/70 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
              />
              <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                placeholder="8 caractères minimum"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/70 border border-white/15 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
              />
              <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1">
                Numéro WhatsApp (Réception du Pass)
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="bg-black/70 border border-white/15 rounded-xl px-2 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code} className="bg-neutral-900 text-white">
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  placeholder="07 08 09 10 11"
                  value={whatsappNumber}
                  onChange={e => setWhatsappNumber(e.target.value)}
                  className="flex-1 bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full glass-emerald-btn py-3.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl mt-4 disabled:opacity-50"
          >
            <span>{isLoading ? 'Traitement en cours...' : (isRegister ? 'Créer mon compte VIP' : 'Se Connecter')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
