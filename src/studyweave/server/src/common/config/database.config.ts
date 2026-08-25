import mongoose from 'mongoose';
import { appConfig } from './app.config.js';

export const connectToDatabase = async (): Promise<void> => {
  await mongoose.connect(appConfig.MONGODB_URI);
};
