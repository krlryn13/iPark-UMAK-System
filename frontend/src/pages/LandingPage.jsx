import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useParkingData } from '../hooks/useParkingData';
import { GuestReservationModal } from '../components/GuestReservationModal';
import LocationTutorialModal from '../components/LocationTutorialModal';
import { useInView } from '../hooks/useInView';

export const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, loading } = useAuth();
  const { lots, loading: parkingLoading } = useParkingData();

  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialTarget, setTutorialTarget] = useState(null);

  // Scroll-trigger refs with reliable threshold across tiny mobile & tall desktop screens
  const [statsRef, statsInView] = useInView({ threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  const [stickerRef, stickerInView] = useInView({ threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  const [aboutRef, aboutInView] = useInView({ threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  const [teamRef, teamInView] = useInView({ threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          const nav = document.getElementById('main-navbar');
          const navH = nav ? nav.offsetHeight : 108;
          const rect = el.getBoundingClientRect();
          const targetY = rect.top + window.scrollY - navH;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        }, 200);
      }
    }
  }, [location.hash]);

  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const nav = document.getElementById('main-navbar');
    const navH = nav ? nav.offsetHeight : 108;
    const rect = el.getBoundingClientRect();
    const targetY = rect.top + window.scrollY - navH;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  };

  // Live HPSB capacity metrics from backend
  const totalCapacity = lots.reduce((acc, l) => acc + (Number(l.totalSlots) || 0), 0);
  const totalAvailable = lots.reduce(
    (acc, l) =>
      acc +
      (l.availableSlots !== undefined
        ? Number(l.availableSlots)
        : Math.max(0, (Number(l.totalSlots) || 0) - (Number(l.occupiedSlots) || 0))),
    0
  );

  // TEAM MEMBERS LIST
  const teamMembers = [
    {
      id: 1,
      name: 'Robert Kenneth Valenzuela',
      role: 'Frontend Developer & Team Leader',
      badge: 'Team Lead',
      image: '/1.jpg',
      wackyImage: '/1w.png',
      bio: 'Leading the team in developing responsive and user-friendly interfaces while coordinating tasks, supporting team members, and helping ensure the successful completion of the project.',
      socials: {
        github: 'https://github.com',
        linkedin: 'https://www.linkedin.com/in/rkvalenzuela',
        email: 'https://mail.google.com/mail/?view=cm&fs=1&to=mauroken99@gmail.com',
        facebook: 'https://www.facebook.com/serrr.berto/'
      }
    },
    {
      id: 2,
      name: 'Karl Ryan Ricafort',
      role: 'Full-Stack Developer',
      badge: 'Full-Stack Developer',
      image: '/2.jpg',
      wackyImage: '/2w.png',
      bio: 'Developed both frontend and backend features, working across the application to build responsive user interfaces, implement backend functionality, and integrate database systems while collaborating with the team.',
      socials: {
        github: 'https://github.com/krlryn13',
        linkedin: 'https://www.linkedin.com/in/karl-ryan-ricafort-366206379/',
        email: 'https://mail.google.com/mail/?view=cm&fs=1&to=kricafort.a12241719@umak.edu.ph',
        facebook: 'https://facebook.com'
      }
    },
    {
      id: 3,
      name: 'Gerard Angelo Acabado',
      role: 'Frontend & IoT Integration Developer',
      badge: 'Frontend & IoT',
      image: '/3.jpg',
      wackyImage: '/3w.png',
      bio: 'Focused on developing responsive interfaces and connecting the ESP32 RFID parking gate and ultrasonic sensor diorama with the web application.',
      socials: {
        github: 'https://github.com/GerardAcabado',
        linkedin: 'https://www.linkedin.com/in/gerard-angelo-acabado/',
        email: 'https://mail.google.com/mail/?view=cm&fs=1&to=ggacabado.a12345422@umak.edu.ph',
        facebook: 'https://www.facebook.com/gerardangelo.acabado'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-amber-500 selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow">
        {/* HERO SECTION WITH FULL-BLEED UMAK CAMPUS PHOTO */}
        <section
          id="home"
          className="relative py-14 sm:py-20 md:py-24 lg:py-28 2xl:py-32 bg-[url('/umak.jpg')] bg-cover bg-center bg-no-repeat border-b border-slate-200 overflow-hidden scroll-mt-[var(--navbar-h,108px)]"
        >
          {/* Crisp light campus backdrop veil for reliable text contrast across every viewport */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-slate-100/85 backdrop-blur-[1px] pointer-events-none"></div>

          <div className="max-w-5xl 2xl:max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="hero-badge inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/95 border border-slate-300/90 shadow-xs mb-5 sm:mb-6 max-w-full">
              <i className="fa-solid fa-graduation-cap text-umak-orange text-xs sm:text-sm shrink-0"></i>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-800 truncate">
                University of Makati &bull; HPSB &amp; OHSO
              </span>
            </div>

            <h1 className="hero-headline font-display text-[1.95rem] sm:text-5xl md:text-6xl lg:text-[64px] 2xl:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-4 sm:mb-6">
              Smart Parking <br className="hidden xs:inline sm:inline" />
              <span className="text-umak-navy">Monitoring </span>
              <span className="text-umak-orange">System</span>
            </h1>

            <p className="hero-sub text-sm sm:text-lg lg:text-xl text-slate-700 max-w-2xl mx-auto font-medium leading-relaxed mb-7 sm:mb-9 px-1">
              Check live HPSB Building slot availability (Levels 1 to 4), apply and pay for your annual vehicle sticker online, or request a campus guest parking pass before driving in.
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
              {currentUser ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white bg-umak-navy hover:bg-umak-navydark rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer group min-h-[48px] sm:min-h-[52px]"
                >
                  <i className="fa-solid fa-gauge text-umak-orange group-hover:scale-110 transition-transform"></i>
                  <span>Go to My Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white bg-umak-orange hover:bg-umak-orangelight rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer group min-h-[48px] sm:min-h-[52px]"
                >
                  <i className="fa-solid fa-right-to-bracket text-white group-hover:translate-x-1 transition-transform"></i>
                  <span>Get Started / Sign In</span>
                </button>
              )}

              <button
                onClick={() => setIsGuestModalOpen(true)}
                className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-emerald-900 bg-emerald-100/95 hover:bg-emerald-200 border border-emerald-300 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer min-h-[48px] sm:min-h-[52px]"
              >
                <i className="fa-solid fa-calendar-check text-emerald-700"></i>
                <span>Guest / Event Parking Pass</span>
              </button>

              <a
                href="#sticker-guide"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('sticker-guide');
                }}
                className="w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-slate-800 hover:text-umak-navy bg-white/95 hover:bg-white border border-slate-300 hover:border-slate-400 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 min-h-[48px] sm:min-h-[52px]"
              >
                <i className="fa-solid fa-id-card text-umak-orange"></i>
                <span>Vehicle Sticker Guide (₱200)</span>
              </a>
            </div>

            {/* Live Campus & System Highlights Strip (real live counts + real OHSO figures) */}
            <div
              ref={statsRef}
              className="pt-8 sm:pt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 border-t border-slate-300/80 mt-9 sm:mt-12 max-w-3xl mx-auto items-stretch"
            >
              <div
                className={`anim-pop anim-delay-0 text-center p-4 sm:p-5 bg-white/95 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center h-full${statsInView ? ' in-view' : ''}`}
              >
                <div className="text-xl sm:text-2xl font-bold font-display text-slate-900 flex items-center justify-center gap-2 mb-1">
                  <i className="fa-solid fa-square-parking text-emerald-600 text-lg"></i>
                  <span>
                    {!parkingLoading && lots.length > 0 ? `${totalAvailable}/${totalCapacity} Open` : 'HPSB Building'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Live HPSB Slots (Levels 1–4)</p>
              </div>

              <div
                className={`anim-pop anim-delay-200 text-center p-4 sm:p-5 bg-white/95 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center h-full${statsInView ? ' in-view' : ''}`}
              >
                <div className="text-xl sm:text-2xl font-bold font-display text-slate-900 flex items-center justify-center gap-2 mb-1">
                  <i className="fa-solid fa-id-card text-umak-orange text-lg"></i>
                  <span>₱200 / Year</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Online OHSO Sticker Pass</p>
              </div>

              <div
                className={`anim-pop anim-delay-400 text-center p-4 sm:p-5 bg-white/95 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center h-full${statsInView ? ' in-view' : ''}`}
              >
                <div className="text-xl sm:text-2xl font-bold font-display text-slate-900 flex items-center justify-center gap-2 mb-1">
                  <i className="fa-solid fa-shield-halved text-umak-navy text-lg"></i>
                  <span>@umak.edu.ph</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Verified Campus Access</p>
              </div>
            </div>
          </div>
        </section>

        {/* UMAK VEHICLE STICKER GUIDELINES & ONLINE PAYMENT SECTION */}
        <section
          id="sticker-guide"
          className="py-14 sm:py-20 bg-gradient-to-b from-umak-navy to-slate-900 text-white relative overflow-hidden scroll-mt-[var(--navbar-h,108px)]"
        >
          <div ref={stickerRef} className="max-w-7xl 2xl:max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
            <div className={`anim-fade-up text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3${stickerInView ? ' in-view' : ''}`}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                <i className="fa-solid fa-id-card"></i> Official OHSO Guidelines
              </div>
              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-white">
                UMak Vehicle Sticker System
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Skip manual paper queues. Submit your requirements online, get OHSO verification, pay the <strong className="text-white">₱200.00 sticker fee</strong> via GCash, Maya, or Card, and pick up your sticker on your scheduled date.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              {/* Left Column: Requirements List */}
              <div
                className={`anim-slide-left anim-delay-200 lg:col-span-6 bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/15 space-y-6 flex flex-col justify-between h-full${stickerInView ? ' in-view' : ''}`}
              >
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-amber-400 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-list-check"></i> Sticker Application Requirements
                  </h3>

                  <ul className="space-y-3.5 text-sm text-slate-200">
                    <li className="flex items-start gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-400 mt-1 shrink-0"></i>
                      <span><strong>Vehicle Sticker Form:</strong> Online submission via iPark UMAK Portal.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-400 mt-1 shrink-0"></i>
                      <span><strong>Vehicle Certificate (CR / OR):</strong> Latest LTO Official Receipt &amp; Registration (or Deed of Sale if applicable).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-400 mt-1 shrink-0"></i>
                      <span><strong>Valid Driver's License:</strong> Active LTO driver's license (JPG, PNG, or PDF under 5MB).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-400 mt-1 shrink-0"></i>
                      <span><strong>Student / Faculty ID:</strong> Official UMak ID as proof of active enrollment or employment.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-400 mt-1 shrink-0"></i>
                      <span><strong>Fee &amp; Validity:</strong> <strong>₱200.00</strong> per vehicle (4-wheels, motorcycles, e-bikes), valid for 1 year.</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTutorialTarget('ohso-office');
                    setIsTutorialOpen(true);
                  }}
                  className="w-full p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 hover:border-amber-400/60 text-xs text-slate-200 flex items-center justify-between gap-3 transition-all cursor-pointer group text-left shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 text-base shadow-inner group-hover:scale-105 transition-transform">
                      <i className="fa-solid fa-location-dot"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-amber-300 text-xs">OHSO Office Location</span>
                        <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider group-hover:bg-amber-300 whitespace-nowrap">
                          View Campus Map &rarr;
                        </span>
                      </div>
                      <span className="text-slate-300 text-xs block mt-0.5">
                        Admin Building - Ground Floor, Room 104
                      </span>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-amber-400/70 group-hover:text-amber-300 group-hover:translate-x-1 transition-all shrink-0"></i>
                </button>
              </div>

              {/* Right Column: Step-by-Step Online Process (accurate 2-phase workflow) */}
              <div
                className={`anim-slide-right anim-delay-300 lg:col-span-6 bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/15 space-y-6 flex flex-col justify-between h-full${stickerInView ? ' in-view' : ''}`}
              >
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-amber-400 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-route"></i> Online Step-by-Step Process
                  </h3>

                  <div className="space-y-3.5 sm:space-y-4">
                    <div className="flex gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 items-start sm:items-center">
                      <span className="w-9 h-9 rounded-xl bg-umak-orange text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm">Submit Form &amp; Vehicle Documents</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                          Enter your student ID, vehicle plate, and LTO numbers, then upload your ID, OR/CR, and license.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 items-start sm:items-center">
                      <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm">OHSO Approval &amp; Online Payment (₱200)</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                          Once OHSO verifies your files, pay ₱200 via GCash, Maya, or Card and upload payment proof for verification.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 items-start sm:items-center">
                      <span className="w-9 h-9 rounded-xl bg-blue-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm">Receive QR Pass &amp; Claim Sticker</h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                          Present your official E-Receipt and QR code at Admin Building Ground Floor, Room 104 on your pickup date.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(currentUser ? '/dashboard' : '/login')}
                  className="w-full py-3.5 px-4 bg-umak-orange hover:bg-umak-orangelight text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>{currentUser ? 'Apply for Sticker in Dashboard' : 'Sign In to Apply for Sticker'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE HIGHLIGHTS SECTION */}
        <section
          id="features"
          className="py-14 sm:py-20 max-w-7xl 2xl:max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 scroll-mt-[var(--navbar-h,108px)]"
        >
          <div ref={featuresRef} className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className={`anim-fade-in inline-flex items-center gap-2 text-xs font-extrabold text-umak-orange uppercase tracking-widest mb-2${featuresInView ? ' in-view' : ''}`}>
              <i className="fa-solid fa-layer-group"></i> Core Features
            </div>
            <h2 className={`anim-fade-up anim-delay-100 text-2xl sm:text-4xl font-display font-extrabold text-slate-900${featuresInView ? ' in-view' : ''}`}>
              Built Specifically for UMak Herons
            </h2>
            <p className={`anim-fade-up anim-delay-200 text-slate-600 text-sm sm:text-base mt-2 font-medium${featuresInView ? ' in-view' : ''}`}>
              Live parking floor tracking, automated gate monitoring, and online sticker services in one portal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            <div
              className={`anim-fade-up anim-delay-0 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full${featuresInView ? ' in-view' : ''}`}
            >
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-50 text-umak-orange flex items-center justify-center text-xl sm:text-2xl mb-5 border border-orange-200 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-satellite-dish"></i>
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 mb-2">
                  Live Floor &amp; Gate Detection
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Check available and occupied slots across HPSB Levels 1 to 4, synced with our ESP32 RFID gates and ultrasonic sensors.
                </p>
              </div>
            </div>

            <div
              className={`anim-fade-up anim-delay-200 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full${featuresInView ? ' in-view' : ''}`}
            >
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-umak-navy flex items-center justify-center text-xl sm:text-2xl mb-5 border border-blue-200 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-envelope-circle-check"></i>
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 mb-2">
                  Official Email Verification
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Strict domain verification enforcing <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">@umak.edu.ph</code> accounts with 6-digit email OTP codes and Google Sign-In.
                </p>
              </div>
            </div>

            <div
              className={`anim-fade-up anim-delay-400 sm:col-span-2 lg:col-span-1 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full${featuresInView ? ' in-view' : ''}`}
            >
              <div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl sm:text-2xl mb-5 border border-emerald-200 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-table-cells text-emerald-600"></i>
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 mb-2">
                  Layout Grid Inspection
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Interactive parking floor grid showing slot numbers (L1-01 to L4-15), live occupancy, and campus directions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT & SYSTEM OBJECTIVES SECTION */}
        <section
          id="about"
          className="py-14 sm:py-20 bg-slate-100/80 border-y border-slate-200/80 scroll-mt-[var(--navbar-h,108px)]"
        >
          <div ref={aboutRef} className="max-w-7xl 2xl:max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-stretch">
              {/* Left: About Text */}
              <div className={`anim-slide-left lg:col-span-6 space-y-6 flex flex-col justify-between${aboutInView ? ' in-view' : ''}`}>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-umak-orange uppercase tracking-widest">
                    <i className="fa-solid fa-bullseye"></i> Purpose &amp; Vision
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                    About iPark UMAK System
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Finding available parking spaces inside the HPSB Building can take time for students, faculty, and staff driving into the University of Makati.
                  </p>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    <strong className="text-slate-900">iPark UMAK</strong> brings live floor monitoring (Level 1 to Level 4), automated gate tracking, and online OHSO sticker processing together in one responsive web portal.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-umak-navy/10 text-umak-navy flex items-center justify-center shrink-0 text-lg border border-umak-navy/20">
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Built for University of Makati</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      Designed around campus parking policies, student and faculty access, guest passes, and OHSO verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Key Objectives List */}
              <div className={`anim-slide-right anim-delay-150 lg:col-span-6${aboutInView ? ' in-view' : ''}`}>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-md h-full flex flex-col justify-between">
                  <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 mb-5 sm:mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-list-check text-umak-orange"></i> Core Objectives
                  </h3>

                  <div className="space-y-3.5 sm:space-y-4 flex-grow flex flex-col justify-around">
                    <div className="flex items-start sm:items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-sm font-bold">
                        <i className="fa-solid fa-satellite-dish"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Real-Time Monitoring</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Track available and occupied spaces across HPSB floors via live sensors and gate counts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start sm:items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-umak-orange flex items-center justify-center shrink-0 text-sm font-bold">
                        <i className="fa-solid fa-globe"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Web-Based Accessibility</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          View parking status, apply for vehicle stickers, and scan QR passes on mobile or desktop.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start sm:items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-sm font-bold">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Time &amp; Congestion Reduction</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Cut down unnecessary circling inside campus parking levels and manual OHSO queues.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TEAM SECTION */}
        <section
          id="team"
          className="py-14 sm:py-20 max-w-7xl 2xl:max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 scroll-mt-[var(--navbar-h,108px)]"
        >
          <div ref={teamRef} className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className={`anim-fade-in inline-flex items-center gap-2 text-xs font-extrabold text-umak-orange uppercase tracking-widest mb-2${teamInView ? ' in-view' : ''}`}>
              <i className="fa-solid fa-users-gear"></i> Development Team
            </div>
            <h2 className={`anim-fade-up anim-delay-100 text-2xl sm:text-4xl font-display font-extrabold text-slate-900${teamInView ? ' in-view' : ''}`}>
              Meet Our Team
            </h2>
            <p className={`anim-fade-up anim-delay-200 text-slate-600 text-sm sm:text-base mt-2 font-medium${teamInView ? ' in-view' : ''}`}>
              CCIS students behind the University of Makati Smart Campus Parking System.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {teamMembers.map((member, idx) => (
              <div
                key={member.id}
                className={`anim-scale-up bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full text-center group anim-delay-${idx * 200}${idx === 2 ? ' sm:col-span-2 lg:col-span-1 sm:max-w-md sm:mx-auto lg:max-w-none w-full' : ''}${teamInView ? ' in-view' : ''}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div>
                  {/* Photo / Avatar Image Container — Hover Swap Effect */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-5 sm:mb-6">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-100 flex items-center justify-center shadow-lg border-4 border-white ring-2 ring-slate-200/80 overflow-hidden relative">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 ease-in-out opacity-100 group-hover:opacity-0 group-hover:scale-110"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0A1F5C&color=F5821F&bold=true&size=128`;
                        }}
                      />
                      <img
                        src={member.wackyImage}
                        alt={`${member.name} — fun mode`}
                        className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 ease-in-out opacity-0 scale-110 group-hover:opacity-100 group-hover:scale-100"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = member.image;
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-umak-orange text-white flex items-center justify-center text-xs shadow-md border-2 border-white">
                      <i className="fa-solid fa-user-check"></i>
                    </span>
                  </div>

                  {/* Name & Role */}
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-umak-navy/5 text-umak-navy border border-umak-navy/15 inline-block mb-2">
                    {member.badge}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 group-hover:text-umak-orange transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1 mb-4">
                    {member.role}
                  </p>

                  <div className="min-h-0 sm:min-h-[85px] flex items-center justify-center">
                    <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed font-normal">
                      {member.bio}
                    </p>
                  </div>
                </div>

                {/* Interactive Social Media Links */}
                <div className="flex items-center justify-center gap-3 pt-5 mt-5 border-t border-slate-100 text-slate-500">
                  {member.socials.github && (
                    <a
                      href={member.socials.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-umak-navy hover:text-white flex items-center justify-center text-sm transition-all shadow-2xs cursor-pointer"
                      title="GitHub Profile"
                      aria-label={`${member.name} GitHub`}
                    >
                      <i className="fa-brands fa-github"></i>
                    </a>
                  )}

                  {member.socials.linkedin && (
                    <a
                      href={member.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#0A66C2] hover:text-white flex items-center justify-center text-sm transition-all shadow-2xs cursor-pointer"
                      title="LinkedIn Profile"
                      aria-label={`${member.name} LinkedIn`}
                    >
                      <i className="fa-brands fa-linkedin-in"></i>
                    </a>
                  )}

                  {member.socials.facebook && (
                    <a
                      href={member.socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#1877F2] hover:text-white flex items-center justify-center text-sm transition-all shadow-2xs cursor-pointer"
                      title="Facebook Profile"
                      aria-label={`${member.name} Facebook`}
                    >
                      <i className="fa-brands fa-facebook-f"></i>
                    </a>
                  )}

                  {member.socials.email && (
                    <a
                      href={member.socials.email}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-umak-orange hover:text-white flex items-center justify-center text-sm transition-all shadow-2xs cursor-pointer"
                      title="Send Email / Compose Gmail"
                      aria-label={`Email ${member.name}`}
                    >
                      <i className="fa-solid fa-envelope"></i>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="py-12 sm:py-16 max-w-7xl 2xl:max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-umak-navy via-slate-900 to-umak-navydark rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
                {currentUser ? 'Go Directly to Your Live Parking Dashboard' : 'Ready to Check Available Campus Parking?'}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {currentUser
                  ? 'Your account is verified. Access real-time floor monitoring and slot details.'
                  : 'Sign in with your official @umak.edu.ph email account to view live HPSB floor status and slot details.'}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {currentUser ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full sm:w-auto px-8 py-3.5 bg-umak-orange hover:bg-umak-orangelight text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <i className="fa-solid fa-gauge"></i> Open Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto px-8 py-3.5 bg-umak-orange hover:bg-umak-orangelight text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <i className="fa-solid fa-right-to-bracket"></i> Sign In to Portal
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <GuestReservationModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        initialEmail={currentUser?.email || ''}
      />

      <LocationTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        locationTarget={tutorialTarget}
      />
    </div>
  );
};
