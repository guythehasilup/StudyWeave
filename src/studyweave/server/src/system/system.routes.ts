import { Router } from 'express';
import { systemController } from './system.controller.js';

export const systemRouter = Router();

systemRouter.get('/', systemController.getApiInfo);
systemRouter.get('/api/health', systemController.getHealth);
