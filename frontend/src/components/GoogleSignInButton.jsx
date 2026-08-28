import React, { useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '295998885374-797smduubipt79vc2n6rqef4n1uq4n17.apps.googleusercontent.com';

export default function GoogleSignInButton({ onGoogleSuccess, onError, loading, mode = 'signin' }) {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  // Native Google OAuth 2.0 Real Popup Launcher
  const handleNativeGoogleSignIn = () => {
    // 1. Check if official Google OAuth SDK is loaded in browser
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          hosted_domain: 'umak.edu.ph',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              onError(`Google Sign-In Error: ${tokenResponse.error}`);
              return;
            }

            if (tokenResponse.access_token) {
              try {
                // Fetch real verified Google user profile from Google API
                const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const profile = await profileRes.json();
                
                onGoogleSuccess({
                  user: {
                    email: profile.email,
                    name: profile.name || profile.given_name || profile.email.split('@')[0]
                  }
                });
              } catch (fetchErr) {
                onError('Failed to fetch profile info from Google OAuth.');
              }
            }
          }
        });

        // Launch Official Google Login Popup Window
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('[GOOGLE OAUTH FALLBACK]', err.message);
      }
    }

    // 2. ID Token Prompt Fallback
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        hosted_domain: 'umak.edu.ph',
        callback: (response) => {
          if (response.credential) {
            onGoogleSuccess({ idToken: response.credential });
          } else {
            onError('Google Sign-In credential not received.');
          }
        }
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsDemoModalOpen(true);
        }
      });
    } else {
      setIsDemoModalOpen(true);
    }
  };

  const handleDemoAccountSelect = (email, name) => {
    setIsDemoModalOpen(false);
    onGoogleSuccess({
      user: { email, name: name || email.split('@')[0] }
    });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    handleDemoAccountSelect(customEmail.trim(), customName.trim());
  };

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleNativeGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-[0.99] min-h-[44px]"
        >
          {/* Official Multicolor Google G Icon */}
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{mode === 'signup' ? 'Sign Up using UMak Email' : 'Sign In using UMak Email'}</span>
        </button>

        <div className="relative flex items-center my-3">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or continue with credentials</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>
      </div>

      {/* GOOGLE WORKSPACE ACCOUNT SELECTOR MODAL */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-slate-800 flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm font-display">Sign in with Google</h3>
                  <p className="text-[11px] text-slate-300">Choose an account to continue to iPark UMAK</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900">
                <strong><i className="fa-solid fa-shield-halved mr-1"></i> Security Rule Enforcement Test:</strong>
                <p className="mt-0.5">Subukan ang parehong Valid UMak Google account at Invalid Personal Gmail account para ma-verify na <strong>hinaharang ng backend ang non-UMak emails</strong>!</p>
              </div>

              {/* Quick Select Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemoAccountSelect('k12345678@umak.edu.ph', 'Karl Ryan (Heron Student)')}
                  className="w-full p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-umak-navy text-white font-bold flex items-center justify-center text-xs">
                      KR
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">Karl Ryan (Heron Student)</p>
                      <p className="text-[11px] text-slate-500 font-mono">k12345678@umak.edu.ph</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <i className="fa-solid fa-check text-[9px]"></i> Valid UMak
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoAccountSelect('hacker.test@gmail.com', 'John Hacker')}
                  className="w-full p-3 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                      JH
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-red-700">John Hacker (Personal Gmail)</p>
                      <p className="text-[11px] text-slate-500 font-mono">hacker.test@gmail.com</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <i className="fa-solid fa-ban text-[9px]"></i> Non-UMak (Block)
                  </span>
                </button>
              </div>

              {/* Custom Input */}
              <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Or type any Google Email address to test:</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="user@umak.edu.ph or user@gmail.com"
                    required
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-umak-orange"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Test Sign In
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
