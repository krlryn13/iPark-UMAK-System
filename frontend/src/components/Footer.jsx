import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Footer = () => {
  const { currentUser } = useAuth();

  return (
    <footer id="contact" className="bg-slate-900 border-t border-slate-800 text-slate-300 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">

          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-2xl text-white">iPark</span>
              <span className="px-2 py-0.5 text-xs font-extrabold bg-umak-orange text-white rounded-md">UMAK</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm">
              Smart Parking Monitoring System — University of Makati HPSB Building. Modernizing campus traffic management and parking efficiency for all Herons.
            </p>
            <div className="flex items-center gap-3 text-slate-400 text-sm pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>System Status: <strong className="text-emerald-400 font-medium">All Sensors Online</strong></span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
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
                  <li><a href="/#features" className="hover:text-umak-orange transition-colors">Core Features</a></li>
                  <li><a href="/#about" className="hover:text-umak-orange transition-colors">System Objectives</a></li>
                  <li><Link to="/login" className="hover:text-umak-orange transition-colors">Portal Sign In</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Contact / Campus Info */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Campus Details</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <i className="fa-solid fa-building-columns text-umak-orange"></i> University of Makati (HPSB Building)
              </p>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=14.56345,121.05612"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-amber-400 transition-colors group cursor-pointer"
                title="Get live driving/walking directions in Google Maps"
              >
                <i className="fa-solid fa-location-dot text-amber-500 group-hover:scale-110 transition-transform"></i>
                <span>J.P. Rizal Ext, West Rembo, Taguig City</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70"></i>
              </a>
              <p className="flex items-center gap-2">
                <i className="fa-solid fa-envelope text-slate-500"></i> support@ipark.umak.edu.ph
              </p>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 iPark UMAK. All rights reserved. University of Makati.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Campus Security Portal</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
