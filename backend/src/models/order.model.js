import { getPool } from '../config/database.js';
import { getPaymentByOrderId } from './payment.model.js';

export const createOrder = async (connection, orderData) => {
  const [result] = await connection.query(
    `INSERT INTO orders
      (user_id, order_number, status, priority, payment_method, subtotal_amount, tax_amount,
       shipping_fee, total_amount, prescription_verified, full_name, email, phone,
       address, city, postal_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderData.userId,
      orderData.orderNumber,
      orderData.status || 'pending',
      orderData.priority || 'normal',
      orderData.paymentMethod,
      orderData.subtotal,
      orderData.tax,
      orderData.shipping,
      orderData.total,
      orderData.prescriptionVerified ? 1 : 0,
      orderData.fullName,
      orderData.email,
      orderData.phone,
      orderData.address,
      orderData.city,
      orderData.postalCode
    ]
  );

  return result.insertId;
};

export const createOrderItems = async (connection, orderId, items) => {
  const values = items.map((item) => [
    orderId,
    item.medicineId,
    item.quantity,
    item.unitPrice,
    item.totalPrice,
    item.prescriptionId || null
  ]);

  await connection.query(
    `INSERT INTO order_items
      (order_id, medicine_id, quantity, unit_price, total_price, prescription_id)
     VALUES ?`,
    [values]
  );
};

export const getOrdersByUser = async (userId) => {
  const [rows] = await getPool().query(
    `SELECT o.*,
            (
              SELECT status
              FROM payments
              WHERE order_id = o.id
              ORDER BY created_at DESC
              LIMIT 1
            ) AS payment_status,
            (
              SELECT COUNT(*) > 0
              FROM order_items oi
              JOIN medicines m ON oi.medicine_id = m.id
              WHERE oi.order_id = o.id AND m.requires_prescription = 1
            ) AS has_prescription_required
     FROM orders o
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );

  // Log payment_status for debugging
  rows.forEach(row => {
    if (row.payment_status) {
      console.log(`[getOrdersByUser] Order ${row.id}: payment_status = ${row.payment_status}`);
    }
  });

  return rows;
};

export const getOrderWithItems = async (userId, orderId) => {
  const [orders] = await getPool().query(
    `SELECT *
     FROM orders
     WHERE id = ? AND user_id = ?`,
    [orderId, userId]
  );

  const order = orders[0];
  if (!order) return null;

  const [items] = await getPool().query(
    `SELECT oi.*, m.name, m.image_url, m.requires_prescription, p.file_path AS prescription_path, p.file_original_name AS prescription_name, p.file_mime_type
     FROM order_items oi
     INNER JOIN medicines m ON m.id = oi.medicine_id
     LEFT JOIN prescriptions p ON p.id = oi.prescription_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  const payment = await getPaymentByOrderId(orderId);

  return { order, items, payment };
};

export const getOrderWithItemsAdmin = async (orderId) => {
  const [orders] = await getPool().query(
    `SELECT o.*,
            u.name AS customer_name,
            u.email AS customer_email,
            u.phone AS customer_phone,
            (
              SELECT status
              FROM payments
              WHERE order_id = o.id
              ORDER BY created_at DESC
              LIMIT 1
            ) AS payment_status
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [orderId]
  );

  const order = orders[0];
  if (!order) return null;

  const [items] = await getPool().query(
    `SELECT oi.*, m.name, m.image_url, m.requires_prescription, p.file_path AS prescription_path, p.file_original_name AS prescription_name, p.file_mime_type, p.uploaded_at
     FROM order_items oi
     INNER JOIN medicines m ON m.id = oi.medicine_id
     LEFT JOIN prescriptions p ON p.id = oi.prescription_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  const payment = await getPaymentByOrderId(orderId);

  return { order, items, payment };
};

export const getAllOrders = async () => {
  const [rows] = await getPool().query(
    `SELECT o.*,
            u.name AS customer_name,
            u.email AS customer_email,
            u.phone AS customer_phone,
            (
              SELECT status
              FROM payments
              WHERE order_id = o.id
              ORDER BY created_at DESC
              LIMIT 1
            ) AS payment_status
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );

  return rows;
};

export const updateOrderStatus = async (orderId, status) => {
  await getPool().query(
    `UPDATE orders
     SET status = ?, updated_at = NOW()
     WHERE id = ?`,
    [status, orderId]
  );
};

export const getSalesReport = async ({ days = 7 }) => {
  const [rows] = await getPool().query(
    `SELECT DATE(created_at) AS date,
            COUNT(*) AS orders,
            SUM(total_amount) AS revenue
     FROM orders
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(created_at)
     ORDER BY DATE(created_at) ASC`,
    [days]
  );

  return rows;
};

export const getOrderItemsForUpdate = async (orderId) => {
  const [rows] = await getPool().query(
    `SELECT oi.*, m.stock AS medicine_stock
     FROM order_items oi
     INNER JOIN medicines m ON m.id = oi.medicine_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  return rows;
};

export const updateOrderItemQuantity = async (orderItemId, quantity) => {
  await getPool().query(
    `UPDATE order_items
     SET quantity = ?, total_price = unit_price * ?
     WHERE id = ?`,
    [quantity, quantity, orderItemId]
  );
};

export const updateOrderFields = async (orderId, fields) => {
  const updates = [];
  const values = [];

  if (fields.priority) {
    updates.push('priority = ?');
    values.push(fields.priority);
  }
  if (fields.address) {
    updates.push('address = ?');
    values.push(fields.address);
  }
  if (fields.city) {
    updates.push('city = ?');
    values.push(fields.city);
  }
  if (fields.postalCode) {
    updates.push('postal_code = ?');
    values.push(fields.postalCode);
  }

  if (!updates.length) return;

  updates.push('updated_at = NOW()');
  values.push(orderId);

  await getPool().query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, values);
};

export const recalculateOrderTotals = async (orderId) => {
  const pool = getPool();
  const [[{ subtotal }]] = await pool.query(
    `SELECT IFNULL(SUM(total_price), 0) AS subtotal
     FROM order_items
     WHERE order_id = ?`,
    [orderId]
  );

  const [[order]] = await pool.query(
    `SELECT tax_amount, shipping_fee
     FROM orders
     WHERE id = ?`,
    [orderId]
  );

  const total = Number(subtotal || 0) + Number(order.tax_amount || 0) + Number(order.shipping_fee || 0);

  await pool.query(
    `UPDATE orders
     SET subtotal_amount = ?, total_amount = ?
     WHERE id = ?`,
    [subtotal || 0, total, orderId]
  );

  return { subtotal: subtotal || 0, total };
};

