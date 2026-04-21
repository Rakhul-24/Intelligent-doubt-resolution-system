import jwt from 'jwt-simple';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production_12345';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.decode(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const staffOnly = (req, res, next) => {
  if (req.userRole !== 'staff') {
    return res.status(403).json({ error: 'Only staff can access this' });
  }
  next();
};

export const studentOnly = (req, res, next) => {
  if (req.userRole !== 'student') {
    return res.status(403).json({ error: 'Only students can access this' });
  }
  next();
};
