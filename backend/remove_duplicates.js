import { getPool } from './src/config/database.js';

async function removeDuplicates() {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        console.log('Starting duplicate removal process...');

        // 1. Identify duplicates
        const [duplicates] = await connection.query(`
      SELECT name, manufacturer, MIN(id) as keep_id, COUNT(*) as count
      FROM medicines
      GROUP BY name, manufacturer
      HAVING count > 1
    `);

        console.log(`Found ${duplicates.length} duplicate sets.`);

        for (const dup of duplicates) {
            console.log(`Merging: "${dup.name}" (${dup.manufacturer || 'Generic'}). Keeping ID: ${dup.keep_id}`);

            // Find all other IDs for this name/manufacturer
            const [otherRows] = await connection.query(
                'SELECT id FROM medicines WHERE name = ? AND (manufacturer = ? OR (manufacturer IS NULL AND ? IS NULL)) AND id != ?',
                [dup.name, dup.manufacturer, dup.manufacturer, dup.keep_id]
            );
            const otherIds = otherRows.map(r => r.id);

            if (otherIds.length > 0) {
                // 2. Re-point references in order_items
                const [orderUpdate] = await connection.query(
                    'UPDATE order_items SET medicine_id = ? WHERE medicine_id IN (?)',
                    [dup.keep_id, otherIds]
                );
                if (orderUpdate.affectedRows > 0) {
                    console.log(`  Updated ${orderUpdate.affectedRows} rows in order_items.`);
                }

                // 3. Re-point references in medicine_interactions (medicine_id)
                const [intUpdate1] = await connection.query(
                    'UPDATE medicine_interactions SET medicine_id = ? WHERE medicine_id IN (?)',
                    [dup.keep_id, otherIds]
                );
                if (intUpdate1.affectedRows > 0) {
                    console.log(`  Updated ${intUpdate1.affectedRows} rows in medicine_interactions (medicine_id).`);
                }

                // 4. Re-point references in medicine_interactions (interacts_with_id)
                const [intUpdate2] = await connection.query(
                    'UPDATE medicine_interactions SET interacts_with_id = ? WHERE interacts_with_id IN (?)',
                    [dup.keep_id, otherIds]
                );
                if (intUpdate2.affectedRows > 0) {
                    console.log(`  Updated ${intUpdate2.affectedRows} rows in medicine_interactions (interacts_with_id).`);
                }

                // 5. Delete duplicates
                const [deleteResult] = await connection.query(
                    'DELETE FROM medicines WHERE id IN (?)',
                    [otherIds]
                );
                console.log(`  Deleted ${deleteResult.affectedRows} duplicate medicine records.`);
            }
        }

        // 6. Final re-sequencing of sort_order to ensure no gaps
        console.log('Re-sequencing sort_order...');
        const [allMedicines] = await connection.query('SELECT id FROM medicines ORDER BY sort_order ASC, created_at DESC');
        for (let i = 0; i < allMedicines.length; i++) {
            await connection.query('UPDATE medicines SET sort_order = ? WHERE id = ?', [i + 1, allMedicines[i].id]);
        }

        await connection.commit();
        console.log('Duplicate removal and re-sequencing complete.');
        process.exit(0);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error during duplicate removal:', error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
}

removeDuplicates();
