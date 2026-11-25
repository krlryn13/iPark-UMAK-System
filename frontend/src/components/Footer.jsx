import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Footer = () => {
  const { currentUser } = useAuth();

  return (
    <footer id="contact" className="bg-slate-900 border-t border-slate-800 text-slate-300 pt-12 sm:pt-16 pb-10 sm:pb-12">
      <div className="max-w-7xl 2xl:max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 sm:pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-2xl text-white">iPark</span>
              <span className="px-2 py-0.5 text-xs font-extrabold bg-umak-orange text-white rounded-md">UMAK</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Smart Parking Monitoring System — University of Makati HPSB Building. Campus parking visibility, vehicle sticker applications, and visitor passes for UMak Herons.
            </p>
            <div className="flex items-center gap-2.5 text-slate-400 text-xs sm:text-sm pt-1">
              <i className="fa-solid fa-shield-halved text-umak-orange"></i>
              <span>Office of Human Safety and Operations (OHSO)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {currentUser ? (
                <>
                  <li><Link to="/dashboard" className="hover:text-umak-orange transition-colors">Live Operations Dashboard</Link></li>
                  <li><a href="/dashboard#monitor" className="hover:text-umak-orange transition-colors">HPSB Level Monitor</a></li>
                  <li><Link to="/dashboard" className="hover:text-umak-orange transition-colors">Heron Account Portal</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/" className="hover:text-umak-orange transition-colors">Home Page</Link></li>
                  <li><a href="/#sticker-guide" className="hover:text-umak-orange transition-colors">Sticker Guide</a></li>
                  <li><a href="/#features" className="hover:text-umak-orange transition-colors">Core Features</a></li>
                  <li><a href="/#about" className="hover:text-umak-orange transition-colors">About &amp; Objectives</a></li>
                  <li><Link to="/login" className="hover:text-umak-orange transition-colors">Portal Sign In</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Contact / Campus Info */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Campus Details</h4>
            <div className="space-y-2.5 text-sm text-slate-400">
              <p className="flex items-start gap-2">
                <i className="fa-solid fa-building-columns text-umak-orange mt-1 shrink-0"></i>
                <span>University of Makati (HPSB Building)</span>
              </p>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=14.56345,121.05612"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-amber-400 transition-colors group cursor-pointer"
                title="Get live driving/walking directions in Google Maps"
              >
                <i className="fa-solid fa-location-dot text-amber-500 mt-1 shrink-0 group-hover:scale-110 transition-transform"></i>
                <span>J.P. Rizal Ext, West Rembo, Taguig City</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70 mt-1 shrink-0"></i>
              </a>
              <p className="flex items-center gap-2">
                <i className="fa-solid fa-envelope text-slate-500 shrink-0"></i>
                <span className="break-all">support@ipark.umak.edu.ph</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 text-center sm:text-left">
          <p>&copy; 2026 iPark UMAK. All rights reserved. University of Makati.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <span>College of Computing and Information Sciences</span>
            <span>OHSO Campus Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
