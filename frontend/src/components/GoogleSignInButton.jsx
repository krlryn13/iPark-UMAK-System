import React, { useEffect } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '295998885374-797smduubipt79vc2n6rqef4n1uq4n17.apps.googleusercontent.com';

export default function GoogleSignInButton({ onGoogleSuccess, onError, loading, mode = 'signin' }) {

  useEffect(() => {
    // Ensure GIS SDK script is in the DOM without duplicating
    if (!window.google?.accounts?.oauth2 && !document.querySelector('script[src*="gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const launchGooglePopup = () => {
    try {
      if (!window.google?.accounts?.oauth2) {
        onError('Google Sign-In is initializing. Please click again in a moment.');
        return;
      }

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

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      onError('Unable to open Google Sign-In popup. Please ensure popups are allowed in your browser.');
    }
  };

  const handleNativeGoogleSignIn = () => {
    if (window.google?.accounts?.oauth2) {
      launchGooglePopup();
    } else {
      setTimeout(() => {
        if (window.google?.accounts?.oauth2) {
          launchGooglePopup();
        } else {
          onError('Google Sign-In SDK is loading. Please click again in a moment.');
        }
      }, 300);
    }
  };

  return (
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
  );
}

