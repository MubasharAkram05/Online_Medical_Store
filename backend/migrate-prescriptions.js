import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'online_medical_store'
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection({
            ...config,
            multipleStatements: true
        });

        console.log('✅ Connected to database.');

        // Check existing columns
        const [columns] = await connection.query(`SHOW COLUMNS FROM order_items`);
        const columnNames = columns.map(c => c.Field);

        const queries = [];

        if (!columnNames.includes('prescription_id')) {
            queries.push(`ALTER TABLE order_items ADD COLUMN prescription_id BIGINT NULL AFTER total_price`);
            queries.push(`ALTER TABLE order_items ADD CONSTRAINT fk_order_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)`);
            console.log('➕ Adding prescription_id to order_items');
        }

        if (!columnNames.includes('prescription_status')) {
            queries.push(`ALTER TABLE order_items ADD COLUMN prescription_status ENUM('pending', 'approved', 'declined', 'expired') DEFAULT 'pending' AFTER prescription_id`);
            console.log('➕ Adding prescription_status to order_items');
        }

        if (!columnNames.includes('prescription_notes')) {
            queries.push(`ALTER TABLE order_items ADD COLUMN prescription_notes TEXT NULL AFTER prescription_status`);
            console.log('➕ Adding prescription_notes to order_items');
        }

        if (!columnNames.includes('prescription_verified_by')) {
            queries.push(`ALTER TABLE order_items ADD COLUMN prescription_verified_by BIGINT NULL AFTER prescription_notes`);
            queries.push(`ALTER TABLE order_items ADD CONSTRAINT fk_order_items_verified_by FOREIGN KEY (prescription_verified_by) REFERENCES users(id)`);
            console.log('➕ Adding prescription_verified_by to order_items');
        }

        if (!columnNames.includes('prescription_verified_at')) {
            queries.push(`ALTER TABLE order_items ADD COLUMN prescription_verified_at TIMESTAMP NULL DEFAULT NULL AFTER prescription_verified_by`);
            console.log('➕ Adding prescription_verified_at to order_items');
        }

        if (queries.length > 0) {
            for (const query of queries) {
                await connection.query(query);
            }
            console.log('✅ order_items columns updated.');
        }

        // Update orders status enum
        console.log('⏳ Updating orders status enum...');
        await connection.query(`ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'pending_prescription') DEFAULT 'pending'`);
        console.log('✅ orders status enum updated.');

        console.log('🚀 Migration completed successfully.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
