import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { API_BASE_URL } from '../config/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import GoogleSignInButton from '../components/GoogleSignInButton';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginUser, currentUser } = useAuth();

  // Mode: 'signin' | 'signup' | 'verify'
  const [authMode, setAuthMode] = useState('signin');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState(null); // { email, unlockRequested, requestLoading }

  // Password strength rules (computed live)
  const passwordRules = [
    { label: 'At least 8 characters', passed: formData.password.length >= 8 },
    { label: 'Contains uppercase letter (A-Z)', passed: /[A-Z]/.test(formData.password) },
    { label: 'Contains lowercase letter (a-z)', passed: /[a-z]/.test(formData.password) },
    { label: 'Contains a number (0-9)', passed: /[0-9]/.test(formData.password) },
    { label: 'Contains special character (!@#$%...)', passed: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) },
  ];
  const passedRuleCount = passwordRules.filter(r => r.passed).length;

  // Strength meter colors
  const strengthConfig = [
    { label: 'Very Weak', barColor: 'bg-red-500', textColor: 'text-red-500' },
    { label: 'Very Weak', barColor: 'bg-red-500', textColor: 'text-red-500' },
    { label: 'Weak', barColor: 'bg-orange-500', textColor: 'text-orange-500' },
    { label: 'Fair', barColor: 'bg-amber-500', textColor: 'text-amber-500' },
    { label: 'Strong', barColor: 'bg-emerald-500', textColor: 'text-emerald-500' },
    { label: 'Very Strong', barColor: 'bg-umak-navy', textColor: 'text-umak-navy' },
  ];
  const currentStrength = strengthConfig[passedRuleCount];

  // Signup form validation state
  const isEmailValid = formData.email.trim().toLowerCase().endsWith('@umak.edu.ph');
  const isNameValid = formData.name.trim().split(/\s+/).length >= 2;
  const isPasswordStrong = passedRuleCount === 5;
  const isConfirmMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const isSignupReady = isEmailValid && isNameValid && isPasswordStrong && isConfirmMatch;

  // Redirect if user is already logged in
  if (currentUser) {
    navigate('/dashboard');
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otpInput];
    next[index] = value;
    setOtpInput(next);
    setError('');
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      const prevInput = document.getElementById(`otp-digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Submit Sign In / Sign Up
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = formData.email.trim().toLowerCase();

    // Enforce @umak.edu.ph domain validation
    if (!cleanEmail.endsWith('@umak.edu.ph')) {
      setError('Domain Restricted: You must use an official @umak.edu.ph email address (e.g. k12345678@umak.edu.ph).');
      return;
    }

    if (authMode === 'signup') {
      if (!formData.name.trim() || !isNameValid) {
        setError('Please enter your complete first and last name.');
        return;
      }
      if (!isPasswordStrong) {
        setError('Password does not meet security requirements. Please check all rules below.');
        return;
      }
      if (!isConfirmMatch) {
        setError('Passwords do not match. Please check and try again.');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = authMode === 'signup'
        ? `${API_BASE_URL}/api/auth/register`
        : `${API_BASE_URL}/api/auth/login`;

      const bodyData = authMode === 'signup'
        ? { name: formData.name.trim(), email: cleanEmail, password: formData.password }
        : { email: cleanEmail, password: formData.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 423 || data.isLocked) {
          setLockoutInfo({
            email: data.email || cleanEmail,
            unlockRequested: !!data.unlockRequested,
            requestLoading: false
          });
        } else {
          setLockoutInfo(null);
        }

        if (data.requiresVerification) {
          setVerifyEmail(data.email || cleanEmail);
          setOtpInput(['', '', '', '', '', '']);
          setAuthMode('verify');
          setSuccess('A 6-digit verification code has been sent to your email. Please check your inbox.');
          setLoading(false);
          return;
        }
        setError(data.error || 'Authentication failed. Please check your inputs.');
        setLoading(false);
        return;
      }

      // Verification code sent! Switch to OTP verification mode
      if (data.requiresVerification) {
        setVerifyEmail(data.email || cleanEmail);
        setOtpInput(['', '', '', '', '', '']);
        setAuthMode('verify');
        setSuccess(data.message || 'Check your email inbox for the 6-digit verification code.');
        setLoading(false);
        return;
      }

      // Fully authenticated
      loginUser(data.user, data.token);
      setSuccess(data.message || 'Login successful! Redirecting to Dashboard...');
      setLoading(false);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err) {
      setError('Unable to connect to authentication server. Please ensure backend is running.');
      setLoading(false);
    }
  };

  // Google OAuth Login Handler (With Strict @umak.edu.ph backend check)
  const handleGoogleLogin = async (googleData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleData)
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (res.status === 423 || data.isLocked) {
          setLockoutInfo({
            email: data.email || (googleData.user?.email || ''),
            unlockRequested: !!data.unlockRequested,
            requestLoading: false
          });
        }
        setError(data.error || 'Google Sign-In failed.');
        return;
      }

      if (data.requiresVerification) {
        setVerifyEmail(data.email);
        setOtpInput(['', '', '', '', '', '']);
        setAuthMode('verify');
        setSuccess(data.message || 'A 6-digit verification code has been sent to your @umak.edu.ph email inbox.');
        return;
      }

      // Success Google Sign-In for Verified Users
      loginUser(data.user, data.token);
      setSuccess(data.message || `Welcome back, ${data.user.name}!`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);

    } catch (err) {
      setLoading(false);
      setError('Connection error: Could not reach backend for Google Sign-In verification.');
    }
  };

  // Submit OTP Verification Code
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const code = otpInput.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code sent to your email.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, code })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 423 || data.isLocked) {
          setLockoutInfo({
            email: verifyEmail,
            unlockRequested: !!data.unlockRequested,
            requestLoading: false
          });
        }
        setError(data.error || 'Invalid verification code. Please check and try again.');
        setLoading(false);
        return;
      }

      loginUser(data.user, data.token);
      setSuccess('Account verified successfully! Redirecting to Dashboard...');
      setLoading(false);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);

    } catch (err) {
      setError('Connection error. Please ensure backend is running.');
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend verification code.');
        return;
      }
      setSuccess(`A new 6-digit verification code was sent to ${verifyEmail}.`);
      setOtpInput(['', '', '', '', '', '']);
    } catch (err) {
      setError('Connection error. Could not resend verification code.');
    }
  };

  // Request Account Unlock from Admin
  const handleRequestUnlock = async () => {
    if (!lockoutInfo?.email) return;
    setLockoutInfo(prev => ({ ...prev, requestLoading: true }));
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/request-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lockoutInfo.email })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Unlock request submitted! An OHSO Admin has been notified to unlock your account.');
        setLockoutInfo(prev => ({ ...prev, unlockRequested: true, requestLoading: false }));
      } else {
        setError(data.error || 'Failed to send unlock request.');
        setLockoutInfo(prev => ({ ...prev, requestLoading: false }));
      }
    } catch (err) {
      setError('Connection error. Could not send unlock request.');
      setLockoutInfo(prev => ({ ...prev, requestLoading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      <Navbar />

      <main className="py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center my-auto">
        <div className="anim-fade-up in-view bg-white border border-slate-200 rounded-2xl max-w-md w-full p-8 shadow-xl space-y-6 text-slate-800">

          {/* Header */}
          <div className="text-center space-y-2 border-b border-slate-100 pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-umak-navy/10 text-umak-navy border border-umak-navy/20 mb-1">
              <i className="fa-solid fa-user-shield text-xl text-umak-orange"></i>
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              {authMode === 'signin'
                ? 'Sign In to iPark UMAK'
                : authMode === 'signup'
                  ? 'Create Heron Account'
                  : 'Verify Your Email'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {authMode === 'verify'
                ? `Enter the 6-digit code sent to ${verifyEmail}`
                : 'Access administrative controls and live parking slots management.'}
            </p>
          </div>

          {/* Official Domain Badge */}
          <div className="bg-umak-navy/5 border border-umak-navy/15 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-umak-navy font-semibold">
              <i className="fa-solid fa-graduation-cap text-umak-orange"></i>
              <span>Official Account Domain</span>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-umak-orange text-white font-mono font-bold text-[10px]">
              @umak.edu.ph
            </span>
          </div>

          {/* Google Sign-In Button */}
          {authMode !== 'verify' && (
            <GoogleSignInButton
              mode={authMode}
              onGoogleSuccess={handleGoogleLogin}
              onError={setError}
              loading={loading}
            />
          )}

          {/* Tabs for Sign In vs Sign Up */}
          {authMode !== 'verify' && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-white text-umak-navy shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-right-to-bracket mr-1.5"></i> Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white text-umak-navy shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-user-plus mr-1.5"></i> Create Account
              </button>
            </div>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <i className="fa-solid fa-circle-exclamation text-red-500 mt-0.5 flex-shrink-0 text-sm"></i>
                <span>{error}</span>
              </div>

              {/* Unlock Request Button if account is locked */}
              {lockoutInfo && (
                <div className="pt-2 border-t border-red-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-red-600 font-medium">
                    {lockoutInfo.unlockRequested ? '✓ Unlock request pending admin review' : 'Need help logging in?'}
                  </span>
                  <button
                    type="button"
                    onClick={handleRequestUnlock}
                    disabled={lockoutInfo.unlockRequested || lockoutInfo.requestLoading}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {lockoutInfo.requestLoading ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i> Sending...
                      </>
                    ) : lockoutInfo.unlockRequested ? (
                      <>
                        <i className="fa-solid fa-clock"></i> Request Sent
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-key"></i> Request Admin Unlock
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <i className="fa-solid fa-circle-check text-emerald-500 flex-shrink-0"></i>
              <span>{success}</span>
            </div>
          )}

          {/* ===== FORM 1: SIGN IN / SIGN UP ===== */}
          {authMode !== 'verify' ? (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* Full Name field for Sign Up */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <i className="fa-solid fa-id-card absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Juan Dela Cruz"
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                    />
                  </div>
                  {formData.name.length > 0 && (
                    <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold ${
                      isNameValid ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      <i className={`fa-solid ${isNameValid ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
                      <span>{isNameValid ? 'Full name accepted' : 'Enter your complete first and last name'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Email Field with @umak.edu.ph validation hint */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">UMak Email Address</label>
                  <span className="text-[10px] text-slate-500 font-mono">Must end with @umak.edu.ph</span>
                </div>
                <div className="relative">
                  <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="k12345678@umak.edu.ph"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                  />
                </div>
                {formData.email.length > 0 && (
                  <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold transition-colors ${
                    isEmailValid ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    <i className={`fa-solid ${isEmailValid ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
                    <span>{isEmailValid ? 'Valid UMak email domain' : 'Must end with @umak.edu.ph'}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] font-bold text-umak-orange hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-umak-navy transition-colors cursor-pointer p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                  </button>
                </div>

                {/* Password Strength Meter — Sign Up only */}
                {authMode === 'signup' && formData.password.length > 0 && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password Strength</span>
                      <span className={`text-[11px] font-extrabold tracking-wide ${currentStrength.textColor}`}>
                        {currentStrength.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i < passedRuleCount ? currentStrength.barColor : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {passwordRules.map((rule, idx) => (
                        <div key={idx} className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${
                          rule.passed ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          <i className={`fa-solid ${rule.passed ? 'fa-circle-check' : 'fa-circle'} text-[9px] ${rule.passed ? 'text-emerald-500' : 'text-slate-300'}`}></i>
                          <span>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <i className="fa-solid fa-shield-halved absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-umak-orange focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-umak-navy transition-colors cursor-pointer p-0.5"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                    </button>
                  </div>
                  {formData.confirmPassword.length > 0 && (
                    <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold ${
                      isConfirmMatch ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      <i className={`fa-solid ${isConfirmMatch ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`}></i>
                      <span>{isConfirmMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (authMode === 'signup' && !isSignupReady)}
                className="w-full py-3 bg-gradient-to-r from-umak-navy to-umak-navydark hover:from-umak-orange hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    Processing...
                  </>
                ) : authMode === 'signin' ? (
                  <>
                    <i className="fa-solid fa-right-to-bracket"></i>
                    Sign In using UMak Email
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    Send Verification Code to UMak Email
                  </>
                )}
              </button>
            </form>
          ) : (

            /* ===== FORM 2: 6-DIGIT OTP VERIFICATION ===== */
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 text-center mb-3">
                  Enter 6-Digit Email Verification Code
                </label>

                {/* 6 Individual Digit Inputs */}
                <div className="flex justify-center gap-2">
                  {otpInput.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-digit-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-12 h-14 text-center font-mono font-extrabold text-2xl bg-slate-50 border-2 border-slate-300 focus:border-umak-orange focus:bg-white rounded-xl text-umak-navy outline-none shadow-sm transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Verify Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-umak-navy to-umak-navydark hover:from-umak-orange hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    Verifying Code...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-circle-check"></i>
                    Verify & Complete Registration
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-left"></i> Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-umak-orange hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <i className="fa-solid fa-rotate-right"></i> Resend Code
                </button>
              </div>

            </form>
          )}

          {/* Back to Home Link */}
          <div className="text-center pt-2 border-t border-slate-100 text-xs">
            <Link to="/" className="text-slate-500 hover:text-umak-navy font-semibold inline-flex items-center gap-1.5">
              <i className="fa-solid fa-house"></i> Back to Main Landing Page
            </Link>
          </div>

        </div>
      </main>

      <Footer />

      {/* FORGOT PASSWORD MODAL */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onSwitchToLogin={() => setAuthMode('signin')}
      />
    </div>
  );
};
