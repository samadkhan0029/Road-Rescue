/* global process */
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Request from '../models/Request.js';
import User from '../models/User.js';

const MIN_PAISE = 100; // ₹1

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return null;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export const createOrder = async (req, res, next) => {
  try {
    const instance = getRazorpay();
    if (!instance) {
      return res.status(503).json({
        success: false,
        message: 'Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      });
    }

    let amountPaise = req.body.amountPaise;
    if (typeof amountPaise !== 'number' && req.body.amountRupees != null) {
      const rupees = Number(req.body.amountRupees);
      if (!Number.isFinite(rupees) || rupees <= 0) {
        return res.status(400).json({
          success: false,
          message: 'amountRupees must be a positive number',
        });
      }
      amountPaise = Math.round(rupees * 100);
    }

    if (typeof amountPaise !== 'number' || !Number.isInteger(amountPaise) || amountPaise < MIN_PAISE) {
      return res.status(400).json({
        success: false,
        message: `amountPaise must be an integer >= ${MIN_PAISE} (₹1.00)`,
      });
    }

    const currency = (req.body.currency || 'INR').toUpperCase();
    const receipt = String(req.body.receipt || `rr_${Date.now()}`).slice(0, 40);
    const notes = {
      ...(typeof req.body.notes === 'object' && req.body.notes !== null ? req.body.notes : {}),
    };
    if (req.user?._id) {
      notes.userId = String(req.user._id);
    }

    const order = await instance.orders.create({
      amount: amountPaise,
      currency,
      receipt,
      notes,
    });

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyJobPayment = async (req, res, next) => {
  try {
    const { requestId, paymentMethod, amount, transactionId } = req.body;
    const userId = req.user?.id;

    if (!requestId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: requestId, paymentMethod, amount'
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
        error: 'Payment already processed'
      });
    }

    // Update request status to paid
    request.isPaid = true;
    request.paymentStatus = 'completed';
    request.paymentMethod = paymentMethod;
    request.paidAt = new Date();
    await request.save();

    // Update provider's total earnings
    if (request.assignedProvider) {
      await User.findByIdAndUpdate(request.assignedProvider, {
        $inc: { 'providerInfo.totalEarnings': amount },
        $push: {
          'providerInfo.recentJobs': {
            id: requestId,
            customerName: request.customerName || 'Customer',
            serviceType: request.serviceType || 'Emergency Service',
            locationName: request.location?.address || 'Unknown location',
            fareLabel: `₹${amount}`,
            rating: 0, // Will be updated when customer rates
            completedAt: new Date().toISOString()
          }
        }
      });
    }

    // Emit real-time update to provider (if socket is available)
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      if (io && request.assignedProvider) {
        io.to(`provider_${request.assignedProvider}`).emit('payment_received', {
          requestId: requestId,
          amount: amount,
          customerName: request.customerName || 'Customer',
          serviceType: request.serviceType,
          newTotalEarnings: (await User.findById(request.assignedProvider)).providerInfo.totalEarnings
        });
      }
    } catch (socketError) {
      console.log('Socket not available for real-time update');
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: `PAY_${Date.now()}`,
        amount: amount,
        method: paymentMethod,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPaymentStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    
    const request = await Request.findById(requestId).select('isPaid paymentStatus paymentMethod paidAt totalFare');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.json({
      success: true,
      payment: {
        isPaid: request.isPaid,
        status: request.paymentStatus,
        method: request.paymentMethod,
        paidAt: request.paidAt,
        amount: request.totalFare
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const verifyPayment = (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(503).json({
        success: false,
        message: 'Payments are not configured.',
      });
    }

    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
      req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature',
      });
    }

    const body = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expected !== signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    res.json({
      success: true,
      message: 'Payment verified',
      paymentId,
      orderId,
    });
  } catch (err) {
    next(err);
  }
};
