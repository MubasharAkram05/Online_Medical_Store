import { getPool } from './src/config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const resetMedicines = async () => {
    try {
        const pool = getPool();
        const connection = await pool.connect();

        console.log('🗑️  Clearing existing medicines...');
        await connection.query('DELETE FROM medicines');

        console.log('⏳ Reading new seed data...');
        const seedPath = join(__dirname, '..', 'database', 'seeds', 'medicines_seed.sql');
        const seedSQL = readFileSync(seedPath, 'utf8');

        const cleanedSeedSQL = seedSQL
            .split('\n')
            .filter(line => {
                const trimmed = line.trim();
                return trimmed.length > 0 && !trimmed.startsWith('--');
            })
            .join('\n')
            .trim();

        if (cleanedSeedSQL) {
            console.log('🌱 Seeding updated medicine images...');
            await connection.query(cleanedSeedSQL);
            console.log('✅ Medicines re-seeded successfully!');
        }

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting medicines:', error.message);
        process.exit(1);
    }
};

resetMedicines();
