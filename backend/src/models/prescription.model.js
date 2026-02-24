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

export const findPrescriptionWithUserById = async (id) => {
  const [rows] = await getPool().query(
    `SELECT p.*, u.name AS user_name, u.email AS user_email
     FROM prescriptions p
     INNER JOIN users u ON u.id = p.user_id
     WHERE p.id = ?`,
    [id]
  );

  return rows[0] || null;
};

export const normalizeLegacyPrescriptionStatuses = async () => {
  const pool = getPool();

  // Some environments may persist approved records as verified.
  // Keep DB-compatible values and normalize only at API response layer.
  await pool.query(
    `UPDATE prescriptions
     SET status = 'verified'
     WHERE status = 'approved'`
  );

  // Old auto-expired records should remain active.
  // If it was already reviewed (verified_at present), treat as verified; otherwise pending.
  await pool.query(
    `UPDATE prescriptions
     SET status = CASE
       WHEN verified_at IS NOT NULL THEN 'verified'
       ELSE 'pending'
     END
     WHERE status = 'expired'`
  );
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
       AND status IN ('pending', 'approved', 'verified')`,
    [userId]
  );

  return rows[0]?.count > 0;
};

export const hasVerifiedPrescription = async (userId) => {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM prescriptions
     WHERE user_id = ?
       AND status IN ('approved', 'verified')`,
    [userId]
  );

  return rows[0]?.count > 0;
};

export const getAllPrescriptions = async ({ status }) => {
  const conditions = [];
  const params = [];

  if (status && status !== 'all') {
    if (status === 'approved') {
      conditions.push("p.status IN ('approved', 'verified')");
    } else {
      conditions.push('p.status = ?');
      params.push(status);
    }
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
  const normalizedStatus = status === 'verified' ? 'approved' : status;
  const dbStatus = normalizedStatus === 'approved' ? 'verified' : normalizedStatus;

  await getPool().query(
    `UPDATE prescriptions
     SET status = ?,
         verified_by = CASE WHEN ? IN ('approved', 'rejected') THEN ? ELSE NULL END,
         verified_at = CASE WHEN ? IN ('approved', 'rejected') THEN NOW() ELSE NULL END,
         notes = COALESCE(?, notes)
     WHERE id = ?`,
    [dbStatus, normalizedStatus, verifiedBy, normalizedStatus, notes || null, id]
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

export const findActiveOrderUsageByPrescriptionId = async (prescriptionId, userId) => {
  const [rows] = await getPool().query(
    `SELECT o.id AS order_id,
            o.order_number,
            o.status AS order_status,
            oi.id AS order_item_id,
            oi.prescription_status
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE oi.prescription_id = ?
       AND o.user_id = ?
       AND o.status IN ('pending', 'pending_prescription', 'confirmed', 'processing', 'shipped')
     ORDER BY o.updated_at DESC, o.created_at DESC
     LIMIT 1`,
    [prescriptionId, userId]
  );

  return rows[0] || null;
};

export const markPrescriptionAsUsed = async (userId) => {
  // Prescriptions no longer auto-expire.
  return userId;
};
