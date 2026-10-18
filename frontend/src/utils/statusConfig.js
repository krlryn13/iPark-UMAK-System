/**
 * Centralized status configuration for sticker applications.
 */

const STATUS_MAP = {
  // Phase 1: Document Review
  pending_review: {
    label: 'Pending Document Review',
    shortLabel: 'Under Review',
    description: 'Your submitted documents are being reviewed by OHSO.',
    color: 'amber',
    icon: 'fa-solid fa-hourglass-half',
    phase: 1,
  },
  pending: {
    label: 'Pending Document Review',
    shortLabel: 'Under Review',
    description: 'Your submitted documents are being reviewed by OHSO.',
    color: 'amber',
    icon: 'fa-solid fa-hourglass-half',
    phase: 1,
  },
  rejected: {
    label: 'Rejected — Resubmission Required',
    shortLabel: 'Rejected',
    description: 'Your documents did not meet requirements. Please review the feedback and resubmit.',
    color: 'red',
    icon: 'fa-solid fa-circle-xmark',
    phase: 1,
  },

  // Phase 2: Payment & Release
  approved: {
    label: 'Documents Approved — Payment Required',
    shortLabel: 'Approved',
    description: 'Your documents have been verified. Please pay ₱200 and upload your payment proof.',
    color: 'indigo',
    icon: 'fa-solid fa-circle-check',
    phase: 2,
  },
  payment_submitted: {
    label: 'Payment Proof Under Review',
    shortLabel: 'Proof Submitted',
    description: 'Your payment proof has been submitted and is being verified by OHSO.',
    color: 'blue',
    icon: 'fa-solid fa-receipt',
    phase: 2,
  },
  payment_held: {
    label: 'Payment Proof On Hold — Action Required',
    shortLabel: 'Payment On Hold',
    description: 'Your payment proof was placed on hold by OHSO. Please review the feedback and re-upload your payment receipt.',
    color: 'amber',
    icon: 'fa-solid fa-hand',
    phase: 2,
  },
  ready_for_release: {
    label: 'Ready for Pickup',
    shortLabel: 'Ready',
    description: 'Your sticker is ready! Visit OHSO Ground Floor to claim it.',
    color: 'emerald',
    icon: 'fa-solid fa-box-open',
    phase: 2,
  },
  paid: {
    label: 'Payment Verified — Active',
    shortLabel: 'Active',
    description: 'Your payment has been verified and your sticker is active.',
    color: 'emerald',
    icon: 'fa-solid fa-circle-check',
    phase: 2,
  },
  issued: {
    label: 'Sticker Issued — Active',
    shortLabel: 'Active',
    description: 'Your official UMak vehicle sticker has been issued and is active.',
    color: 'emerald',
    icon: 'fa-solid fa-id-card',
    phase: 2,
  },
  claimed: {
    label: 'Sticker Claimed — Active',
    shortLabel: 'Active',
    description: 'You have claimed your sticker. Drive safely on campus!',
    color: 'emerald',
    icon: 'fa-solid fa-car',
    phase: 2,
  },
  expired: {
    label: 'Expired',
    shortLabel: 'Expired',
    description: 'This sticker has expired. Please apply for a new one.',
    color: 'slate',
    icon: 'fa-solid fa-clock',
    phase: 0,
  },
};

// Color palettes for each status color key
const COLOR_PALETTES = {
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    dotColor: 'bg-amber-400',
    ringColor: 'ring-amber-200',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    dotColor: 'bg-red-400',
    ringColor: 'ring-red-200',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-rose-500',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    iconColor: 'text-indigo-500',
    dotColor: 'bg-indigo-400',
    ringColor: 'ring-indigo-200',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-violet-500',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconColor: 'text-blue-500',
    dotColor: 'bg-blue-400',
    ringColor: 'ring-blue-200',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-500',
    dotColor: 'bg-emerald-400',
    ringColor: 'ring-emerald-200',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    iconColor: 'text-slate-400',
    dotColor: 'bg-slate-400',
    ringColor: 'ring-slate-200',
    gradientFrom: 'from-slate-400',
    gradientTo: 'to-slate-500',
  },
};

/**
 * Get the full status config for a given raw DB status string.
 * @param {string} rawStatus
 * @returns {{ label: string, shortLabel: string, description: string, color: string, icon: string, phase: number, palette: object }}
 */
export const getStatusConfig = (rawStatus) => {
  const s = rawStatus?.toLowerCase?.()?.trim?.() || '';
  const config = STATUS_MAP[s] || {
    label: rawStatus || 'Unknown',
    shortLabel: rawStatus || 'Unknown',
    description: '',
    color: 'slate',
    icon: 'fa-solid fa-circle-question',
    phase: 0,
  };
  return {
    ...config,
    palette: COLOR_PALETTES[config.color] || COLOR_PALETTES.slate,
  };
};

/**
 * Guest reservation status config
 */
const GUEST_STATUS_MAP = {
  pending: {
    label: 'Pending Approval',
    color: 'amber',
    icon: 'fa-solid fa-hourglass-half',
  },
  approved: {
    label: 'Approved — E-Pass Active',
    color: 'emerald',
    icon: 'fa-solid fa-circle-check',
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    icon: 'fa-solid fa-circle-xmark',
  },
};

export const getGuestStatusConfig = (rawStatus) => {
  const s = rawStatus?.toLowerCase?.()?.trim?.() || '';
  const config = GUEST_STATUS_MAP[s] || {
    label: rawStatus || 'Unknown',
    color: 'slate',
    icon: 'fa-solid fa-circle-question',
  };
  return {
    ...config,
    palette: COLOR_PALETTES[config.color] || COLOR_PALETTES.slate,
  };
};

/**
 * Returns a human-readable action success message (replaces raw DB messages)
 */
export const getActionMessage = (action, context = {}) => {
  const messages = {
    approve_docs: `${context.name || 'Applicant'}'s documents have been approved. They've been notified via email with their scheduled pickup date.`,
    reject_docs: `${context.name || 'Applicant'}'s application has been returned for revision. They've been notified with your feedback.`,
    verify_payment: `Payment verified for ${context.name || 'applicant'}! Sticker ${context.stickerNumber ? `#${context.stickerNumber}` : ''} is now ready for release.`,
    hold_payment: `Payment for ${context.name || 'applicant'} has been placed on hold. They've been asked to re-upload their proof.`,
    approve_guest: `Guest parking pass has been approved and the e-pass is now active.`,
    reject_guest: `Guest parking reservation has been declined.`,
    unlock_user: `Account for ${context.email || 'user'} has been unlocked successfully. They can now sign in again.`,
  };
  return messages[action] || 'Action completed successfully.';
};
