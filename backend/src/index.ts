import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

// Trust Railway / Vercel reverse proxy so rate-limiting uses real client IPs
app.set('trust proxy', 1);

// ── Health Check ─────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

// ── Security Middleware ──────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Rate limiting: 100 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
  skip: () => env.NODE_ENV === 'development',
}));

// ── Body Parsing ─────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Routes ───────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ──────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────
const server = app.listen(env.PORT, () => {
  console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  console.log(`📡 API available at http://localhost:${env.PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app;
