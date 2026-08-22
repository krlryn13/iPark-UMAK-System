/**
 * PayMongo REST API Integration Service
 * Communicates with PayMongo API v1 endpoints using HTTP Basic Auth (PAYMONGO_SECRET_KEY).
 * 
 * Functions:
 *   createCheckoutSession  — Generates PayMongo Checkout Session URL for GCash, Maya, QR Ph, & Cards.
 *   retrieveCheckoutSession — Verifies payment completion status from PayMongo.
 */

const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';

// Helper to construct HTTP Basic Auth Header using PAYMONGO_SECRET_KEY
const getAuthHeader = () => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY || 'sk_test_osdypmczCu8GMfcyR4GBbAZN';
  const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');
  return {
    'Authorization': `Basic ${encodedKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

/**
 * Creates a PayMongo Checkout Session for ₱200.00 Sticker Fee
 */
const createCheckoutSession = async ({ amount = 200.00, description, applicantName, email, referenceNo, returnUrl }) => {
  const amountInCents = Math.round(amount * 100); // ₱200.00 = 20000 centavos

  const payload = {
    data: {
      attributes: {
        billing: {
          name: applicantName || 'UMak Heron',
          email: email || 'student@umak.edu.ph'
        },
        line_items: [
          {
            currency: 'PHP',
            amount: amountInCents,
            description: description || 'iPark UMAK Vehicle Sticker Application Fee (1 Year)',
            name: 'iPark UMAK Sticker Fee',
            quantity: 1
          }
        ],
        payment_method_types: ['gcash', 'paymaya', 'card', 'qrph'],
        reference_number: referenceNo,
        success_url: `${returnUrl}?payment=success&ref=${referenceNo}`,
        cancel_url: `${returnUrl}?payment=cancel&ref=${referenceNo}`,
        description: 'University of Makati OHSO Vehicle Sticker Fee'
      }
    }
  };

  const response = await fetch(`${PAYMONGO_BASE_URL}/checkout_sessions`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(payload)
  });

  const responseData = await response.json();

  if (!response.ok) {
    const errorMsg = responseData?.errors?.[0]?.detail || 'PayMongo Checkout API failed.';
    throw new Error(errorMsg);
  }

  const sessionObj = responseData.data;
  return {
    sessionId: sessionObj.id,
    checkoutUrl: sessionObj.attributes.checkout_url,
    referenceNo: sessionObj.attributes.reference_number,
    status: sessionObj.attributes.status,
    raw: sessionObj
  };
};

/**
 * Retrieves and verifies payment status of a Checkout Session from PayMongo
 */
const retrieveCheckoutSession = async (sessionId) => {
  const response = await fetch(`${PAYMONGO_BASE_URL}/checkout_sessions/${sessionId}`, {
    method: 'GET',
    headers: getAuthHeader()
  });

  const responseData = await response.json();

  if (!response.ok) {
    const errorMsg = responseData?.errors?.[0]?.detail || 'Failed to retrieve PayMongo session.';
    throw new Error(errorMsg);
  }

  const sessionObj = responseData.data;
  const payments = sessionObj.attributes.payments || [];
  const isPaid = payments.some(p => p.attributes.status === 'paid') || sessionObj.attributes.status === 'active';

  return {
    sessionId: sessionObj.id,
    isPaid,
    payments,
    status: sessionObj.attributes.status,
    raw: sessionObj
  };
};

module.exports = {
  createCheckoutSession,
  retrieveCheckoutSession
};
