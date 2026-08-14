import { getPool } from './src/config/database.js';

async function findDuplicates() {
    const pool = getPool();
    try {
        const { rows } = await pool.query(`
      SELECT name, manufacturer, COUNT(*) as count, MIN(id) as keep_id
      FROM medicines
      GROUP BY name, manufacturer
      HAVING COUNT(*) > 1
    `);

        console.log('Duplicate products found:');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error finding duplicates:', error);
        process.exit(1);
    }
}

findDuplicates();
