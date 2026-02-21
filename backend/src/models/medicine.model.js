import { getPool } from '../config/database.js';

export const findMedicinesByIds = async (ids) => {
  if (!ids.length) return [];

  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await getPool().query(
    `SELECT m.*, s.name AS supplier_name
     FROM medicines m
     LEFT JOIN suppliers s ON s.id = m.supplier_id
     WHERE m.id IN (${placeholders})`,
    ids
  );

  return rows;
};

export const decrementMedicineStock = async (connection, items) => {
  for (const item of items) {
    await connection.query(
      `UPDATE medicines
       SET stock = stock - ?
       WHERE id = ?`,
      [item.quantity, item.medicineId]
    );
  }
};

export const adjustMedicineStock = async (id, delta) => {
  await getPool().query(
    `UPDATE medicines
     SET stock = GREATEST(stock + ?, 0),
         updated_at = NOW()
     WHERE id = ?`,
    [delta, id]
  );
};

export const getMedicineById = async (id) => {
  const [rows] = await getPool().query(
    `SELECT m.*, s.name AS supplier_name
     FROM medicines m
     LEFT JOIN suppliers s ON s.id = m.supplier_id
     WHERE m.id = ?`,
    [id]
  );

  return rows[0] || null;
};

export const listMedicines = async ({ search, category, limit }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(m.name LIKE ? OR m.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    conditions.push('m.category = ?');
    params.push(category);
  }

  let query = `SELECT m.*, s.name AS supplier_name, m.manufacturer
               FROM medicines m
               LEFT JOIN suppliers s ON s.id = m.supplier_id`;
  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY m.sort_order ASC, m.created_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(Number(limit));
  }

  const [rows] = await getPool().query(query, params);
  return rows;
};

export const createMedicine = async ({
  name,
  description,
  price,
  stock,
  requiresPrescription,
  imageUrl,
  category,
  expiryDate,
  manufacturingDate,
  supplierId,
  dosageInstructions,
  sideEffects,
  manufacturer,
  interactionNotes
}) => {
  const [maxOrderResult] = await getPool().query('SELECT IFNULL(MAX(sort_order), 0) AS maxOrder FROM medicines');
  const nextOrder = maxOrderResult[0].maxOrder + 1;

  const [result] = await getPool().query(
    `INSERT INTO medicines
      (name, description, price, stock, requires_prescription, image_url, manufacturer, category, expiry_date, manufacturing_date, supplier_id, dosage_instructions, side_effects, interactions, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      description || null,
      price,
      stock ?? 0,
      requiresPrescription ? 1 : 0,
      imageUrl || null,
      manufacturer || null,
      category || null,
      expiryDate || null,
      manufacturingDate || null,
      supplierId || null,
      dosageInstructions || null,
      sideEffects || null,
      interactionNotes ? JSON.stringify(interactionNotes) : null,
      nextOrder
    ]
  );

  return result.insertId;
};

export const updateMedicine = async (
  id,
  {
    name,
    description,
    price,
    stock,
    requiresPrescription,
    imageUrl,
    category,
    expiryDate,
    manufacturingDate,
    supplierId,
    dosageInstructions,
    sideEffects,
    manufacturer,
    interactionNotes
  }
) => {
  await getPool().query(
    `UPDATE medicines
     SET name = ?,
         description = ?,
         price = ?,
         stock = ?,
         requires_prescription = ?,
         image_url = ?,
         manufacturer = ?,
         category = ?,
         expiry_date = ?,
         manufacturing_date = ?,
         supplier_id = ?,
         dosage_instructions = ?,
         side_effects = ?,
         interactions = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [
      name,
      description || null,
      price,
      stock ?? 0,
      requiresPrescription ? 1 : 0,
      imageUrl || null,
      manufacturer || null,
      category || null,
      expiryDate || null,
      manufacturingDate || null,
      supplierId || null,
      dosageInstructions || null,
      sideEffects || null,
      interactionNotes ? JSON.stringify(interactionNotes) : null,
      id
    ]
  );
};

export const deleteMedicine = async (id) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get the sort_order of the medicine being deleted
    const [medicine] = await connection.query('SELECT sort_order FROM medicines WHERE id = ?', [id]);

    if (medicine && medicine.length > 0) {
      const deletedOrder = medicine[0].sort_order;

      // Delete the medicine
      await connection.query('DELETE FROM medicines WHERE id = ?', [id]);

      // Shift back all products after this specific position
      await connection.query(
        'UPDATE medicines SET sort_order = sort_order - 1 WHERE sort_order > ?',
        [deletedOrder]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const findLowStockMedicines = async (threshold = 10) => {
  const [rows] = await getPool().query(
    `SELECT m.*, s.name AS supplier_name
     FROM medicines m
     LEFT JOIN suppliers s ON s.id = m.supplier_id
     WHERE m.stock <= ?
     ORDER BY m.stock ASC`,
    [threshold]
  );

  return rows;
};

export const findExpiringMedicines = async (days = 30) => {
  const [rows] = await getPool().query(
    `SELECT m.*, s.name AS supplier_name
     FROM medicines m
     LEFT JOIN suppliers s ON s.id = m.supplier_id
     WHERE m.expiry_date IS NOT NULL
       AND m.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
     ORDER BY m.expiry_date ASC`,
    [days]
  );

  return rows;
};

