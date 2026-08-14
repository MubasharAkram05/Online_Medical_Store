import serverless from 'serverless-http';
import app from '../src/app.js';
import { testConnection } from '../src/config/database.js';
import { ensureDefaultAdmin } from '../src/utils/bootstrapAdmin.js';
import { logger } from '../src/utils/logger.js';

// Vercel functions run in a stateless, cold-start environment: the module
// scope persists only across warm invocations, so this connects/bootstraps
// once per warm container instead of once per request.
let initPromise = null;

const ensureInitialized = () => {
  if (!initPromise) {
    initPromise = (async () => {
      await testConnection();
      await ensureDefaultAdmin();
    })().catch((error) => {
      // Allow initialization to be retried on the next invocation instead of
      // permanently wedging the container on a transient failure.
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
};

const handler = serverless(app);

export default async function (req, res) {
  try {
    await ensureInitialized();
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize backend');
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { message: 'Service unavailable' } }));
    return;
  }

  return handler(req, res);
}
