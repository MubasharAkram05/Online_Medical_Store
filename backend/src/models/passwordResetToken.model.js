import { getPool } from '../config/database.js';

export const createPasswordResetToken = async ({ userId, tokenHash, expiresAt }) => {
  const { rows } = await getPool().query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, tokenHash, expiresAt]
  );

  return rows[0].id;
};

export const findValidResetToken = async (tokenHash) => {
  const { rows } = await getPool().query(
    `SELECT prt.*, users.email
     FROM password_reset_tokens prt
     INNER JOIN users ON users.id = prt.user_id
     WHERE prt.token_hash = $1
       AND prt.used = false
       AND prt.expires_at > NOW()`,
    [tokenHash]
  );

  return rows[0] || null;
};

export const markTokenUsed = async (id) => {
  await getPool().query(
    `UPDATE password_reset_tokens
     SET used = true
     WHERE id = $1`,
    [id]
  );
};
