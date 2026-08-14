import { getPool } from '../config/database.js';

export const findUserByEmail = async (email) => {
  const { rows } = await getPool().query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const { rows } = await getPool().query('SELECT id, name, email, phone, role, profile_pic, is_verified, created_at FROM users WHERE id = $1', [id]);
  return rows[0] || null;
};

export const findUserByPhone = async (phone) => {
  if (!phone) return null;
  const { rows } = await getPool().query('SELECT * FROM users WHERE phone = $1', [phone]);
  return rows[0] || null;
};

export const createUser = async ({ name, email, phone, passwordHash, role }) => {
  const { rows } = await getPool().query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [name, email, phone || null, passwordHash, role || 'patient']
  );

  return {
    id: rows[0].id,
    name,
    email,
    phone,
    role: role || 'patient',
    is_verified: 0
  };
};

export const updateUserPassword = async (userId, passwordHash) => {
  await getPool().query(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, userId]
  );
};

export const updateUserProfile = async (userId, { name, email, phone }) => {
  await getPool().query(
    `UPDATE users
     SET name = $1, email = $2, phone = $3, updated_at = NOW()
     WHERE id = $4`,
    [name, email, phone || null, userId]
  );
};

export const getAllUsers = async () => {
  const { rows } = await getPool().query(
    `SELECT id, name, email, phone, role, profile_pic, is_verified, created_at
     FROM users
     ORDER BY created_at DESC`
  );

  return rows;
};

export const updateUserRole = async (userId, role) => {
  await getPool().query(
    `UPDATE users
     SET role = $1, updated_at = NOW()
     WHERE id = $2`,
    [role, userId]
  );
};

export const updateUserVerification = async (userId, isVerified) => {
  await getPool().query(
    `UPDATE users
     SET is_verified = $1, updated_at = NOW()
     WHERE id = $2`,
    [Boolean(isVerified), userId]
  );
};
export const deleteUser = async (userId) => {
  await getPool().query('DELETE FROM users WHERE id = $1', [userId]);
};

export const updateProfilePic = async (userId, imageUrl) => {
  await getPool().query(
    'UPDATE users SET profile_pic = $1, updated_at = NOW() WHERE id = $2',
    [imageUrl, userId]
  );
};

export const deleteProfilePic = async (userId) => {
  await getPool().query(
    'UPDATE users SET profile_pic = NULL, updated_at = NOW() WHERE id = $1',
    [userId]
  );
};
