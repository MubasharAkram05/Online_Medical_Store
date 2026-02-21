const mysql = require('mysql2/promise');

async function debug() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'online_medical_store',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('--- Running Migration ---');
        try {
            await pool.query('ALTER TABLE order_items ADD COLUMN prescription_id BIGINT NULL');
            await pool.query('ALTER TABLE order_items ADD CONSTRAINT fk_order_items_prescriptions FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)');
            console.log('Order Items migration successful.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('prescription_id column already exists.');
            } else {
                console.error('Order Items migration error:', e);
            }
        }

        console.log('--- Running Prescriptions Migration ---');
        try {
            await pool.query('ALTER TABLE prescriptions ADD COLUMN medicine_id BIGINT NULL');
            await pool.query('ALTER TABLE prescriptions ADD CONSTRAINT fk_prescriptions_medicines FOREIGN KEY (medicine_id) REFERENCES medicines(id)');
            console.log('Prescriptions migration successful.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('medicine_id column already exists.');
            } else {
                console.error('Prescriptions migration error:', e);
            }
        }

        const [rows] = await pool.query('SELECT id, status, file_original_name, uploaded_at FROM prescriptions ORDER BY uploaded_at DESC LIMIT 10');
        console.log('--- Recent Prescriptions ---');
        console.table(rows);

        const [orderItems] = await pool.query('SELECT oi.id, oi.order_id, oi.medicine_id, oi.prescription_id, m.name FROM order_items oi JOIN medicines m ON m.id = oi.medicine_id ORDER BY oi.id DESC LIMIT 10');
        console.log('\n--- Recent Order Items with Prescriptions ---');
        console.table(orderItems);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

debug();
