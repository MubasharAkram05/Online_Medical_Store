import { getPool } from './src/config/database.js';

async function checkReferences() {
    const pool = getPool();
    try {
        const [duplicates] = await pool.query(`
      SELECT m.id, m.name, m.manufacturer
      FROM medicines m
      INNER JOIN (
        SELECT name, manufacturer, MIN(id) as keep_id
        FROM medicines
        GROUP BY name, manufacturer
        HAVING COUNT(*) > 1
      ) d ON m.name = d.name AND (m.manufacturer = d.manufacturer OR (m.manufacturer IS NULL AND d.manufacturer IS NULL))
      WHERE m.id != d.keep_id
    `);

        if (duplicates.length === 0) {
            console.log('No duplicates found.');
            process.exit(0);
        }

        const duplicateIds = duplicates.map(d => d.id);
        const [references] = await pool.query(
            'SELECT medicine_id, COUNT(*) as count FROM order_items WHERE medicine_id IN (?) GROUP BY medicine_id',
            [duplicateIds]
        );

        console.log('Duplicate IDs referenced in order_items:');
        console.log(JSON.stringify(references, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error checking references:', error);
        process.exit(1);
    }
}

checkReferences();
