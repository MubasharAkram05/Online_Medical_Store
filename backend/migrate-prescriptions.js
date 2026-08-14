import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function migrate() {
    let client;
    try {
        client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();

        console.log('✅ Connected to database.');

        // Check existing columns
        const { rows: columns } = await client.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items'`
        );
        const columnNames = columns.map(c => c.column_name);

        const queries = [];

        if (!columnNames.includes('prescription_id')) {
            queries.push(`ALTER TABLE order_items ADD COLUMN prescription_id BIGINT NULL`);
            queries.push(`ALTER TABLE order_items ADD CONSTRAINT fk_order_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)`);
            console.log('➕ Adding prescription_id to order_items');
        }

        if (!columnNames.includes('prescription_status')) {
            queries.push(`ALTER TABLE order_items ADD COLUMN prescription_status TEXT DEFAULT 'pending' CHECK (prescription_status IN ('pending', 'approved', 'declined', 'expired'))`);
            console.log('➕ Adding prescription_status to order_items');
        }

        if (!columnNames.includes('prescription_notes')) {
            queries.push(`ALTER TABLE order_items ADD COLUMN prescription_notes TEXT NULL`);
            console.log('➕ Adding prescription_notes to order_items');
        }

        if (!columnNames.includes('prescription_verified_by')) {
            queries.push(`ALTER TABLE order_items ADD COLUMN prescription_verified_by BIGINT NULL`);
            queries.push(`ALTER TABLE order_items ADD CONSTRAINT fk_order_items_verified_by FOREIGN KEY (prescription_verified_by) REFERENCES users(id)`);
            console.log('➕ Adding prescription_verified_by to order_items');
        }

        if (!columnNames.includes('prescription_verified_at')) {
            queries.push(`ALTER TABLE order_items ADD COLUMN prescription_verified_at TIMESTAMP NULL DEFAULT NULL`);
            console.log('➕ Adding prescription_verified_at to order_items');
        }

        if (queries.length > 0) {
            for (const query of queries) {
                await client.query(query);
            }
            console.log('✅ order_items columns updated.');
        }

        // Update orders status check constraint
        console.log('⏳ Updating orders status constraint...');
        await client.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check`);
        await client.query(
            `ALTER TABLE orders ADD CONSTRAINT orders_status_check
             CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'pending_prescription'))`
        );
        console.log('✅ orders status constraint updated.');

        console.log('🚀 Migration completed successfully.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        if (client) await client.end();
    }
}

migrate();
