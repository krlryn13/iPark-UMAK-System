import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDashboard = location.pathname === '/dashboard';
  const isAdminPage = location.pathname === '/admin';
  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  const getNavbarHeight = () => {
    const nav = document.getElementById('main-navbar');
    return nav ? nav.offsetHeight : 108;
  };

  useEffect(() => {
    const updateNavbarHeight = () => {
      const nav = document.getElementById('main-navbar');
      if (nav) {
        document.documentElement.style.setProperty('--navbar-h', `${nav.offsetHeight}px`);
      }
    };

    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight, { passive: true });
    return () => window.removeEventListener('resize', updateNavbarHeight);
  }, [mobileMenuOpen]);

  const [activeSection, setActiveSection] = useState('home');
  const [isManualScrolling, setIsManualScrolling] = useState(false);

  useEffect(() => {
    if (!isManualScrolling) return;
    const timer = setTimeout(() => setIsManualScrolling(false), 850);
    return () => clearTimeout(timer);
  }, [isManualScrolling]);

  useEffect(() => {
    if (!isHome) return;

    const sections = ['home', 'sticker-guide', 'features', 'about', 'team'];

    const updateActiveSection = () => {
      if (isManualScrolling) return;

      const navH = getNavbarHeight();
      if (window.scrollY < navH + 20) {
        setActiveSection('home');
        return;
      }

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
  }, [isHome, isManualScrolling]);

  const navItems = [
    { id: 'home', label: 'Home', icon: 'fa-house' },
    { id: 'sticker-guide', label: 'Sticker Guide', icon: 'fa-id-card' },
    { id: 'features', label: 'Features', icon: 'fa-layer-group' },
    { id: 'about', label: 'About', icon: 'fa-circle-info' },
    { id: 'team', label: 'Our Team', icon: 'fa-users-gear' },
  ];

  const handleSectionClick = (sectionId, e) => {
    setMobileMenuOpen(false);
    if (!isHome) {
      navigate(`/#${sectionId}`);
      return;
    }
    if (e) e.preventDefault();

    setIsManualScrolling(true);
    setActiveSection(sectionId);

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
    if (location.pathname === '/' && targetPath === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('home');
    }
  };

  return (
    <div id="main-navbar" className="sticky top-0 z-50 w-full shadow-sm">
      {/* TOP UMAK CAMPUS INFO BAR */}
      <div className="bg-umak-navydark text-[11px] sm:text-xs py-2 px-3 sm:px-4 text-slate-200 border-b border-white/10">
        <div className="max-w-7xl 2xl:max-w-[1360px] mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/15 font-semibold text-[10px] sm:text-[11px] shrink-0">
              <i className="fa-solid fa-shield-halved text-umak-orange"></i>
              <span>OHSO &amp; HPSB</span>
            </span>
            <span className="hidden sm:inline text-slate-300 font-medium truncate">
              University of Makati Campus Parking Operations
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 shrink-0">
            <span className="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
              <i className="fa-solid fa-building-columns text-umak-orange"></i>
              <span className="truncate">UMak Main Campus</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-400">
              <i className="fa-solid fa-square-parking text-umak-orange/80"></i> Levels 1–4
            </span>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION BAR */}
      <header className="backdrop-blur-xl bg-white/95 border-b border-slate-200/80">
        <div className="max-w-7xl 2xl:max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-[72px] lg:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* BRAND LOGO */}
          <Link
            to={currentUser ? '/dashboard' : '/'}
            onClick={(e) => handleNavClick(currentUser ? '/dashboard' : '/', e)}
            className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 group"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-umak-navy">
                  iPark
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-extrabold bg-umak-orange text-white rounded-md shadow-xs">
                  UMAK
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-semibold tracking-wider uppercase truncate">
                Smart Campus Parking
              </p>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS (lg+ so tablets never wrap or collide) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs xl:text-sm font-semibold text-slate-600" aria-label="Main navigation">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={(e) => handleNavClick('/dashboard', e)}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                    isDashboard
                      ? 'bg-umak-navy text-white font-extrabold shadow-sm'
                      : 'hover:text-umak-navy hover:bg-slate-100/80'
                  }`}
                >
                  <i className={`fa-solid fa-gauge text-xs ${isDashboard ? 'text-umak-orange' : 'text-umak-orange'}`}></i>
                  <span>Live Operations Dashboard</span>
                </Link>

                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={(e) => handleNavClick('/admin', e)}
                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                      isAdminPage
                        ? 'bg-amber-500 text-white font-extrabold shadow-sm'
                        : 'hover:text-amber-600 hover:bg-slate-100/80'
                    }`}
                  >
                    <i className={`fa-solid fa-shield-halved text-xs ${isAdminPage ? 'text-white' : 'text-amber-500'}`}></i>
                    <span>OHSO Admin Portal</span>
                  </Link>
                )}
              </>
            ) : (
              navItems.map((item) => {
                const isActive = isHome && activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`/#${item.id}`}
                    onClick={(e) => handleSectionClick(item.id, e)}
                    className={`px-3 xl:px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 xl:gap-2 cursor-pointer whitespace-nowrap outline-none focus:outline-none ${
                      isActive
                        ? 'bg-umak-navy text-white font-extrabold shadow-sm'
                        : 'text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} text-xs ${isActive ? 'text-umak-orange' : 'text-umak-orange/80'}`}></i>
                    <span>{item.label}</span>
                  </a>
                );
              })
            )}
          </nav>

          {/* CTA + MOBILE/TABLET MENU TOGGLE */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-3 bg-slate-100 p-1 sm:p-1.5 sm:pl-3 rounded-xl border border-slate-200 min-w-0">
                <div className="flex items-center gap-2 text-xs min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-umak-navy text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'H'}
                  </div>
                  <div className="text-left hidden sm:block min-w-0">
                    <p className="font-bold text-slate-900 leading-tight max-w-[120px] xl:max-w-[160px] truncate">
                      {currentUser.name}
                    </p>
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
                className={`inline-flex items-center justify-center px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition-all duration-200 rounded-xl shadow-md cursor-pointer min-h-[40px] whitespace-nowrap ${
                  isLogin
                    ? 'bg-umak-orange shadow-orange-500/25'
                    : 'bg-umak-navy hover:bg-umak-orange'
                }`}
              >
                <i className="fa-solid fa-right-to-bracket mr-1.5 sm:mr-2"></i>
                <span className="hidden sm:inline">Portal </span>Login
              </button>
            )}

            {/* Mobile & Tablet Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-base hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
            >
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>

        {/* MOBILE & TABLET SLIDE-DOWN NAVIGATION */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-3 sm:px-6 py-3.5 space-y-2 shadow-xl animate-in slide-in-from-top duration-200">
            <div className="max-w-7xl mx-auto">
              {currentUser ? (
                <div className="space-y-2">
                  <Link
                    to="/dashboard"
                    onClick={(e) => handleNavClick('/dashboard', e)}
                    className={`flex items-center gap-3 p-3 rounded-xl font-bold text-sm border min-h-[44px] ${
                      isDashboard
                        ? 'bg-umak-navy text-white border-umak-navy'
                        : 'hover:bg-slate-50 text-umak-navy border-slate-100'
                    }`}
                  >
                    <i className="fa-solid fa-gauge text-umak-orange"></i> Live Operations Dashboard
                  </Link>

                  {currentUser.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={(e) => handleNavClick('/admin', e)}
                      className={`flex items-center gap-3 p-3 rounded-xl font-bold text-sm border min-h-[44px] ${
                        isAdminPage
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'hover:bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                    >
                      <i className={`fa-solid fa-shield-halved ${isAdminPage ? 'text-white' : 'text-amber-500'}`}></i> OHSO Admin Portal
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-semibold text-xs sm:text-sm text-slate-700">
                  {navItems.map((item) => {
                    const isActive = isHome && activeSection === item.id;
                    return (
                      <a
                        key={item.id}
                        href={`/#${item.id}`}
                        onClick={(e) => handleSectionClick(item.id, e)}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer min-h-[44px] ${
                          isActive
                            ? 'bg-umak-navy text-white font-extrabold shadow-sm'
                            : 'hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-semibold'
                        }`}
                      >
                        <i className={`fa-solid ${item.icon} text-umak-orange w-4 text-center`}></i>
                        <span>{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
};
