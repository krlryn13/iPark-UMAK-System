import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

export default function ForgotPasswordModal({ isOpen, onClose, onSwitchToLogin }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Step 1: Submit Email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@umak.edu.ph')) {
      setError('Password reset is restricted to official @umak.edu.ph email accounts.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request reset OTP.');
      }

      setMessage(data.message);
      setStep(2);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        throw new Error(data.error || 'Invalid reset code.');
      }

      setMessage(data.message);
      setStep(3);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isPasswordValid) {
      setError('Please ensure your new password meets all security rules below.');
      return;
    }

    if (!isMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword
        })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setMessage(data.message);
      setStep(4);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-slate-800 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-umak-navy via-umak-navydark to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
              <i className="fa-solid fa-key text-base"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base font-display">Account Recovery</h3>
              <p className="text-[11px] text-slate-300">Reset Your Heron Password</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-700">
              <i className="fa-solid fa-circle-exclamation text-red-500 text-sm flex-shrink-0 mt-0.5"></i>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {message && step !== 4 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-800">
              <i className="fa-solid fa-circle-check text-emerald-600 text-sm flex-shrink-0 mt-0.5"></i>
              <span className="font-medium">{message}</span>
            </div>
          )}

          {/* STEP 1: Email Input & Registration Check */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered official <strong>@umak.edu.ph</strong> email address. We will verify your account in the system and send a 6-digit reset code to your inbox.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UMak Email Address</label>
                <div className="relative">
                  <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="k12345678@umak.edu.ph"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Verifying Account in Database...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset OTP Code</span>
                    <i className="fa-solid fa-paper-plane"></i>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter 6-Digit OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900">
                A 6-digit password reset code was sent to <strong>{email}</strong>. Please check your inbox.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Reset OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-center text-xl font-bold font-mono tracking-widest text-umak-navy focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <i className="fa-solid fa-check"></i>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2 text-sm text-slate-900 focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                />
              </div>

              {/* Real-time Password Rules Feedback */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] font-medium">
                <div className={hasMinLength ? 'text-emerald-600' : 'text-slate-400'}>
                  <i className={`fa-solid ${hasMinLength ? 'fa-check' : 'fa-circle-dot'} text-[10px] mr-1.5`}></i> At least 8 characters
                </div>
                <div className={hasUpper ? 'text-emerald-600' : 'text-slate-400'}>
                  <i className={`fa-solid ${hasUpper ? 'fa-check' : 'fa-circle-dot'} text-[10px] mr-1.5`}></i> At least 1 uppercase letter (A-Z)
                </div>
                <div className={hasLower ? 'text-emerald-600' : 'text-slate-400'}>
                  <i className={`fa-solid ${hasLower ? 'fa-check' : 'fa-circle-dot'} text-[10px] mr-1.5`}></i> At least 1 lowercase letter (a-z)
                </div>
                <div className={hasNumber ? 'text-emerald-600' : 'text-slate-400'}>
                  <i className={`fa-solid ${hasNumber ? 'fa-check' : 'fa-circle-dot'} text-[10px] mr-1.5`}></i> At least 1 number (0-9)
                </div>
                <div className={hasSpecial ? 'text-emerald-600' : 'text-slate-400'}>
                  <i className={`fa-solid ${hasSpecial ? 'fa-check' : 'fa-circle-dot'} text-[10px] mr-1.5`}></i> At least 1 special character (!@#$%^&*)
                </div>
                {confirmPassword.length > 0 && (
                  <div className={isMatch ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                    <i className={`fa-solid ${isMatch ? 'fa-check' : 'fa-xmark'} text-[10px] mr-1.5`}></i>
                    {isMatch ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid || !isMatch}
                className={`w-full py-3 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  isPasswordValid && isMatch
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Saving New Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password & Complete</span>
                    <i className="fa-solid fa-shield-check"></i>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success State */}
          {step === 4 && (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-2xl">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">Password Reset Successful!</h4>
                <p className="text-xs text-slate-600 mt-1">Your password has been securely updated. You can now log in with your new credentials.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSwitchToLogin) onSwitchToLogin();
                }}
                className="w-full py-3 bg-umak-navy hover:bg-umak-navydark text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Proceed to Sign In
              </button>
            </div>
          )}

        </div>

        {/* Footer Link */}
        {step !== 4 && (
          <div className="bg-slate-50 border-t border-slate-200 p-4 text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onSwitchToLogin) onSwitchToLogin();
              }}
              className="text-xs font-bold text-umak-navy hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
