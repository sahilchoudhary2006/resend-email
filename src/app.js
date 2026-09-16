import express from 'express';
import { config } from './config/index.js';

import apiRoutes from './routes/v1/index.js';
import webhookRoutes from './routes/webhooks.js';

const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// We will mount routes here
app.use('/api/v1', express.json(), apiRoutes);
app.use('/', webhookRoutes);

export default app;
