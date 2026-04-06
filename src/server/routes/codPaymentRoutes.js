import express from 'express';
import mongoose from 'mongoose';
import Request from '../models/Request.js';
import User from '../models/User.js';

const router = express.Router();

// PATCH /api/payments/cod - Confirm COD payment
router.patch('/cod', async (req, res) => {
  console.log('COD PATCH route called', req.body);
  
  try {
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
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

    // Check if already paid or completed
    if (request.isPaid || request.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Payment already processed for this request'
      });
    }

    // Update request status to pending cash confirmation
    request.status = 'AWAITING_CASH_CONFIRMATION';
    request.paymentStatus = 'pending_cash';
    request.paymentMethod = 'cod';
    request.completedAt = new Date();
    
    await request.save();

    // Emit real-time notification to provider
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      if (io && request.assignedProvider) {
        io.to(`provider_${request.assignedProvider}`).emit('cod_confirmation_requested', {
          requestId: requestId,
          amount: request.totalFare || 1000,
          customerName: request.customerName || 'Customer',
          serviceType: request.serviceType || 'Emergency Service',
          locationName: request.location?.address || 'Unknown location',
          message: 'User has chosen Cash on Delivery. Please confirm once you receive the payment.',
          requestedAt: new Date().toISOString()
        });
      }
    } catch (socketError) {
      console.log('Socket not available for COD notification:', socketError.message);
    }

    res.json({
      success: true,
      message: 'Cash on payment confirmed. Provider has been notified.',
      cod: {
        requestId: requestId,
        amount: request.totalFare || 1000,
        status: 'pending_provider_confirmation',
        message: 'Provider will confirm cash receipt'
      }
    });

  } catch (error) {
    console.error('COD confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm cash payment. Please try again.'
    });
  }
});

// POST /api/payments/cod/confirm - Provider confirms cash receipt
router.post('/cod/confirm', async (req, res) => {
  console.log('COD confirm route called', req.body);
  
  try {
    const { requestId, providerId } = req.body;
    
    if (!requestId || !providerId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID and Provider ID are required'
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

    // Verify this request belongs to this provider
    if (request.assignedProvider.toString() !== providerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: This request is not assigned to you'
      });
    }

    // Check if already confirmed
    if (request.isPaid) {
      return res.status(400).json({
        success: false,
        error: 'Payment already confirmed'
      });
    }

    // Atomic update: Mark as paid and update provider earnings
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update request status
      request.isPaid = true;
      request.paymentStatus = 'completed';
      request.paidAt = new Date();
      await request.save({ session });

      // Update provider's total earnings atomically
      const amount = request.totalFare || 1000;
      await User.findByIdAndUpdate(
        providerId,
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
              paymentMethod: 'cod'
            }
          }
        },
        { session }
      );

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

    } catch (transactionError) {
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }

    // Emit real-time update to provider
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      if (io) {
        // Get updated provider info
        const updatedProvider = await User.findById(providerId);
        
        io.to(`provider_${providerId}`).emit('payment_received', {
          requestId: requestId,
          amount: amount,
          customerName: request.customerName || 'Customer',
          serviceType: request.serviceType,
          paymentMethod: 'cod',
          newTotalEarnings: updatedProvider.providerInfo.totalEarnings
        });
      }
    } catch (socketError) {
      console.log('Socket not available for payment confirmation:', socketError.message);
    }

    res.json({
      success: true,
      message: 'Cash payment confirmed and added to your earnings!',
      payment: {
        id: `COD_${Date.now()}`,
        amount: amount,
        method: 'cod',
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('COD confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm cash receipt. Please try again.'
    });
  }
});

export default router;
