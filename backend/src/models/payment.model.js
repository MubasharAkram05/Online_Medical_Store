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

