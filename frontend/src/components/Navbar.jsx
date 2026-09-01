import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isDashboard = location.pathname === '/dashboard';
  const isAdminPage = location.pathname === '/admin';
  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  // Helper: get actual navbar pixel height at runtime
  const getNavbarHeight = () => {
    const nav = document.getElementById('main-navbar');
    return nav ? nav.offsetHeight : 116;
  };

  // Set CSS variable for navbar height
  React.useEffect(() => {
    const updateNavbarHeight = () => {
      const nav = document.getElementById('main-navbar');
      if (nav) {
        document.documentElement.style.setProperty('--navbar-h', `${nav.offsetHeight}px`);
      }
    };
    
    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight, { passive: true });
    return () => window.removeEventListener('resize', updateNavbarHeight);
  }, []);



  // ScrollSpy state for active section on landing page
  const [activeSection, setActiveSection] = React.useState('home');
  const isManualScrollingRef = React.useRef(false);
  const scrollTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    if (!isHome) return;

    const sections = ['home', 'sticker-guide', 'features', 'about', 'team'];

    const updateActiveSection = () => {
      if (isManualScrollingRef.current) return;

      const navH = getNavbarHeight();

      if (window.scrollY < navH + 20) {
        setActiveSection('home');
        return;
      }

      // Check which section is currently visible right below the navbar
      const checkPoint = window.scrollY + navH + 40;
      let active = 'home';

      for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          const sectionTop = rect.top + window.scrollY;
          if (checkPoint >= sectionTop) {
            active = sections[i];
          }
        }
      }

      setActiveSection(active);
    };

    let rAFId = null;
    const handleScroll = () => {
      if (rAFId) cancelAnimationFrame(rAFId);
      rAFId = requestAnimationFrame(updateActiveSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    updateActiveSection();

    return () => {
      if (rAFId) cancelAnimationFrame(rAFId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isHome]);

  const navItems = [
    { id: 'home', label: 'Home', icon: 'fa-house' },
    { id: 'sticker-guide', label: 'Sticker Guide (₱200)', icon: 'fa-id-card' },
    { id: 'features', label: 'Features', icon: 'fa-layer-group' },
    { id: 'about', label: 'About & Objectives', icon: 'fa-circle-info' },
    { id: 'team', label: 'Our Team', icon: 'fa-users-gear' },
  ];

  const handleSectionClick = (sectionId, e) => {
    setMobileMenuOpen(false);
    if (!isHome) {
      navigate(`/#${sectionId}`);
      return;
    }
    if (e) e.preventDefault();

    isManualScrollingRef.current = true;
    setActiveSection(sectionId);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 850);

    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      const navH = getNavbarHeight();
      const rect = el.getBoundingClientRect();
      const targetY = rect.top + window.scrollY - navH;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }
  };

  const handleNavClick = (targetPath, e) => {
    setMobileMenuOpen(false);
    if (location.pathname === targetPath || targetPath === '/') {
      if (location.pathname === '/' && targetPath === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveSection('home');
      }
    }
  };

  return (
    <div id="main-navbar" className="sticky top-0 z-50 w-full shadow-sm">
      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-umak-navydark text-xs py-2.5 px-4 text-slate-200 flex justify-between items-center shadow-inner">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Campus Feed
            </span>
            <span className="hidden sm:inline text-slate-300 font-medium">University of Makati Campus Parking Operations</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
              <i className="fa-solid fa-building-columns text-umak-orange"></i> UMak Main Campus
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-400">
              <i className="fa-solid fa-clock text-slate-400"></i> Updated Real-time
            </span>
          </div>
        </div>
      </div>

      {/* FLOATING LIGHT GLASS NAVBAR */}
      <header className="backdrop-blur-xl bg-white/95 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* BRAND LOGO TEXT */}
          <Link
            to={currentUser ? "/dashboard" : "/"}
            onClick={(e) => handleNavClick(currentUser ? "/dashboard" : "/", e)}
            className="flex items-center gap-3 group"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-2xl tracking-tight text-umak-navy">iPark</span>
                <span className="px-2 py-0.5 text-xs font-extrabold bg-umak-orange text-white rounded-md shadow-sm">UMAK</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">Smart Campus Parking</p>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-600">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={(e) => handleNavClick("/dashboard", e)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${isDashboard ? 'bg-umak-navy text-white font-extrabold shadow-sm' : 'hover:text-umak-navy hover:bg-slate-50'}`}
                >
                  <i className="fa-solid fa-gauge text-xs text-umak-orange"></i> Live Operations Dashboard
                </Link>
                
                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={(e) => handleNavClick("/admin", e)}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${isAdminPage ? 'bg-amber-500 text-white font-extrabold shadow-sm' : 'hover:text-amber-600 hover:bg-slate-50'}`}
                  >
                    <i className="fa-solid fa-shield-halved text-xs text-white"></i> OHSO Admin Portal
                  </Link>
                )}
              </>
            ) : (
              <>
                {navItems.map((item) => {
                  const isActive = isHome && activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`/#${item.id}`}
                      onClick={(e) => handleSectionClick(item.id, e)}
                      className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer outline-none focus:outline-none focus:ring-0 ${
                        isActive
                          ? 'bg-umak-navy text-white font-extrabold shadow-sm'
                          : 'text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <i className={`fa-solid ${item.icon} text-xs ${isActive ? 'text-umak-orange' : 'text-umak-orange opacity-70'}`}></i>
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </>
            )}
          </nav>

          {/* LOGIN / USER ACCOUNT CTA + MOBILE HAMBURGER TOGGLE */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-slate-100 p-1 sm:p-1.5 sm:pl-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-umak-navy text-white font-bold flex items-center justify-center text-xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'H'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono capitalize">{currentUser.role || 'Heron'}</p>
                  </div>
                </div>
                <button
                  onClick={() => { logoutUser(); navigate('/'); }}
                  title="Sign Out"
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className={`relative inline-flex items-center justify-center px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition-all duration-200 rounded-xl shadow-md cursor-pointer min-h-[40px] ${
                  isLogin
                    ? 'bg-umak-orange shadow-orange-500/25'
                    : 'bg-gradient-to-r from-umak-navy to-umak-navydark hover:from-umak-orange hover:to-amber-600'
                }`}
              >
                <i className="fa-solid fa-right-to-bracket mr-1.5 sm:mr-2"></i>
                <span className="hidden sm:inline">Portal </span>Login
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="md:hidden w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-base hover:bg-slate-200 transition-colors min-h-[40px]"
            >
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN NAVIGATION OVERLAY */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top duration-200">
            {currentUser ? (
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  onClick={(e) => handleNavClick("/dashboard", e)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 font-bold text-sm text-umak-navy border border-slate-100"
                >
                  <i className="fa-solid fa-gauge text-umak-orange"></i> Live Operations Dashboard
                </Link>

                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={(e) => handleNavClick("/admin", e)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 font-bold text-sm text-amber-700 border border-amber-100"
                  >
                    <i className="fa-solid fa-shield-halved text-amber-500"></i> OHSO Admin Portal
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 font-semibold text-xs text-slate-700">
                {navItems.map((item) => {
                  const isActive = isHome && activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`/#${item.id}`}
                      onClick={(e) => handleSectionClick(item.id, e)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer outline-none focus:outline-none ${
                        isActive
                          ? 'bg-umak-navy text-white font-extrabold shadow-sm'
                          : 'hover:bg-slate-50 border border-slate-100 text-slate-700 font-semibold'
                      }`}
                    >
                      <i className={`fa-solid ${item.icon} text-umak-orange`}></i>
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
};
