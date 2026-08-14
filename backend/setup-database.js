import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '..', 'backend', '.env') });

const databaseUrl = process.env.DATABASE_URL;

const setupDatabase = async () => {
    let client;
    try {
        console.log('🚀 Starting Database Setup...\n');

        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not set. Point it at your Neon (or other Postgres) connection string.');
        }

        // 1. Connect to the database (Neon databases are created via the
        // Neon dashboard/API, not from application code, so DATABASE_URL
        // must already point at an existing database).
        client = new Client({
            connectionString: databaseUrl,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();

        console.log('✅ Connected to PostgreSQL server.');

        // 2. Read and execute schema.sql
        const schemaPath = join(__dirname, '..', 'database', 'schema.sql');
        const schemaSQL = readFileSync(schemaPath, 'utf8');

        console.log('⏳ Executing schema.sql...');
        await client.query(schemaSQL);
        console.log('✅ Schema created successfully.');

        // 3. Seed medicines (reusing logic from seed-medicines.js but integrated here)
        const seedPath = join(__dirname, '..', 'database', 'seeds', 'medicines_seed.sql');
        const seedSQL = readFileSync(seedPath, 'utf8');

        // Check if medicines exist
        const { rows } = await client.query('SELECT COUNT(*) as count FROM medicines');
        if (Number(rows[0].count) > 0) {
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
                await client.query(cleanedSeedSQL);
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
        console.log('   - Ensure DATABASE_URL points at a reachable Postgres/Neon instance');
        console.log('   - Check that the database in DATABASE_URL already exists');
        console.log('   - Ensure your Neon role has permission to create tables');

        process.exit(1);
    } finally {
        if (client) await client.end();
    }
};

setupDatabase();
