import pg from 'pg';

const { Client } = pg;

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Altering status constraint...');
  await client.query('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check');
  await client.query(
    `ALTER TABLE payments ADD CONSTRAINT payments_status_check
     CHECK (status IN ('pending','completed','failed','refunded','rejected'))`
  );
  await client.query("ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending'");
  const { rows: cols } = await client.query(
    `SELECT column_name, data_type, column_default
     FROM information_schema.columns
     WHERE table_name = 'payments' AND column_name = 'status'`
  );
  console.log('Column', cols);
  await client.query('UPDATE payments SET status = $1 WHERE id = $2', ['rejected', 43]);
  const { rows: row } = await client.query('SELECT id,status FROM payments WHERE id = $1', [43]);
  console.log('Row after update', row);
  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });
