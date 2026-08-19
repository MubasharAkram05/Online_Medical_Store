import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getPool } from '../backend/src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedMedicines = async () => {
  try {
    console.log('🌱 Seeding medicines into database...\n');

    // Read the seed file
    const seedFilePath = join(__dirname, '..', 'database', 'seeds', 'medicines_seed.sql');
    const seedSQL = readFileSync(seedFilePath, 'utf8');

    // Get database connection
    const pool = getPool();
    const connection = await pool.connect();

    // Check if medicines already exist
    const { rows: existing } = await connection.query('SELECT COUNT(*) as count FROM medicines');
    const count = Number(existing[0].count);

    if (count > 0) {
      console.log(`⚠️  Warning: ${count} medicines already exist in the database.`);
      console.log('   Duplicate entries will be skipped.\n');
    }

    // Remove comments and clean up the SQL
    const cleanedSQL = seedSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n')
      .trim();

    // Execute the SQL statement directly
    try {
      const result = await connection.query(cleanedSQL);
      // The seed file runs several statements in one query, so node-postgres
      // hands back an array of results rather than a single one — sum the
      // row counts instead of reading .rowCount off the array (always
      // undefined, which used to report "inserted 0" even on a good run).
      const results = Array.isArray(result) ? result : [result];
      const totalRows = results.reduce((sum, r) => sum + (r?.rowCount || 0), 0);
      console.log(`✅ Successfully inserted ${totalRows} medicine record(s)`);
    } catch (error) {
      // If duplicate entry error, the table might already have some data
      // This is okay - just report it
      if (error.code === '23505') {
        console.log('⚠️  Some medicines already exist in the database.');
        console.log('   This is normal if you\'ve run the seed before.');
      } else {
        console.error('❌ SQL Error:', error.message);
        console.error('   Code:', error.code);
        throw error;
      }
    }

    connection.release();

    // Show final count
    const { rows: final } = await pool.query('SELECT COUNT(*) as count FROM medicines');
    console.log(`\n📊 Total medicines in database: ${final[0].count}`);

    if (Number(final[0].count) === 0) {
      console.log('\n⚠️  No medicines found! The INSERT statement may have failed.');
      console.log('   Check the error message above for details.');
    } else {
      console.log('✅ Medicines seeding completed!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding medicines:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    console.error('\n💡 Make sure:');
    console.error('   1. Your Postgres/Neon database is reachable');
    console.error('   2. DATABASE_URL points at the correct database');
    console.error('   3. Database credentials in .env are correct');
    console.error('   4. Schema has been created (run database/schema.sql first)');
    process.exit(1);
  }
};

seedMedicines();
