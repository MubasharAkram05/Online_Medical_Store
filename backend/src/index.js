import app from './app.js';
import { env } from './config/env.js';
import { testConnection } from './config/database.js';
import { logger } from './utils/logger.js';
import { ensureDefaultAdmin } from './utils/bootstrapAdmin.js';

const start = async () => {
  try {
    await testConnection();
    logger.info('Database connected successfully');

    await ensureDefaultAdmin();

    app.listen(env.port, () => {
      logger.info(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

start();

