/* global process */
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import miscRoutes from './routes/miscRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import jobPaymentRoutes from './routes/jobPaymentRoutes.js';
import cardPaymentRoutes from './routes/cardPaymentRoutes.js';
import codPaymentRoutes from './routes/codPaymentRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import providerDetailsRoutes from './routes/providerDetailsRoutes.js';
import reviewRoutes from './routes/reviews.js';
import userRoutes from './routes/userRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
// console.log('Review routes loaded:', !!reviewRoutes);
// console.log('Review routes methods:', Object.getOwnPropertyNames(reviewRoutes));
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { setIo } from './socket/socketStore.js';
import { sendOtp } from './controllers/miscController.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  },
});

connectDB();
setIo(io);

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  socket.on('join-request', (requestId) => {
    socket.join(`request-${requestId}`);
  });

  socket.on('register-provider', async (providerId) => {
    // Harden socket registration: only allow a provider to join its own room using JWT.
    const token = socket.handshake.auth?.token;
    if (!token) return;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded?.id).select('-password');

      if (!user || user.role !== 'provider') return;
      if (!providerId || String(user._id) !== String(providerId)) return;

      socket.join(`provider-${providerId}`);
    } catch {
      // Ignore invalid token.
    }
  });

  // Provider broadcasts live GPS to the active job's room so the
  // customer sees the marker move in real-time (no 5s poll lag).
  socket.on('provider-location-update', ({ requestId, lat, lng }) => {
    if (!requestId || lat == null || lng == null) return;
    // Broadcast to everyone else in the room (don't echo back to provider)
    socket.to(`request-${requestId}`).emit('provider-location-update', { lat, lng });
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Road Rescue backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payments', jobPaymentRoutes);
app.use('/api/payments', cardPaymentRoutes);
app.use('/api/payments', codPaymentRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/providers', providerDetailsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);

console.log('COD payment routes mounted at /api/payments/cod');
console.log('Review routes mounted at /api/reviews');
app.use('/api', miscRoutes);
app.post('/send-otp', sendOtp);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
