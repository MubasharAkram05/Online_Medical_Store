import mysql from 'mysql2/promise';
import { env } from './env.js';

let pool;

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  return pool;
};

export const testConnection = async () => {
  const connection = await getPool().getConnection();
  await connection.ping();
  connection.release();
};

