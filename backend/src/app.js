import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import orderRoutes from './routes/order.routes.js';
import medicineRoutes from './routes/medicine.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Required for express-rate-limit and req.ip to work correctly behind
// Vercel's (and other) reverse proxies, which set X-Forwarded-For.
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowAllOrigins = env.corsOrigin.includes('*');
app.use(
  cors({
    origin: allowAllOrigins ? true : env.corsOrigin,
    credentials: !allowAllOrigins
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

app.use(
  '/uploads',
  express.static(path.resolve(env.uploadDir), {
    setHeaders: (res) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  })
);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: env.appName,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
