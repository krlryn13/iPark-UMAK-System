const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '295998885374-797smduubipt79vc2n6rqef4n1uq4n17.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

async function verifyGoogleToken(token) {
  if (!token) {
    throw new Error('Google authentication token is required.');
  }

  // 1. Try verifying as ID Token first via Google OAuth2Client
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
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
    // 2. If it's an OAuth2 access_token (from initTokenClient), verify via Google Userinfo API
    try {
      const fetch = (await import('node-fetch')).default || global.fetch;
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const payload = await res.json();
        return {
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          email_verified: payload.email_verified === true || payload.email_verified === 'true',
          picture: payload.picture
        };
      }
    } catch (e) { }

    // 3. Fallback: Check tokeninfo endpoint
    try {
      const fetch = (await import('node-fetch')).default || global.fetch;
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      if (res.ok) {
        const payload = await res.json();
        return {
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          email_verified: payload.email_verified === 'true' || payload.email_verified === true,
          picture: payload.picture
        };
      }
    } catch (e) { }

    throw new Error(`Google Token Verification Failed: Invalid or expired token.`);
  }
}

module.exports = {
  verifyGoogleToken
};
