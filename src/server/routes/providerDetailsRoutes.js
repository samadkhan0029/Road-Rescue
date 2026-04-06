import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /api/providers/:id - Get provider details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the provider by ID
    const provider = await User.findById(id).select('name email phone providerInfo');
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }
    
    // Check if user is actually a provider
    if (provider.userType !== 'provider') {
      return res.status(400).json({
        success: false,
        error: 'User is not a provider'
      });
    }
    
    // Extract provider-specific info
    const providerData = {
      _id: provider._id,
      name: provider.name,
      email: provider.email,
      phone: provider.phone,
      upiId: provider.providerInfo?.upiId || provider.providerInfo?.vpa || `${provider.name.toLowerCase().replace(/\s+/g, '')}@okaxis`,
      bankDetails: provider.providerInfo?.bankDetails || null,
      totalEarnings: provider.providerInfo?.totalEarnings || 0,
      averageRating: provider.providerInfo?.averageRating || 0,
      totalReviews: provider.providerInfo?.totalReviews || 0,
      recentJobs: provider.providerInfo?.recentJobs || []
    };
    
    res.json({
      success: true,
      provider: providerData
    });
    
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
