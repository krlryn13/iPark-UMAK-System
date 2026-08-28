const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '295998885374-797smduubipt79vc2n6rqef4n1uq4n17.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

/**
 * Verifies Google ID Token sent from frontend
 * Returns payload: { name, email, email_verified, picture }
 */
async function verifyGoogleToken(idToken) {
  if (!idToken) {
    throw new Error('Google authentication token is required.');
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: CLIENT_ID
    });

    const payload = ticket.getPayload();
    return {
      name: payload.name,
      email: payload.email,
      email_verified: payload.email_verified,
      picture: payload.picture
    };
  } catch (err) {
    // Fallback: If library fails or mock token is sent in dev, check Google tokeninfo API
    try {
      const fetch = (await import('node-fetch')).default || global.fetch;
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (res.ok) {
        const payload = await res.json();
        return {
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          email_verified: payload.email_verified === 'true' || payload.email_verified === true,
          picture: payload.picture
        };
      }
    } catch (e) {}

    throw new Error(`Google Token Verification Failed: ${err.message}`);
  }
}

module.exports = {
  verifyGoogleToken
};
