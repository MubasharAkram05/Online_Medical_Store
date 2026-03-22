import mysql from 'mysql2/promise';

const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'online_medical_store'
};

async function run() {
  const conn = await mysql.createConnection(config);
  console.log('Altering enum...');
  await conn.query("ALTER TABLE payments MODIFY status ENUM('pending','completed','failed','refunded','rejected') DEFAULT 'pending'");
  const [cols] = await conn.query("SHOW COLUMNS FROM payments LIKE 'status'");
  console.log('Column', cols);
  await conn.query('UPDATE payments SET status = ? WHERE id = ?', ['rejected', 43]);
  const [row] = await conn.query('SELECT id,status FROM payments WHERE id = ?', [43]);
  console.log('Row after update', row);
  await conn.end();
}

run().catch(err => { console.error(err); process.exit(1);} );