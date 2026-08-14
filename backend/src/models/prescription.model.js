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
  const { rows } = await getPool().query(
    `INSERT INTO prescriptions
      (user_id, medicine_id, file_path, file_original_name, file_mime_type, file_size, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [userId, medicineId || null, filePath, fileOriginalName, fileMimeType, fileSize, notes || null]
  );

  return rows[0].id;
};

export const findPrescriptionById = async (id) => {
  const { rows } = await getPool().query(
    `SELECT *
     FROM prescriptions
     WHERE id = $1`,
    [id]
  );

  return rows[0] || null;
};

export const findPrescriptionWithUserById = async (id) => {
  const { rows } = await getPool().query(
    `SELECT p.*, u.name AS user_name, u.email AS user_email
     FROM prescriptions p
     INNER JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
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
  let query = `SELECT * FROM prescriptions WHERE user_id = $1`;
  const params = [userId];

  if (medicineId) {
    params.push(medicineId);
    query += ` AND medicine_id = $${params.length}`;
  }

  query += ` ORDER BY uploaded_at DESC`;

  const { rows } = await getPool().query(query, params);
  return rows;
};

export const hasAnyPrescription = async (userId) => {
  const { rows } = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM prescriptions
     WHERE user_id = $1
       AND status IN ('pending', 'approved', 'verified')`,
    [userId]
  );

  return rows[0]?.count > 0;
};

export const hasVerifiedPrescription = async (userId) => {
  const { rows } = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM prescriptions
     WHERE user_id = $1
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
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }
  }

  let query = `SELECT p.*, u.name AS user_name, u.email AS user_email
               FROM prescriptions p
               INNER JOIN users u ON u.id = p.user_id`;

  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY p.uploaded_at DESC';

  const { rows } = await getPool().query(query, params);

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
     SET status = $1,
         verified_by = CASE WHEN $2 IN ('approved', 'rejected') THEN $3 ELSE NULL END,
         verified_at = CASE WHEN $2 IN ('approved', 'rejected') THEN NOW() ELSE NULL END,
         notes = COALESCE($4, notes)
     WHERE id = $5`,
    [dbStatus, normalizedStatus, verifiedBy, notes || null, id]
  );
};

export const updatePrescription = async (id, notes) => {
  await getPool().query(
    `UPDATE prescriptions
     SET notes = $1
     WHERE id = $2`,
    [notes || null, id]
  );
};

export const deletePrescription = async (id, userId) => {
  const result = await getPool().query(
    `DELETE FROM prescriptions
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  return result.rowCount > 0;
};

export const findActiveOrderUsageByPrescriptionId = async (prescriptionId, userId) => {
  const { rows } = await getPool().query(
    `SELECT o.id AS order_id,
            o.order_number,
            o.status AS order_status,
            oi.id AS order_item_id,
            oi.prescription_status
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE oi.prescription_id = $1
       AND o.user_id = $2
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

const ACTIVE_ORDER_STATUSES = ['pending', 'pending_prescription', 'confirmed', 'processing', 'shipped'];

export const listPrescriptionsInDateRange = async ({ fromDate, toDate, status = 'all' }) => {
  const normalizedStatus = String(status || 'all').toLowerCase().trim();
  const params = [fromDate, toDate];
  let statusCondition = '';

  if (normalizedStatus === 'approved') {
    statusCondition = " AND p.status IN ('approved', 'verified')";
  } else if (normalizedStatus === 'pending' || normalizedStatus === 'rejected') {
    params.push(normalizedStatus);
    statusCondition = ` AND p.status = $${params.length}`;
  }

  const { rows } = await getPool().query(
    `SELECT p.id, p.status, p.uploaded_at
     FROM prescriptions p
     WHERE p.uploaded_at BETWEEN $1 AND $2
     ${statusCondition}
     ORDER BY p.uploaded_at DESC`,
    params
  );

  return rows;
};

export const findActiveOrderLinksByPrescriptionIds = async (prescriptionIds = []) => {
  if (!Array.isArray(prescriptionIds) || prescriptionIds.length === 0) {
    return [];
  }

  const idPlaceholders = prescriptionIds.map((_, i) => `$${i + 1}`).join(', ');
  const statusPlaceholders = ACTIVE_ORDER_STATUSES
    .map((_, i) => `$${prescriptionIds.length + i + 1}`)
    .join(', ');
  const { rows } = await getPool().query(
    `SELECT DISTINCT oi.prescription_id
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE oi.prescription_id IN (${idPlaceholders})
       AND o.status IN (${statusPlaceholders})`,
    [...prescriptionIds, ...ACTIVE_ORDER_STATUSES]
  );

  return rows.map((row) => Number(row.prescription_id)).filter(Boolean);
};

export const deletePrescriptionsByIds = async (prescriptionIds = []) => {
  if (!Array.isArray(prescriptionIds) || prescriptionIds.length === 0) {
    return 0;
  }

  const placeholders = prescriptionIds.map((_, i) => `$${i + 1}`).join(', ');
  const result = await getPool().query(
    `DELETE FROM prescriptions
     WHERE id IN (${placeholders})`,
    prescriptionIds
  );

  return result.rowCount || 0;
};
