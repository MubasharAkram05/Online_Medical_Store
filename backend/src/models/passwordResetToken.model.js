import { getPool } from '../config/database.js';

export const createPasswordResetToken = async ({ userId, tokenHash, expiresAt }) => {
  const [result] = await getPool().query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );

  return result.insertId;
};

export const findValidResetToken = async (tokenHash) => {
  const [rows] = await getPool().query(
    `SELECT prt.*, users.email
     FROM password_reset_tokens prt
     INNER JOIN users ON users.id = prt.user_id
     WHERE prt.token_hash = ?
       AND prt.used = 0
       AND prt.expires_at > NOW()`,
    [tokenHash]
  );

  return rows[0] || null;
};

export const markTokenUsed = async (id) => {
  await getPool().query(
    `UPDATE password_reset_tokens
     SET used = 1
     WHERE id = ?`,
    [id]
  );
};

