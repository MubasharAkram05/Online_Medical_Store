import pg from 'pg';
import { env } from './env.js';

const { Pool, types } = pg;

// node-postgres returns BIGINT (OID 20) as strings by default to avoid
// precision loss on values outside the safe integer range. This app's IDs
// never approach that range and are compared/serialized as numbers
// throughout, so parse them as numbers here rather than at every call site.
types.setTypeParser(20, (value) => (value === null ? null : parseInt(value, 10)));

let pool;

export const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      connectionTimeoutMillis: 10000,
      ssl: {
        rejectUnauthorized: false
      },
      connectTimeout: 10000
    });
  }

  return pool;
};

export const testConnection = async () => {
  const client = await getPool().connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
};
