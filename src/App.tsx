import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { supabase } from './services/supabase';
import { EventConfig, SiteAssets, UserProfile, TicketCategory } from './types';
import { Navbar } from './components/Navbar';
import { MobileDrawer } from './components/MobileDrawer';
import { HeroSection } from './components/HeroSection';
import { MoodSection } from './components/MoodSection';
import { GallerySection } from './components/GallerySection';
import { SalonsSection } from './components/SalonsSection';
import { ConceptSection } from './components/ConceptSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { BookingTunnelModal } from './components/BookingTunnelModal';
import { AuthModal } from './components/AuthModal';
import { UserAccountModal } from './components/UserAccountModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AgentScannerView } from './components/AgentScannerView';

export default function App() {
  const [isScannerRoute, setIsScannerRoute] = useState(false);
  const [scannerTokenParam, setScannerTokenParam] = useState('');
  const [event, setEvent] = useState<EventConfig & { remainingCount: number }>({
    id: 'maledike-party-2026',
    title: 'MALEDIKE PARTY',
    subtitle: 'Mireza Caribbean présente — Une nuit exclusive sans compromis au coeur d\'Abidjan.',
    date: 'Samedi 28 Novembre 2026',
    targetDateIso: '2026-11-28T23:00:00',
    timeRange: '23H00 — 06H00',
    ticketPrice: 10000,
    currency: 'FCFA',
    totalCapacity: 350,
    soldCount: 1,
    status: 'open',
    remainingCount: 349,
    secretLocationAddress: 'Villa Rêve d\'Émeraude, Zone Bld de Marseille, Biétry / Marcory, Abidjan (Accès filtré)',
    isSecretLocationRevealed: false,
    conciergeWhatsApp: '+2250150049489',
    conciergeDisplayPhone: '+225 01 50 04 94 89',
  });

  const [siteAssets, setSiteAssets] = useState<SiteAssets>({
    backgroundImageUrl: '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47_72294852.jpeg',
    heroFlyerUrl: '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg',
    moodImage1: '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.33_6cfe3486.jpeg',
    moodImage2: '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.32_d946a24f.jpeg',
    galleryImages: [
      '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47__1__04f6111a.jpeg',
      '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.33_6cfe3486.jpeg',
      '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.32_d946a24f.jpeg',
      '/assets/aistudio/gallery_vibe_01.png',
    ],
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingInitialQty, setBookingInitialQty] = useState(1);
  const [bookingInitialCategory, setBookingInitialCategory] = useState<TicketCategory>('pass_vip');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAuthQuantity, setPendingAuthQuantity] = useState<number | undefined>(undefined);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    // Load initial data
    api.getEvent().then(data => setEvent(data));
    api.getSiteAssets().then(data => setSiteAssets(data));
    // Affichage immédiat depuis le cache, puis validation de la vraie session Supabase
    setCurrentUser(api.getSavedUser());
    api.restoreSession().then(user => setCurrentUser(user));
    const { data: authListener } = supabase.auth.onAuthStateChange(event => {
      // Pas d'appel Supabase ici (risque de blocage) : on réagit uniquement à la déconnexion
      if (event === 'SIGNED_OUT') setCurrentUser(null);
    });

    // Check URL routing for Admin or Scanner Agent
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);

      if (path === '/scanner' || hash.startsWith('#scanner') || params.has('token')) {
        setIsScannerRoute(true);
        const tok = params.get('token') || (hash.includes('token=') ? hash.split('token=')[1] : '');
        setScannerTokenParam(tok);
      } else {
        setIsScannerRoute(false);
      }

      if (hash === '#admin' || path === '/admin') {
        setIsAdminOpen(true);
      }

      if (hash.includes('success') || params.has('orderId')) {
        const orderId = params.get('orderId') || (hash.includes('orderId=') ? hash.split('orderId=')[1].split('&')[0] : '');
        if (orderId) {
          api.checkOrderStatus(orderId).then(res => {
            if (res.status === 'completed') {
              setIsAccountOpen(true);
            }
          }).catch(() => {});
        }
      }
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleOpenBooking = (quantity: number = 1, category: TicketCategory = 'pass_vip') => {
    setBookingInitialQty(quantity);
    setBookingInitialCategory(category);
    if (!currentUser) {
      setPendingAuthQuantity(quantity);
      setIsAuthOpen(true);
      return;
    }
    setIsBookingOpen(true);
  };

  const handleRequireAuth = (pendingQuantity: number) => {
    setIsBookingOpen(false);
    setPendingAuthQuantity(pendingQuantity);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    // If user was in middle of reserving, restore booking modal automatically
    if (pendingAuthQuantity) {
      setBookingInitialQty(pendingAuthQuantity);
      setPendingAuthQuantity(undefined);
      setIsBookingOpen(true);
    }
  };

  const handleLogout = () => {
    api.logoutUser();
    setCurrentUser(null);
  };

  const handleExploreScroll = () => {
    const el = document.getElementById('experience');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (isScannerRoute) {
    return (
      <AgentScannerView
        initialToken={scannerTokenParam}
        onExit={() => {
          window.location.hash = '';
          window.history.pushState({}, '', '/');
          setIsScannerRoute(false);
        }}
      />
    );
  }

  // Standalone Full-Page Admin Dashboard (Page dédiée et non bloc modal)
  if (isAdminOpen) {
    return (
      <AdminDashboard
        isOpen={true}
        onClose={() => {
          setIsAdminOpen(false);
          if (window.location.hash === '#admin') {
            window.location.hash = '';
          }
          if (window.location.pathname === '/admin') {
            window.history.pushState({}, '', '/');
          }
        }}
        event={event}
        siteAssets={siteAssets}
        currentUser={currentUser}
        onEventUpdated={updated => setEvent(prev => ({ ...prev, ...updated }))}
        onSiteAssetsUpdated={updated => setSiteAssets(updated)}
      />
    );
  }

  return (
    <div className="relative min-h-screen text-white bg-[#0a0710] selection:bg-emerald-500 selection:text-black">
      {/* 1. CONTINUOUS PINK STRIPED BACKGROUND (STABILIZED ARRIÈRE-PLAN) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-700"
        style={{
          backgroundImage: `url(${siteAssets.backgroundImageUrl || '/assets/aistudio/WhatsApp_Image_2026-11-01_at_11.15.47_72294852.jpeg'})`,
        }}
      />
      {/* Smoked glass vignette overlay for high typography contrast & zero eye fatigue */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/85 via-black/60 to-black/90 backdrop-blur-[2px] pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,10,0.85)_90%)] pointer-events-none" />

      {/* 3. MAIN NAVBAR */}
      <Navbar
        currentUser={currentUser}
        onOpenBooking={() => handleOpenBooking(1)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAuth={() => {
          setPendingAuthQuantity(undefined);
          setIsAuthOpen(true);
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* 4. MOBILE SLIDE DRAWER */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={currentUser}
        onOpenBooking={() => handleOpenBooking(1)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAuth={() => {
          setPendingAuthQuantity(undefined);
          setIsAuthOpen(true);
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        conciergePhone={event.conciergeDisplayPhone}
      />

      {/* 5. CONTINUOUS SCROLL EXPERIENCE */}
      <main className="relative z-10">
        {/* Hero Section */}
        <HeroSection
          event={event}
          flyerUrl={siteAssets.heroFlyerUrl}
          onOpenBooking={() => handleOpenBooking(1, 'pass_vip')}
          onExplore={handleExploreScroll}
          secretLocationRevealed={event.isSecretLocationRevealed}
          secretAddress={event.secretLocationAddress}
        />

        {/* VIP Salons & Formules Privatives */}
        <SalonsSection
          onSelectFormula={(category) => handleOpenBooking(1, category)}
          conciergePhone={event.conciergeDisplayPhone}
        />

        {/* The Mood Section */}
        <MoodSection
          moodImage1={siteAssets.moodImage1}
          moodImage2={siteAssets.moodImage2}
        />

        {/* Visual Gallery */}
        <GallerySection images={siteAssets.galleryImages} />

        {/* The Concept Section */}
        <ConceptSection
          onOpenBooking={() => handleOpenBooking(1, 'pass_vip')}
          conciergePhone={event.conciergeDisplayPhone}
        />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* 6. FOOTER */}
      <Footer
        currentUser={currentUser}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        conciergePhone={event.conciergeDisplayPhone}
      />

      {/* 7. MODALS */}
      {/* 4-Step Booking Tunnel */}
      <BookingTunnelModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        event={event}
        currentUser={currentUser}
        onRequireAuth={handleRequireAuth}
        onOpenAccount={() => setIsAccountOpen(true)}
        initialQuantity={bookingInitialQty}
        initialCategory={bookingInitialCategory}
      />

      {/* Auth Modal (Register / Login) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        pendingQuantity={pendingAuthQuantity}
      />

      {/* User Account ("Mon Compte" & Pass Numériques) */}
      {currentUser && (
        <UserAccountModal
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
          currentUser={currentUser}
          onUserUpdate={updated => setCurrentUser(updated)}
          onLogout={handleLogout}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenBooking={() => handleOpenBooking(1, 'pass_vip')}
        />
      )}
    </div>
  );
}
