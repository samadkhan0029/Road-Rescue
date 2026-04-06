import Review from '../models/Review.js';
import User from '../models/User.js';

// Test database connection
const testConnection = async () => {
  try {
    const count = await User.countDocuments();
    console.log('Database connection test - User count:', count);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Submit a new review
const submitReview = async (req, res) => {
  try {
    console.log('Review submission request received');
    console.log('Request body:', req.body);
    console.log('Authenticated user:', req.user);
    
    // Test database connection first
    const dbConnected = await testConnection();
    if (!dbConnected) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    const { jobId, providerId, rating, tags, comment } = req.body;
    const customerId = req.user?._id; // Assuming customer is authenticated

    // Validate required fields
    if (!jobId || !providerId || !rating) {
      console.log('Missing required fields:', { jobId, providerId, rating });
      return res.status(400).json({
        success: false,
        error: 'Job ID, Provider ID, and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      console.log('Invalid rating:', rating);
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Check if review already exists for this job
    const existingReview = await Review.findOne({ jobId });
    if (existingReview) {
      console.log('Review already exists for job:', jobId);
      return res.status(400).json({
        success: false,
        error: 'Review already exists for this job'
      });
    }

    // Create new review
    const review = new Review({
      jobId,
      providerId,
      customerId,
      rating,
      tags: tags || [],
      comment: comment || '',
      createdAt: new Date()
    });

    await review.save();

    // Update provider's average rating and total reviews
    console.log('Finding provider with ID:', providerId);
    const provider = await User.findById(providerId);
    if (!provider) {
      console.log('Provider not found:', providerId);
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    console.log('Provider found:', provider._id);
    console.log('Current provider info:', provider.providerInfo);

    // Calculate new average rating
    const currentAvg = provider.providerInfo?.averageRating || 0;
    const totalReviews = provider.providerInfo?.totalReviews || 0;
    
    const newAverage = totalReviews === 0 
      ? rating 
      : ((currentAvg * totalReviews) + rating) / (totalReviews + 1);

    console.log('Rating calculation:', { currentAvg, totalReviews, newRating: rating, newAverage });

    // Update provider document
    const updateData = {
      'providerInfo.averageRating': Math.round(newAverage * 10) / 10, // Round to 1 decimal place
      'providerInfo.totalReviews': totalReviews + 1,
      'providerInfo.lastReviewAt': new Date()
    };
    
    console.log('Updating provider with data:', updateData);
    await User.findByIdAndUpdate(providerId, updateData);

    // Get updated provider data
    const updatedProvider = await User.findById(providerId);

    // Emit socket event to provider for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`provider-${providerId}`).emit('new_rating', {
        rating,
        comment: comment || '',
        customerName: req.user?.name || 'Anonymous',
        newAverage: Math.round(newAverage * 10) / 10,
        totalReviews: totalReviews + 1
      });
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        review: {
          _id: review._id,
          rating,
          tags: tags || [],
          comment: comment || '',
          createdAt: review.createdAt
        },
        providerStats: {
          averageRating: Math.round(newAverage * 10) / 10,
          totalReviews: totalReviews + 1
        }
      }
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    console.error('Error stack:', error.stack);
    
    // Send detailed error for debugging
    res.status(500).json({
      success: false,
      error: 'Failed to submit review',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all reviews for a provider
const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ providerId })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ providerId });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching provider reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
};

// Get provider's rating statistics
const getProviderStats = async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await User.findById(providerId, 'providerInfo.averageRating providerInfo.totalReviews');
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { providerId: provider._id } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        averageRating: provider.providerInfo?.averageRating || 0,
        totalReviews: provider.providerInfo?.totalReviews || 0,
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider statistics'
    });
  }
};

export {
  submitReview,
  getProviderReviews,
  getProviderStats
};
