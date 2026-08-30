import mongoose from 'mongoose';
import { appConfig } from './app.config.js';

export const connectToDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(appConfig.MONGODB_URI);
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
};
