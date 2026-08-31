/**
 * Payment Controller
 * Handles PayMongo REST API checkout creation, session status verification, and payment webhooks.
 */

const paymongoService = require('../services/paymongoService');
const { handleServerError } = require('../utils/errorHandler');
const db = require('../config/db');

// Create PayMongo Checkout Session
const createCheckoutSession = async (req, res) => {
  const { amount, description, referenceNo, returnUrl } = req.body;
  const user = req.user; // attached by authenticateToken middleware

  if (!user) {
    return res.status(401).json({ error: 'Authentication required to initiate payment.' });
  }

  const cleanRefNo = referenceNo || `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const defaultReturnUrl = returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  try {
    const checkoutData = await paymongoService.createCheckoutSession({
      amount: amount || 200.00,
      description: description || 'iPark UMAK Vehicle Parking Sticker Fee (1 Year)',
      applicantName: user.name,
      email: user.email,
      referenceNo: cleanRefNo,
      returnUrl: defaultReturnUrl
    });

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
      // Update sticker application payment_status to 'paid' in DB if reference_number exists
      const refNo = sessionData.raw.attributes.reference_number;
      if (refNo) {
        db.query(
          'UPDATE vehicle_stickers SET payment_status = "paid" WHERE payment_ref_no = ?',
          [refNo],
          (updErr) => {
            if (updErr) console.error('[DB UPDATE ERROR]', updErr);
          }
        );
      }
    }

    res.json({
      sessionId: sessionData.sessionId,
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
