import express from 'express';
import { submitReview, getProviderReviews, getProviderStats } from '../controllers/reviewController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

console.log('Review routes initialized');
console.log('Controller functions:', { submitReview: !!submitReview, getProviderReviews: !!getProviderReviews, getProviderStats: !!getProviderStats });

// Test endpoint to verify review system is working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Review system is working!',
    timestamp: new Date().toISOString()
  });
});

// Submit a new review (protected route)
router.post('/', protect, (req, res) => {
  console.log('POST /api/reviews route hit');
  console.log('Request body:', req.body);
  console.log('Authenticated user:', req.user);
  submitReview(req, res);
});

// Get all reviews for a provider
router.get('/provider/:providerId', getProviderReviews);

// Get provider's rating statistics
router.get('/provider/:providerId/stats', getProviderStats);

export default router;
