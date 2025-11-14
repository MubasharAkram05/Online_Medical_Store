import { getPool } from '../config/database.js';

export const createPayment = async (connection, payment) => {
  const [result] = await connection.query(
    `INSERT INTO payments
      (order_id, method, status, amount, transaction_id, reference, receipt_url, captured_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payment.orderId,
      payment.method,
      payment.status,
      payment.amount,
      payment.transactionId || null,
      payment.reference || null,
      payment.receiptUrl || null,
      payment.capturedAt || null
    ]
  );

  return result.insertId;
};

export const getPaymentByOrderId = async (orderId) => {
  const [rows] = await getPool().query(
    `SELECT *
     FROM payments
     WHERE order_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [orderId]
  );

  return rows[0] || null;
};

export const updatePaymentStatusForOrder = async (orderId, status, fallback = {}) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id
     FROM payments
     WHERE order_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [orderId]
  );

  const existing = rows[0];

  if (existing) {
    await pool.query(
      `UPDATE payments
       SET status = ?, captured_at = CASE WHEN ? = 'completed' THEN NOW() ELSE captured_at END
       WHERE id = ?`,
      [status, status, existing.id]
    );
    return existing.id;
  }

  const method = fallback.method || 'cod';
  const amount = fallback.amount || 0;

  const [result] = await pool.query(
    `INSERT INTO payments
      (order_id, method, status, amount)
     VALUES (?, ?, ?, ?)`,
    [orderId, method, status, amount]
  );

  return result.insertId;
};

