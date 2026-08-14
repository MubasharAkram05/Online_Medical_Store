import dotenv from 'dotenv';

dotenv.config();

const toList = (value, fallback) => {
  if (!value) return fallback;
  return value.split(',').map((item) => item.trim()).filter(Boolean);
};

export const env = {
  port: process.env.PORT || 4000,
  appName: process.env.APP_NAME || 'Online Medical Store API',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration (PostgreSQL — e.g. Neon serverless Postgres)
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT Configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  // Stripe Payment Configuration
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // Email Configuration
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: Number(process.env.EMAIL_PORT || 587),
  emailUser: process.env.EMAIL_USER || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || '',
  emailFromName: process.env.EMAIL_FROM_NAME || 'Online Medical Store',
  emailSecure: process.env.EMAIL_SECURE === 'true',
  
  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // CORS Configuration
  corsOrigin: toList(process.env.CORS_ORIGIN, ['http://localhost:3000']),
  
  // File Upload Configuration
  // Vercel's serverless functions have a read-only filesystem except for /tmp,
  // and /tmp is wiped between invocations, so uploads are not persisted across
  // requests there. Set UPLOAD_DIR to point at external storage in production.
  uploadDir: process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp/uploads' : './uploads'),
  maxFileSize: Number(process.env.MAX_FILE_SIZE || 5242880), // 5MB
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf').split(','),
  
  // Default Admin Configuration
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || '',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || '',
  enableDefaultAdminBootstrap: process.env.ENABLE_DEFAULT_ADMIN_BOOTSTRAP === 'true'
};

