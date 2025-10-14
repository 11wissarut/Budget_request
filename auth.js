import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Creates a JWT token
export function signToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

// Verifies a JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
