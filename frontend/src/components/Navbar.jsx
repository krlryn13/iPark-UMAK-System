import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { currentUser, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard';
  const isAdminPage = location.pathname === '/admin';
  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  const handleNavClick = (targetPath, e) => {
    if (location.pathname === targetPath) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
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
            <span className="flex items-center gap-1.5 font-medium">
              <i className="fa-solid fa-building-columns text-umak-orange"></i> UMak Main Campus
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-400">
              <i className="fa-solid fa-clock text-slate-400"></i> Updated Real-time
            </span>
          </div>
        </div>
      </div>

      {/* FLOATING LIGHT GLASS NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 shadow-sm">
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
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={(e) => handleNavClick("/dashboard", e)}
                  className={`transition-colors flex items-center gap-2 ${isDashboard ? 'text-umak-navy font-extrabold' : 'hover:text-umak-navy'}`}
                >
                  <i className="fa-solid fa-gauge text-xs text-umak-orange"></i> Live Operations Dashboard
                </Link>
                
                {currentUser.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={(e) => handleNavClick("/admin", e)}
                    className={`transition-colors flex items-center gap-2 ${isAdminPage ? 'text-amber-600 font-extrabold' : 'hover:text-amber-600'}`}
                  >
                    <i className="fa-solid fa-shield-halved text-xs text-amber-500"></i> OHSO Admin Portal
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={(e) => handleNavClick("/", e)}
                  className={`transition-colors flex items-center gap-2 ${isHome ? 'text-umak-navy font-extrabold' : 'hover:text-umak-navy'}`}
                >
                  <i className="fa-solid fa-house text-xs opacity-60 text-umak-orange"></i> Home
                </Link>
                <a href="/#sticker-guide" className="hover:text-umak-navy transition-colors flex items-center gap-2">
                  <i className="fa-solid fa-id-card text-xs opacity-60 text-umak-orange"></i> Sticker Guide (₱200)
                </a>
                <a href="/#features" className="hover:text-umak-navy transition-colors flex items-center gap-2">
                  <i className="fa-solid fa-layer-group text-xs opacity-60 text-umak-orange"></i> Features
                </a>
                <a href="/#about" className="hover:text-umak-navy transition-colors flex items-center gap-2">
                  <i className="fa-solid fa-circle-info text-xs opacity-60 text-umak-orange"></i> About & Objectives
                </a>
                <a href="/#team" className="hover:text-umak-navy transition-colors flex items-center gap-2">
                  <i className="fa-solid fa-users-gear text-xs opacity-60 text-umak-orange"></i> Our Team
                </a>
              </>
            )}
          </nav>

          {/* LOGIN / USER ACCOUNT CTA */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-100 p-1.5 pl-3 rounded-xl border border-slate-200">
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
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className={`relative inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 rounded-xl shadow-md cursor-pointer ${
                  isLogin
                    ? 'bg-umak-orange shadow-orange-500/25'
                    : 'bg-gradient-to-r from-umak-navy to-umak-navydark hover:from-umak-orange hover:to-amber-600'
                }`}
              >
                <i className="fa-solid fa-right-to-bracket mr-2"></i>
                Portal Login
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
