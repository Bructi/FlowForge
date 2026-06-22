import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

import { initDatabase } from './db/database';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

import authRoutes from './routes/auth';
import workflowRoutes from './routes/workflows';
import executionRoutes from './routes/executions';
import templateRoutes from './routes/templates';
import integrationRoutes from './routes/integrations';
import notificationRoutes from './routes/notifications';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import fileRoutes from './routes/files';
import nodeRoutes from './routes/nodes';

const app = express();
const httpServer = createServer(app);

// ─── Socket.IO ─────────────────────────────────────────────
export const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('join:execution', (executionId: string) => {
    socket.join(`execution:${executionId}`);
  });
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Ensure directories exist ──────────────────────────────
const dirs = ['uploads', 'workspaces', 'documents', 'logs', 'templates', 'data'];
dirs.forEach((dir) => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// ─── Middleware ────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Rate Limiting ─────────────────────────────────────────
app.use('/api/auth', rateLimiter(20, 15));   // 20 req / 15 min on auth
app.use('/api', rateLimiter(200, 1));         // 200 req / min on API

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/nodes', nodeRoutes);

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'FlowForge AI',
  });
});

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  try {
    await initDatabase();
    logger.info('✅ Database initialized');

    httpServer.listen(PORT, () => {
      logger.info(`🚀 FlowForge AI Server running on http://localhost:${PORT}`);
      logger.info(`🔌 WebSocket server ready`);
      logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
