/**
 * Payment Controller
 * Handles PayMongo REST API checkout creation, session status verification, and payment webhooks.
 */

const paymongoService = require('../services/paymongoService');
const { handleServerError } = require('../utils/errorHandler');
const db = require('../config/db');

// Valid PayMongo payment method identifiers
const VALID_PAYMENT_METHODS = ['gcash', 'paymaya', 'qrph', 'card'];

// Create PayMongo Checkout Session
const createCheckoutSession = async (req, res) => {
  const { amount, description, referenceNo, returnUrl, paymentMethod } = req.body;
  const user = req.user; // attached by authenticateToken middleware

  if (!user) {
    return res.status(401).json({ error: 'Authentication required to initiate payment.' });
  }

  const cleanRefNo = referenceNo || `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const defaultReturnUrl = returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  // If a specific payment method is requested, restrict the checkout to that method only.
  // This pre-selects the channel on the PayMongo checkout page.
  const selectedMethod = VALID_PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : null;
  const paymentMethodTypes = selectedMethod
    ? [selectedMethod]
    : ['gcash', 'paymaya', 'card', 'qrph'];

  try {
    const checkoutData = await paymongoService.createCheckoutSession({
      amount: amount || 200.00,
      description: description || 'iPark UMAK Vehicle Parking Sticker Fee (1 Year)',
      applicantName: user.name,
      email: user.email,
      referenceNo: cleanRefNo,
      returnUrl: defaultReturnUrl,
      paymentMethodTypes,
    });

    // Directly bind this reference number and method to the user's pending sticker application
    db.query(
      `UPDATE vehicle_stickers 
       SET payment_ref_no = ?, 
           payment_method = ?,
           updated_at = NOW() 
       WHERE user_id = ? AND status = 'pending' AND payment_status = 'pending'`,
      [cleanRefNo, selectedMethod || 'gcash', user.id],
      (updErr) => {
        if (updErr) console.warn('[CHECKOUT BIND WARN]', updErr.message);
      }
    );

    res.json({
      message: 'PayMongo checkout session created successfully.',
      sessionId: checkoutData.sessionId,
      checkoutUrl: checkoutData.checkoutUrl,
      referenceNo: checkoutData.referenceNo
    });
  } catch (err) {
    return handleServerError(res, err, 'PayMongo Gateway Error: Unable to create checkout session.');
  }
};

// Verify Checkout Session Status
const verifyCheckoutSession = async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'Checkout Session ID is required.' });
  }

  try {
    const sessionData = await paymongoService.retrieveCheckoutSession(sessionId);

    if (sessionData.isPaid) {
      // Update sticker application payment_status to 'paid' and payment_ref_no to exact PayMongo Payment ID
      const refNo = sessionData.referenceNumber || sessionData.raw?.attributes?.reference_number;
      const payId = sessionData.paymentId || refNo;
      const userId = req.user ? req.user.id : null;

      db.query(
        `UPDATE vehicle_stickers 
         SET payment_status = "paid", 
             payment_ref_no = COALESCE(?, payment_ref_no) 
         WHERE (payment_ref_no = ? OR payment_ref_no = ? OR payment_ref_no LIKE ? ${userId ? 'OR (user_id = ? AND status = "pending")' : ''})`,
        userId ? [payId, refNo, payId, `%${sessionId}%`, userId] : [payId, refNo, payId, `%${sessionId}%`],
        (updErr) => {
          if (updErr) console.error('[DB UPDATE ERROR]', updErr);
        }
      );
    }

    res.json({
      sessionId: sessionData.sessionId,
      paymentId: sessionData.paymentId,
      referenceNumber: sessionData.referenceNumber,
      isPaid: sessionData.isPaid,
      status: sessionData.status,
      payments: sessionData.payments
    });
  } catch (err) {
    return handleServerError(res, err, 'Failed to verify payment status with PayMongo.');
  }
};

module.exports = {
  createCheckoutSession,
  verifyCheckoutSession
};
