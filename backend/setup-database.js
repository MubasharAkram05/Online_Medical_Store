import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'online_medical_store'
};

const setupDatabase = async () => {
    let connection;
    try {
        console.log('🚀 Starting Database Setup...\n');

        // 1. Connect without database first
        connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL server.');

        // 2. Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`✅ Database "${config.database}" ensured.`);

        // 3. Switch to the database
        await connection.query(`USE ${config.database};`);
        console.log(`✅ Switched to database "${config.database}".`);

        // 4. Read and execute schema.sql
        const schemaPath = join(__dirname, '..', 'database', 'schema.sql');
        const schemaSQL = readFileSync(schemaPath, 'utf8');

        console.log('⏳ Executing schema.sql...');
        await connection.query(schemaSQL);
        console.log('✅ Schema created successfully.');

        // 5. Seed medicines (reusing logic from seed-medicines.js but integrated here)
        const seedPath = join(__dirname, '..', 'database', 'seeds', 'medicines_seed.sql');
        const seedSQL = readFileSync(seedPath, 'utf8');

        // Check if medicines exist
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM medicines');
        if (rows[0].count > 0) {
            console.log(`⚠️  Medicines table already has ${rows[0].count} records. Skipping seed.`);
        } else {
            console.log('⏳ Seeding medicines...');
            // Clean SQL (remove comments)
            const cleanedSeedSQL = seedSQL
                .split('\n')
                .filter(line => {
                    const trimmed = line.trim();
                    return trimmed.length > 0 && !trimmed.startsWith('--');
                })
                .join('\n')
                .trim();

            if (cleanedSeedSQL) {
                await connection.query(cleanedSeedSQL);
                console.log('✅ Medicines seeded successfully.');
            }
        }

        console.log('\n✨ Database setup completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Database setup failed:');
        console.error('   Message:', error.message);
        if (error.code) console.error('   Code:', error.code);

        console.log('\n💡 Troubleshooting:');
        console.log('   - Ensure MySQL is running');
        console.log('   - Check DB_USER and DB_PASSWORD in .env');
        console.log('   - Ensure you have permission to create databases');

        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
};

setupDatabase();
