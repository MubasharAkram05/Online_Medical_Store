import { getPool } from '../config/database.js';

export const findUserByEmail = async (email) => {
  const [rows] = await getPool().query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const [rows] = await getPool().query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
};

export const findUserByPhone = async (phone) => {
  if (!phone) return null;
  const [rows] = await getPool().query('SELECT * FROM users WHERE phone = ?', [phone]);
  return rows[0] || null;
};

export const createUser = async ({ name, email, phone, passwordHash, role }) => {
  const [result] = await getPool().query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, phone || null, passwordHash, role || 'patient']
  );

  return {
    id: result.insertId,
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
     SET password_hash = ?, updated_at = NOW()
     WHERE id = ?`,
    [passwordHash, userId]
  );
};

export const updateUserProfile = async (userId, { name, email, phone }) => {
  await getPool().query(
    `UPDATE users
     SET name = ?, email = ?, phone = ?, updated_at = NOW()
     WHERE id = ?`,
    [name, email, phone || null, userId]
  );
};

export const getAllUsers = async () => {
  const [rows] = await getPool().query(
    `SELECT id, name, email, phone, role, is_verified, created_at
     FROM users
     ORDER BY created_at DESC`
  );

  return rows;
};

export const updateUserRole = async (userId, role) => {
  await getPool().query(
    `UPDATE users
     SET role = ?, updated_at = NOW()
     WHERE id = ?`,
    [role, userId]
  );
};

export const updateUserVerification = async (userId, isVerified) => {
  await getPool().query(
    `UPDATE users
     SET is_verified = ?, updated_at = NOW()
     WHERE id = ?`,
    [isVerified ? 1 : 0, userId]
  );
};

