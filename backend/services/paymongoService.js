
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
 * Creates a PayMongo Checkout Session.
 * @param {number} amount - Total amount in PHP including processing fee
 * @param {string[]} paymentMethodTypes - e.g. ['gcash'] or ['gcash','paymaya','card','qrph']
 */
const createCheckoutSession = async ({ amount = 200.00, description, applicantName, email, referenceNo, returnUrl, paymentMethodTypes }) => {
  const amountInCents = Math.round(amount * 100); // e.g. ₱204.46 = 20446 centavos

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
        payment_method_types: paymentMethodTypes || ['gcash', 'paymaya', 'card', 'qrph'],
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
  const isPaid = payments.some(p => p.attributes.status === 'paid') || sessionObj.attributes.status === 'completed';
  const paymentId = (payments.length > 0 && payments[0].id) ? payments[0].id : null;
  const referenceNumber = sessionObj.attributes.reference_number;

  return {
    sessionId: sessionObj.id,
    paymentId,
    referenceNumber,
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
