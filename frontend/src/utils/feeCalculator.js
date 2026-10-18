/**
 * PayMongo Processing Fee Calculator
 * Computes the total amount the applicant pays so the school nets exactly ₱200.
 *
 * Formula: total = (baseFee + fixedFee) / (1 - percentageRate)
 * This ensures: total - (total * rate + fixed) = baseFee
 */

export const STICKER_BASE_FEE = 200.00;

/** Official PayMongo PH VAT-inclusive fee rates (as of 2026) */
export const PAYMENT_METHODS = [
  {
    id: 'gcash',
    label: 'GCash',
    rate: 0.025,             // 2.5% VAT-inclusive (2.23% + 12% VAT)
    fixed: 0,
    color: '#007EFC',        // GCash blue
    bgLight: '#EFF6FF',
    border: '#BFDBFE',
    icon: 'gcash',
  },
  {
    id: 'paymaya',
    label: 'Maya',
    rate: 0.020,             // 2.0% VAT-inclusive
    fixed: 0,
    color: '#00B388',        // Maya green
    bgLight: '#ECFDF5',
    border: '#A7F3D0',
    icon: 'maya',
  },
  {
    id: 'qrph',
    label: 'QR Ph',
    rate: 0.015,             // 1.5% VAT-inclusive
    fixed: 0,
    color: '#1D4ED8',        // BSP blue
    bgLight: '#EFF6FF',
    border: '#BFDBFE',
    icon: 'qrph',
  },
  {
    id: 'card',
    label: 'Card',
    rate: 0.035,             // 3.5% VAT-inclusive
    fixed: 15.00,            // ₱15.00 VAT-inclusive fixed fee
    color: '#475569',        // slate-600
    bgLight: '#F8FAFC',
    border: '#CBD5E1',
    icon: 'card',
  },
];

/**
 * Computes exact total so school nets baseFee after PayMongo deduction.
 * @param {string} methodId - one of 'gcash', 'paymaya', 'qrph', 'card'
 * @param {number} baseFee - desired net amount school receives (default: 200)
 * @returns {{ total: number, processingFee: number, baseFee: number, methodId: string }}
 */
export function computeTotal(methodId, baseFee = STICKER_BASE_FEE) {
  const method = PAYMENT_METHODS.find((m) => m.id === methodId);
  if (!method) throw new Error(`Unknown payment method: ${methodId}`);

  // total = (baseFee + fixed) / (1 - rate)
  const rawTotal = (baseFee + method.fixed) / (1 - method.rate);
  // Round UP to nearest centavo to ensure school never gets less
  const total = Math.ceil(rawTotal * 100) / 100;
  const processingFee = Math.ceil((total - baseFee) * 100) / 100;

  return {
    methodId,
    baseFee,
    processingFee,
    total,
    label: method.label,
  };
}

/** Format peso amount with 2 decimal places */
export function formatPeso(amount) {
  return `₱${Number(amount).toFixed(2)}`;
}
