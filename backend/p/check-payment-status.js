import pg from 'pg';

const { Pool } = pg;

async function checkPaymentStatus(orderId) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    // Get the latest payment status for a specific order
    const { rows } = await pool.query(
      `SELECT status FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [orderId]
    );

    if (rows.length > 0) {
      console.log(`Payment status for order ${orderId}: ${rows[0].status}`);
    } else {
      console.log(`No payment found for order ${orderId}`);
    }

    // Alternative: Get payment status as part of order query
    const { rows: orderRows } = await pool.query(
      `SELECT
        o.id,
        o.order_number,
        o.status AS order_status,
        (
          SELECT status
          FROM payments
          WHERE order_id = o.id
          ORDER BY created_at DESC
          LIMIT 1
        ) AS payment_status
       FROM orders o
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRows.length > 0) {
      const order = orderRows[0];
      console.log(`Order ${order.order_number}: Order Status = ${order.order_status}, Payment Status = ${order.payment_status || 'No payment'}`);
    } else {
      console.log(`Order ${orderId} not found`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Usage: node check-payment-status.js <orderId>
const orderId = process.argv[2];
if (!orderId) {
  console.log('Usage: node check-payment-status.js <orderId>');
  process.exit(1);
}

checkPaymentStatus(parseInt(orderId));
