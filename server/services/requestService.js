const mongoose = require('mongoose');
const Request = require('../models/Request');
const providerService = require('./providerService');

class RequestService {
  async createRequest(requestData) {
    try {
      // Try to use database first
      if (mongoose.connection.readyState === 1) { // Connected
        const request = new Request({
          ...requestData,
          status: 'PENDING'
        });
        await request.save();
        return {
          success: true,
          request
        };
      } else {
        // Create mock request when database is not available
        const mockRequest = {
          _id: 'mock_' + Date.now(),
          ...requestData,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return {
          success: true,
          request: mockRequest
        };
      }
    } catch (error) {
      console.error('Error creating request:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateRequestStatus(requestId, status, additionalData = {}) {
    try {
      const updateData = { status, ...additionalData };
      
      if (mongoose.connection.readyState === 1) { // Connected
        const request = await Request.findByIdAndUpdate(
          requestId,
          updateData,
          { new: true }
        ).populate('assignedProvider.providerId');

        if (!request) {
          return {
            success: false,
            error: 'Request not found'
          };
        }

        return {
          success: true,
          request
        };
      } else {
        // Mock update when database is not available
        const mockRequest = {
          _id: requestId,
          ...updateData,
          updatedAt: new Date()
        };
        return {
          success: true,
          request: mockRequest
        };
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processRequest(requestId) {
    try {
      // Update status to SEARCHING
      await this.updateRequestStatus(requestId, 'SEARCHING');

      // Get request details
      const request = await Request.findById(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      // Assign nearest provider
      const assignmentResult = await providerService.assignProvider(
        requestId,
        request.location.coordinates[1], // latitude
        request.location.coordinates[0], // longitude
        request.serviceType
      );

      if (!assignmentResult.success) {
        await this.updateRequestStatus(requestId, 'PENDING', {
          error: assignmentResult.error
        });
        return {
          success: false,
          error: assignmentResult.error
        };
      }

      // Update request with assigned provider
      await this.updateRequestStatus(requestId, 'ACCEPTED', {
        assignedProvider: assignmentResult.provider
      });

      return {
        success: true,
        request: await Request.findById(requestId),
        provider: assignmentResult.provider
      };
    } catch (error) {
      console.error('Error processing request:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getRequest(requestId) {
    try {
      if (mongoose.connection.readyState === 1) { // Connected
        const request = await Request.findById(requestId);
        if (!request) {
          return {
            success: false,
            error: 'Request not found'
          };
        }

        return {
          success: true,
          request
        };
      } else {
        // Mock request when database is not available
        const mockRequest = {
          _id: requestId,
          status: 'PENDING',
          createdAt: new Date()
        };
        return {
          success: true,
          request: mockRequest
        };
      }
    } catch (error) {
      console.error('Error getting request:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAllRequests(customerId) {
    try {
      if (mongoose.connection.readyState === 1) { // Connected
        const requests = await Request.find({ customerId })
          .sort({ createdAt: -1 });
        
        return {
          success: true,
          requests
        };
      } else {
        // Mock requests when database is not available
        const mockRequests = [];
        return {
          success: true,
          requests: mockRequests
        };
      }
    } catch (error) {
      console.error('Error getting requests:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new RequestService();
