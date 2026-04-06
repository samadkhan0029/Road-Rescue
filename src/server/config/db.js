/* global process */
import mongoose from 'mongoose';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set. Add it to your .env file.');
  }

  // Keep retrying so the server can come up even if Mongo starts later.
  // (Previously this crashed the entire backend on a single connection failure.)
  const maxRetries = Number(process.env.MONGO_CONNECT_RETRIES || 30);
  const baseDelayMs = Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS || 2000);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await mongoose.connect(mongoUri);
      console.log('MongoDB Connected');
      return;
    } catch (error) {
      console.error(`MongoDB Connection Error (attempt ${attempt}/${maxRetries}): ${error.message}`);
      if (attempt === maxRetries) {
        console.error('Max MongoDB connection retries reached. Backend will still start, but requests will fail until Mongo is reachable.');
        return;
      }
      // Exponential backoff (bounded).
      const waitMs = Math.min(baseDelayMs * 2 ** (attempt - 1), 30000);
      await delay(waitMs);
    }
  }
};

export default connectDB;
