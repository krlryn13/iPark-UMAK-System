import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  // If user is already logged in, automatically redirect to Dashboard
  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  // TEAM MEMBERS LIST
  const teamMembers = [
    {
      id: 1,
      name: 'Robert Kenneth Valenzuela',
      role: 'Frontend Developer & Team Leader',
      badge: 'Team Lead',
      image: '/1.jpg',
      bio: 'Leading the team in developing responsive and user-friendly interfaces while coordinating tasks, supporting team members, and helping ensure the successful completion of the project.',
      socials: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        email: 'https://mail.google.com/mail/?view=cm&fs=1&to=robert.valenzuela@umak.edu.ph',
        facebook: 'https://facebook.com'
      }
    },
    {
      id: 2,
      name: 'Karl Ryan Ricafort',
      role: 'Full-Stack Developer',
      badge: 'Full-Stack Developer',
      image: '/2.jpg',
      bio: 'Developed both frontend and backend features, working across the application to build responsive user interfaces, implement backend functionality, and integrate database systems while collaborating with my team throughout the development process.',
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
      role: 'Front-end Developer',
      badge: 'Frontend Developer',
      image: '/3.jpg',
      bio: 'Focused on developing responsive and user-friendly interfaces, contributing to the frontend development and collaborating with the team to bring the project’s designs and features to life.',
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
        {/* HERO SECTION */}
        <section id="home" className="relative pt-16 pb-24 md:pt-24 md:pb-32 bg-gradient-to-b from-slate-100 via-white to-slate-50 border-b border-slate-200/80 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-umak-navy/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-umak-orange/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl">
            
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-umak-navy/5 border border-umak-navy/15 shadow-sm mb-6">
              <i className="fa-solid fa-graduation-cap text-umak-orange"></i>
              <span className="text-xs font-bold uppercase tracking-wider text-umak-navy">Official UMak Heron Mobility Solution</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              Smart Parking <br />
              <span className="bg-gradient-to-r from-umak-navy via-slate-800 to-umak-orange bg-clip-text text-transparent">
                Monitoring System
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
              Empowering University of Makati students, faculty, and staff with real-time parking space detection for HPSB Building. Save time and eliminate campus traffic.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {currentUser ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-umak-navy hover:bg-umak-navydark rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group min-h-[52px]"
                >
                  <i className="fa-solid fa-gauge text-umak-orange group-hover:scale-110 transition-transform"></i>
                  <span>Go to My Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-umak-orange hover:bg-umak-orangelight rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group min-h-[52px]"
                >
                  <i className="fa-solid fa-right-to-bracket text-white group-hover:translate-x-1 transition-transform"></i>
                  <span>Get Started / Sign In</span>
                </button>
              )}

              <a
                href="#sticker-guide"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-700 hover:text-umak-navy bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 min-h-[52px]"
              >
                <i className="fa-solid fa-id-card text-umak-orange"></i>
                <span>Vehicle Sticker Guide (₱200)</span>
              </a>
            </div>

            {/* Key Highlights Pill Badges */}
            <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-200 mt-12 max-w-3xl mx-auto items-stretch">
              <div className="text-center p-5 bg-white/80 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center h-full">
                <div className="text-2xl font-bold font-display text-slate-900 flex items-center justify-center gap-2 mb-1">
                  <i className="fa-solid fa-bolt text-amber-500 text-lg"></i> Real-Time
                </div>
                <p className="text-xs text-slate-500 font-medium">Instant Live Sensor Updates</p>
              </div>

              <div className="text-center p-5 bg-white/80 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center h-full">
                <div className="text-2xl font-bold font-display text-slate-900 flex items-center justify-center gap-2 mb-1">
                  <i className="fa-solid fa-building text-umak-navy text-lg"></i> HPSB Building
                </div>
                <p className="text-xs text-slate-500 font-medium">Levels 1, 2, 3, and 4 Coverage</p>
              </div>

              <div className="text-center p-5 bg-white/80 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center h-full">
                <div className="text-2xl font-bold font-display text-slate-900 flex items-center justify-center gap-2 mb-1">
                  <i className="fa-solid fa-shield-halved text-emerald-600 text-lg"></i> Verified
                </div>
                <p className="text-xs text-slate-500 font-medium">Secure @umak.edu.ph Access</p>
              </div>
            </div>

          </div>
        </section>

        {/* UMAK VEHICLE STICKER GUIDELINES & ONLINE PAYMENT SECTION */}
        <section id="sticker-guide" className="py-20 bg-gradient-to-b from-umak-navy to-slate-900 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                <i className="fa-solid fa-id-card"></i> Official OHSO Guidelines
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                UMak Vehicle Sticker System
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Skip the physical Cash Office queue! Apply online, pay the <strong>₱200.00 sticker fee</strong> via GCash, Maya, or Card, and pick up your official sticker upon OHSO admin approval.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Column: Requirements List */}
              <div className="lg:col-span-6 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 space-y-6 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-xl font-bold font-display text-amber-400 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-list-check"></i> Sticker Application Requirements
                  </h3>
                  
                  <ul className="space-y-3.5 text-sm text-slate-200">
                    <li className="flex items-start gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-400 mt-1 flex-shrink-0"></i>
                      <span><strong>Vehicle Sticker Form:</strong> Online submission via iPark UMAK Portal.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-400 mt-1 flex-shrink-0"></i>
                      <span><strong>Vehicle Certificate (CR / OR):</strong> Latest LTO Official Receipt & Registration (or Deed of Sale if applicable).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-400 mt-1 flex-shrink-0"></i>
                      <span><strong>Valid Driver's License:</strong> Active license (LTO-LTMS account ready).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-400 mt-1 flex-shrink-0"></i>
                      <span><strong>Student ID & COR:</strong> Proof of active enrollment or employment at UMak.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <i className="fa-solid fa-circle-check text-emerald-400 mt-1 flex-shrink-0"></i>
                      <span><strong>Fee & Payment:</strong> <strong>₱200.00</strong> per vehicle (4-wheels, motorcycles, e-bikes), valid for 1 year.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-xs text-slate-300">
                  📍 <strong>OHSO Office Location:</strong> Occupational Health and Safety Office, Basement of Admin Building.
                </div>
              </div>

              {/* Right Column: Step-by-Step Online Process */}
              <div className="lg:col-span-6 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 space-y-6 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-xl font-bold font-display text-amber-400 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-route"></i> Online Step-by-Step Process
                  </h3>

                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 items-center">
                      <span className="w-9 h-9 rounded-xl bg-umak-orange text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">1</span>
                      <div>
                        <h4 className="font-bold text-white text-sm">Fill Out Application Form</h4>
                        <p className="text-xs text-slate-300 mt-0.5">Enter your student ID, vehicle details, plate number, and LTO numbers in your dashboard.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 items-center">
                      <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">2</span>
                      <div>
                        <h4 className="font-bold text-white text-sm">Instant Online Payment (₱200)</h4>
                        <p className="text-xs text-slate-300 mt-0.5">Pay via GCash, Maya, or Card and instantly generate your Official E-Receipt.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 items-center">
                      <span className="w-9 h-9 rounded-xl bg-blue-500 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">3</span>
                      <div>
                        <h4 className="font-bold text-white text-sm">OHSO Admin Verification & Pickup</h4>
                        <p className="text-xs text-slate-300 mt-0.5">Upon admin approval, present your E-Receipt at OHSO Basement to collect your physical sticker.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(currentUser ? '/dashboard' : '/login')}
                  className="w-full py-3.5 bg-umak-orange hover:bg-umak-orangelight text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>{currentUser ? 'Apply for Sticker in Dashboard' : 'Sign In to Apply for Sticker'}</span>
                </button>
              </div>

            </div>

          </div>
        </section>

        {/* FEATURE HIGHLIGHTS SECTION */}
        <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-umak-orange uppercase tracking-widest mb-2">
              <i className="fa-solid fa-star"></i> Core Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900">
              Built Specifically for UMak Herons
            </h2>
            <p className="text-slate-600 text-sm mt-2 font-medium">
              Everything you need to navigate campus parking efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-umak-orange flex items-center justify-center text-2xl mb-6 border border-orange-200 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-satellite-dish"></i>
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 mb-2">Live Floor Detection</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Check available and occupied slots per floor level (Level 1 to Level 4) in real-time before driving into campus.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-umak-navy flex items-center justify-center text-2xl mb-6 border border-blue-200 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-envelope-circle-check"></i>
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 mb-2">Official Email Verification</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Strict domain verification enforcing `@umak.edu.ph` accounts with 6-digit email OTP codes to prevent bot accounts.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-6 border border-emerald-200 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-table-cells text-emerald-600"></i>
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 mb-2">Layout Grid Inspection</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Interactive parking floor grid view simulation showing exact slot numbers (e.g. L1-01 to L4-15) and availability.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ABOUT & SYSTEM OBJECTIVES SECTION */}
        <section id="about" className="py-20 bg-slate-100/80 border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">

              {/* Left: About Text */}
              <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-umak-orange uppercase tracking-widest">
                    <i className="fa-solid fa-bullseye"></i> Purpose & Vision
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 leading-tight">
                    About iPark UMAK System
                  </h2>
                  <p className="text-slate-600 text-base leading-relaxed">
                    Finding available parking spaces inside the HPSB Building can be frustrating for students, faculty, and staff driving to the University of Makati.
                  </p>
                  <p className="text-slate-600 text-base leading-relaxed">
                    <strong className="text-slate-900">iPark UMAK</strong> solves this campus challenge by bringing real-time floor monitoring (Level 1 - Level 4) directly to your web browser or mobile phone—enabling Herons to check availability before setting foot on campus.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-umak-navy/10 text-umak-navy flex items-center justify-center flex-shrink-0 text-lg border border-umak-navy/20">
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Built for University of Makati</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Tailored specifically for campus parking rules, faculty spaces, and student access needs.</p>
                  </div>
                </div>
              </div>

              {/* Right: Key Objectives List */}
              <div className="lg:col-span-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md h-full flex flex-col justify-between">
                  <h3 className="text-xl font-bold font-display text-slate-900 mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-list-check text-umak-orange"></i> Core Objectives
                  </h3>

                  <div className="space-y-4 flex-grow flex flex-col justify-around">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        <i className="fa-solid fa-satellite-dish"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Real-Time Monitoring</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Track both available and occupied parking spaces instantaneously across HPSB floors.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-umak-orange flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        <i className="fa-solid fa-globe"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Web-Based Accessibility</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Provide continuous live status updates via an intuitive web dashboard.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Time & Congestion Reduction</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Dramatically decrease unnecessary driving around campus looking for open spots.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* TEAM SECTION */}
        <section id="team" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold text-umak-orange uppercase tracking-widest mb-2">
              <i className="fa-solid fa-users-gear"></i> Development Team
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900">
              Meet Our Team
            </h2>
            <p className="text-slate-600 text-sm mt-2 font-medium">
              The passionate developers behind the University of Makati Smart Campus Parking System.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full text-center group"
              >
                <div>
                  {/* Photo / Avatar Image Container */}
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="w-32 h-32 rounded-2xl bg-slate-100 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border-4 border-white ring-2 ring-slate-200/80 overflow-hidden">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0A1F5C&color=F5821F&bold=true&size=128`;
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
                  <h3 className="text-xl font-bold font-display text-slate-900 group-hover:text-umak-orange transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1 mb-4">
                    {member.role}
                  </p>
                  
                  {/* Fixed min-height for perfect text card alignment across all 3 members */}
                  <div className="min-h-[85px] flex items-center justify-center">
                    <p className="text-slate-600 text-xs leading-relaxed font-normal">
                      {member.bio}
                    </p>
                  </div>
                </div>

                {/* Interactive Social Media Links */}
                <div className="flex items-center justify-center gap-3 pt-6 mt-6 border-t border-slate-100 text-slate-500">
                  {member.socials.github && (
                    <a
                      href={member.socials.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-umak-navy hover:text-white flex items-center justify-center text-sm transition-all shadow-2xs cursor-pointer"
                      title="GitHub Profile"
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
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-umak-navy via-slate-900 to-umak-navydark rounded-3xl p-10 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <h2 className="text-3xl font-extrabold font-display">
                {currentUser ? 'Go Directly to Your Live Parking Dashboard' : 'Ready to Check Available Campus Parking?'}
              </h2>
              <p className="text-slate-300 text-sm">
                {currentUser
                  ? 'Your account is verified. Access real-time floor monitoring and slot details.'
                  : 'Sign in with your official @umak.edu.ph email account to view real-time HPSB floor status and slot details.'}
              </p>
              <div className="pt-2">
                {currentUser ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-3.5 bg-umak-orange hover:bg-umak-orangelight text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 min-h-[48px]"
                  >
                    <i className="fa-solid fa-gauge"></i> Open Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-3.5 bg-umak-orange hover:bg-umak-orangelight text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 min-h-[48px]"
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
    </div>
  );
};
