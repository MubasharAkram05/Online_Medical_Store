import { getPool } from './src/config/database.js';
import { listMedicines } from './src/models/medicine.model.js';

const checkMedicines = async () => {
  try {
    console.log('🔍 Checking database connection...');
    const pool = getPool();
    await pool.getConnection();
    console.log('✅ Database connected successfully\n');

    console.log('🔍 Checking medicines table...');
    const [tableCheck] = await pool.query(
      `SELECT COUNT(*) as count FROM medicines`
    );
    const count = tableCheck[0].count;
    console.log(`📊 Total medicines in database: ${count}\n`);

    if (count === 0) {
      console.log('⚠️  No medicines found in database!');
      console.log('💡 To add medicines, run:');
      console.log('   mysql -u <user> -p<password> online_medical_store < database/seeds/medicines_seed.sql\n');
    } else {
      console.log('📋 Sample medicines:');
      const medicines = await listMedicines({ limit: 5 });
      medicines.forEach((med, index) => {
        console.log(`   ${index + 1}. ${med.name} - ₹${med.price} (Stock: ${med.stock})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. MySQL server is running');
    console.error('   2. Database "online_medical_store" exists');
    console.error('   3. Database credentials in .env are correct');
    process.exit(1);
  }
};

checkMedicines();



