import React, { useState, useEffect, useCallback } from 'react';

/**
 * Toast notification system — replaces all alert() calls.
 * Usage:
 *   const { showToast, ToastContainer } = useToast();
 *   showToast('Application approved!', 'success');
 *   // render <ToastContainer /> in your component
 */

let toastIdCounter = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  const ToastContainer = useCallback(() => (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  ), [toasts, removeToast]);

  return { showToast, ToastContainer };
};

const TOAST_STYLES = {
  success: {
    bg: 'bg-emerald-600',
    icon: 'fa-solid fa-circle-check',
    accent: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-red-600',
    icon: 'fa-solid fa-circle-xmark',
    accent: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-600',
    icon: 'fa-solid fa-triangle-exclamation',
    accent: 'bg-amber-500',
  },
  info: {
    bg: 'bg-slate-700',
    icon: 'fa-solid fa-circle-info',
    accent: 'bg-slate-600',
  },
};

const ToastItem = ({ toast, onClose }) => {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium
        ${style.bg}
        ${toast.exiting ? 'toast-exit' : 'toast-enter'}
      `}
    >
      <i className={`${style.icon} text-base mt-0.5 flex-shrink-0 opacity-90`} />
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-white/60 hover:text-white transition-colors flex-shrink-0 mt-0.5 cursor-pointer"
      >
        <i className="fa-solid fa-xmark text-xs" />
      </button>
    </div>
  );
};
