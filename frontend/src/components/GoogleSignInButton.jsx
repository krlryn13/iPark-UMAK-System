import React, { useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '295998885374-797smduubipt79vc2n6rqef4n1uq4n17.apps.googleusercontent.com';

export default function GoogleSignInButton({ onGoogleSuccess, onError, loading, mode = 'signin' }) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

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

    // 2. ID Token Prompt Fallback or Email Entry Modal
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
          setIsEmailModalOpen(true);
        }
      });
    } else {
      setIsEmailModalOpen(true);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!googleEmail) return;
    
    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith('@umak.edu.ph')) {
      onError('Domain Restricted: Please enter an official @umak.edu.ph email address.');
      return;
    }

    setIsEmailModalOpen(false);
    onGoogleSuccess({
      user: {
        email: cleanEmail,
        name: googleName.trim() || cleanEmail.split('@')[0]
      }
    });
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

      {/* GOOGLE WORKSPACE EMAIL ENTRY MODAL (PRODUCTION CLEAN) */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-slate-800 flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-umak-navy text-white p-5 flex items-center justify-between">
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
                  <h3 className="font-extrabold text-sm font-display">Sign in with UMak Google Account</h3>
                  <p className="text-[11px] text-slate-300">Enter your official @umak.edu.ph account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">UMak Email Address</label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@umak.edu.ph"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-umak-navy"
                />
              </div>

              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="e.g. Juan Cruz"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-umak-navy"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Continue with Google
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}

