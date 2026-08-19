import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getPool } from '../backend/src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedMoreMedicines = async () => {
  try {
    console.log('🌱 Seeding additional medicines (20 per category) into database...\n');

    const seedFilePath = join(__dirname, '..', 'database', 'seeds', 'medicines_seed_more.sql');
    const seedSQL = readFileSync(seedFilePath, 'utf8');

    const pool = getPool();
    const connection = await pool.connect();

    const cleanedSQL = seedSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n')
      .trim();

    const result = await connection.query(cleanedSQL);
    const totalRows = result.rowCount || 0;
    console.log(`✅ Successfully inserted ${totalRows} additional medicine record(s)`);

    connection.release();

    const { rows: final } = await pool.query('SELECT COUNT(*) as count FROM medicines');
    console.log(`\n📊 Total medicines in database: ${final[0].count}`);
    console.log('✅ Additional medicines seeding completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding additional medicines:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    console.error('\n💡 Make sure:');
    console.error('   1. Your Postgres/Neon database is reachable');
    console.error('   2. DATABASE_URL points at the correct database');
    console.error('   3. database/seeds/medicines_seed.sql has already been run once');
    process.exit(1);
  }
};

seedMoreMedicines();
