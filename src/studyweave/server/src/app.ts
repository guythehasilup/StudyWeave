import cors from 'cors';
import express from 'express';
import { aiRequestRouter } from './ai/ai-request.routes.js';
import { authRouter } from './auth/auth.routes.js';
import { appConfig } from './common/config/app.config.js';
import { errorHandler, notFoundHandler } from './common/middleware/error.middleware.js';
import { systemRouter } from './system/system.routes.js';

export const app = express();

app.use(cors({ origin: appConfig.CLIENT_ORIGIN }));
app.use(express.json({ limit: '16kb' }));

app.use(systemRouter);
app.use('/api/auth', authRouter);
app.use('/api/requests', aiRequestRouter);

app.use(notFoundHandler);
app.use(errorHandler);
