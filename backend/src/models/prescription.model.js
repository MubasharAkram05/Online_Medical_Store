import { getPool } from '../config/database.js';

export const createPrescription = async ({
  userId,
  filePath,
  fileOriginalName,
  fileMimeType,
  fileSize,
  notes
}) => {
  const [result] = await getPool().query(
    `INSERT INTO prescriptions
      (user_id, file_path, file_original_name, file_mime_type, file_size, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, filePath, fileOriginalName, fileMimeType, fileSize, notes || null]
  );

  return result.insertId;
};

export const findPrescriptionById = async (id) => {
  const [rows] = await getPool().query(
    `SELECT *
     FROM prescriptions
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
};

export const getPrescriptionsByUser = async (userId) => {
  const [rows] = await getPool().query(
    `SELECT *
     FROM prescriptions
     WHERE user_id = ?
     ORDER BY uploaded_at DESC`,
    [userId]
  );

  return rows;
};

export const hasAnyPrescription = async (userId) => {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM prescriptions
     WHERE user_id = ?
       AND status IN ('pending', 'verified')`,
    [userId]
  );

  return rows[0]?.count > 0;
};

export const hasVerifiedPrescription = async (userId) => {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM prescriptions
     WHERE user_id = ?
       AND status = 'verified'`,
    [userId]
  );

  return rows[0]?.count > 0;
};

export const getAllPrescriptions = async ({ status }) => {
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }

  let query = `SELECT p.*, u.name AS user_name, u.email AS user_email
               FROM prescriptions p
               INNER JOIN users u ON u.id = p.user_id`;

  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY p.uploaded_at DESC';

  const [rows] = await getPool().query(query, params);

  return rows;
};

export const updatePrescriptionStatus = async (id, status, verifiedBy, notes) => {
  await getPool().query(
    `UPDATE prescriptions
     SET status = ?,
         verified_by = ?,
         verified_at = CASE WHEN ? IN ('verified', 'rejected') THEN NOW() ELSE verified_at END,
         notes = COALESCE(?, notes)
     WHERE id = ?`,
    [status, verifiedBy, status, notes || null, id]
  );
};

