import { getPool } from '../config/database.js';

export const createPrescription = async ({
  userId,
  medicineId,
  filePath,
  fileOriginalName,
  fileMimeType,
  fileSize,
  notes
}) => {
  const [result] = await getPool().query(
    `INSERT INTO prescriptions
      (user_id, medicine_id, file_path, file_original_name, file_mime_type, file_size, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, medicineId || null, filePath, fileOriginalName, fileMimeType, fileSize, notes || null]
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

export const getPrescriptionsByUser = async (userId, medicineId = null) => {
  let query = `SELECT * FROM prescriptions WHERE user_id = ?`;
  const params = [userId];

  if (medicineId) {
    query += ` AND medicine_id = ?`;
    params.push(medicineId);
  }

  query += ` ORDER BY uploaded_at DESC`;

  const [rows] = await getPool().query(query, params);
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

  return rows.map(row => ({
    ...row,
    file_mime_type: row.file_mime_type || '',
    file_size: row.file_size || 0
  }));
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

export const updatePrescription = async (id, notes) => {
  await getPool().query(
    `UPDATE prescriptions
     SET notes = ?
     WHERE id = ?`,
    [notes || null, id]
  );
};

export const deletePrescription = async (id, userId) => {
  const [result] = await getPool().query(
    `DELETE FROM prescriptions
     WHERE id = ? AND user_id = ?`,
    [id, userId]
  );

  return result.affectedRows > 0;
};

export const markPrescriptionAsUsed = async (userId) => {
  // Mark all verified prescriptions as expired when order is placed
  await getPool().query(
    `UPDATE prescriptions
     SET status = 'expired'
     WHERE user_id = ? 
       AND status IN ('pending', 'verified')
     ORDER BY uploaded_at DESC
     LIMIT 1`,
    [userId]
  );
};

