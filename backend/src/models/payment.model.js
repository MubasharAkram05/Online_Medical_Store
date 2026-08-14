import { getPool } from '../config/database.js';

export const createPayment = async (connection, payment) => {
  const { rows } = await connection.query(
    `INSERT INTO payments
      (order_id, method, status, amount, transaction_id, reference, receipt_url, captured_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
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

  return rows[0].id;
};

export const getPaymentByOrderId = async (orderId) => {
  const { rows } = await getPool().query(
    `SELECT *
     FROM payments
     WHERE order_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [orderId]
  );

  return rows[0] || null;
};

export const updatePaymentStatusForOrder = async (orderId, status, fallback = {}) => {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id
     FROM payments
     WHERE order_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [orderId]
  );

  const existing = rows[0];

  if (existing) {
    await pool.query(
      `UPDATE payments
       SET status = $1, captured_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE captured_at END
       WHERE id = $2`,
      [status, existing.id]
    );
    return existing.id;
  }

  const method = fallback.method || 'cod';
  const amount = fallback.amount || 0;

  const { rows: inserted } = await pool.query(
    `INSERT INTO payments
      (order_id, method, status, amount)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [orderId, method, status, amount]
  );

  return inserted[0].id;
};

export const updatePaymentProof = async (orderId, receiptUrl) => {
  const result = await getPool().query(
    `UPDATE payments
     SET receipt_url = $1, status = 'pending'
     WHERE id = (
       SELECT id FROM payments WHERE order_id = $2 ORDER BY created_at DESC LIMIT 1
     )`,
    [receiptUrl, orderId]
  );
  return result.rowCount > 0;
};

export const approvePayment = async (orderId, adminId) => {
  const updated = await updatePaymentStatusForOrder(orderId, 'completed', { method: 'card', amount: 0 });
  console.log(`[approvePayment] order ${orderId} updated: ${updated}`);
  return updated;
};

export const rejectPayment = async (orderId, adminId) => {
  console.log(`[rejectPayment] Starting rejection for order ${orderId}`);
  const updated = await updatePaymentStatusForOrder(orderId, 'rejected', {
    method: 'bank',
    amount: 0
  });
  console.log(`[rejectPayment] order ${orderId} updated: ${updated}`);

  // Verify the update
  const { rows: verify } = await getPool().query(
    `SELECT id, order_id, status FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  );
  console.log(`[rejectPayment] Verification query returned:`, verify[0]);

  return updated;
};
