import React from 'react';
import { getStatusConfig } from '../utils/statusConfig';

/**
 * Reusable StatusBadge component for rendering human-readable status labels.
 * Replaces all inline status styling logic across both dashboards.
 * 
 * @param {object} props
 * @param {string} props.status - Raw DB status string
 * @param {'full'|'short'|'dot'} props.variant - Display variant
 * @param {boolean} props.pulse - Whether to show a pulse animation
 * @param {string} props.className - Additional class names
 */
const StatusBadge = ({ status, variant = 'full', pulse = false, className = '' }) => {
  const config = getStatusConfig(status);
  const { palette } = config;

  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-semibold ${palette.text} ${className}`}>
        <span className={`w-2 h-2 rounded-full ${palette.dotColor} ${pulse ? 'animate-pulse' : ''}`} />
        {config.shortLabel}
      </span>
    );
  }

  const label = variant === 'short' ? config.shortLabel : config.label;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold leading-tight
        ${palette.bg} ${palette.text} border ${palette.border}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <i className={`${config.icon} text-[10px] ${palette.iconColor}`} />
      {label}
    </span>
  );
};

export default StatusBadge;
