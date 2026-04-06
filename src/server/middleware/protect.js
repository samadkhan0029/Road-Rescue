/* global process */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const decodeToken = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.id).select('-password');
};

const protect = async (req, res, next) => {
  try {
    const user = await decodeToken(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, token missing',
        message: 'Not authorized, token missing',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please log in again.',
        message: 'Invalid or expired session. Please log in again.',
      });
    }
    next(error);
  }
};

export const optionalProtect = async (req, res, next) => {
  try {
    const user = await decodeToken(req);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
      return next();
    }
    next(error);
  }
};

export default protect;
