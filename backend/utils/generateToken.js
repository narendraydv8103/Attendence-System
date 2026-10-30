const jwt = require('jsonwebtoken');

const generateAccessToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'fallback_secret_key_12345',
    { expiresIn: '1d' }
  );
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_67890',
    { expiresIn: '7d' }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
