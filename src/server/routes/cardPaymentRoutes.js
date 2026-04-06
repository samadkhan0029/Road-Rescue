import express from 'express';
import mongoose from 'mongoose';
import Request from '../models/Request.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/payments/card - Process card payment
router.post('/card', async (req, res) => {
  try {
    const { requestId, cardholderName, cardNumber, expiryDate, cvv, amount } = req.body;
    
    // Basic validation
    if (!requestId || !cardholderName || !cardNumber || !expiryDate || !cvv || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment details'
      });
    }

    // Find the request/job
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Check if already paid
    if (request.isPaid) {
      return res.status(400).json({
        success: false,
        error: 'Payment already processed for this request'
      });
    }

    // Atomic update: Mark request as paid and update provider earnings
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update request status to paid
      request.isPaid = true;
      request.paymentStatus = 'completed';
      request.paymentMethod = 'card';
      request.paidAt = new Date();
      request.cardDetails = {
        cardholderName,
        lastFourDigits: cardNumber.slice(-4),
        expiryDate
        // Note: Never store full card number or CVV in production
      };
      await request.save({ session });

      // Update provider's total earnings atomically
      if (request.assignedProvider) {
        await User.findByIdAndUpdate(
          request.assignedProvider,
          {
            $inc: { 
              'providerInfo.totalEarnings': amount,
              'providerInfo.jobsCompleted': 1
            },
            $push: {
              'providerInfo.recentJobs': {
                id: requestId,
                customerName: request.customerName || 'Customer',
                serviceType: request.serviceType || 'Emergency Service',
                locationName: request.location?.address || 'Unknown location',
                fareLabel: `₹${amount}`,
                rating: 0, // Will be updated when customer rates
                completedAt: new Date().toISOString(),
                paymentMethod: 'card'
              }
            }
          },
          { session }
        );
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

    } catch (transactionError) {
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }

    // Emit real-time update to provider (if socket is available)
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      if (io && request.assignedProvider) {
        // Get updated provider info
        const updatedProvider = await User.findById(request.assignedProvider);
        
        io.to(`provider_${request.assignedProvider}`).emit('payment_received', {
          requestId: requestId,
          amount: amount,
          customerName: request.customerName || 'Customer',
          serviceType: request.serviceType,
          paymentMethod: 'card',
          newTotalEarnings: updatedProvider.providerInfo.totalEarnings
        });
      }
    } catch (socketError) {
      console.log('Socket not available for real-time update:', socketError.message);
    }

    res.json({
      success: true,
      message: 'Card payment processed successfully',
      payment: {
        id: `CARD_${Date.now()}`,
        amount: amount,
        method: 'card',
        status: 'completed',
        cardholderName,
        lastFourDigits: cardNumber.slice(-4)
      }
    });

  } catch (error) {
    console.error('Card payment processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment processing failed. Please try again.'
    });
  }
});

export default router;
