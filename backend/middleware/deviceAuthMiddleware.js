// Device API key authentication middleware
module.exports = function authenticateDevice(req, res, next) {
  const apiKey = req.header('x-api-key') || req.header('X-API-KEY');
  const expectedKey = process.env.DEVICE_API_KEY || 'ipark_diorama_secure_api_key_2026';

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized device: Invalid or missing API key.' });
  }
  next();
};
