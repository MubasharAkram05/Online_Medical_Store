import { getPool } from '../config/database.js';

export const findMedicinesByIds = async (ids) => {
  if (!ids.length) return [];

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await getPool().query(
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
       SET stock = stock - $1
       WHERE id = $2`,
      [item.quantity, item.medicineId]
    );
  }
};

export const adjustMedicineStock = async (id, delta) => {
  await getPool().query(
    `UPDATE medicines
     SET stock = GREATEST(stock + $1, 0),
         updated_at = NOW()
     WHERE id = $2`,
    [delta, id]
  );
};

export const getMedicineById = async (id) => {
  const { rows } = await getPool().query(
    `SELECT m.*, s.name AS supplier_name
     FROM medicines m
     LEFT JOIN suppliers s ON s.id = m.supplier_id
     WHERE m.id = $1`,
    [id]
  );

  return rows[0] || null;
};

export const listMedicines = async ({ search, category, limit }) => {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`, `%${search}%`);
    conditions.push(`(m.name ILIKE $${params.length - 1} OR m.description ILIKE $${params.length})`);
  }

  if (category) {
    params.push(category);
    conditions.push(`m.category = $${params.length}`);
  }

  let query = `SELECT m.*, s.name AS supplier_name, m.manufacturer
               FROM medicines m
               LEFT JOIN suppliers s ON s.id = m.supplier_id`;
  if (conditions.length) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY m.sort_order ASC, m.created_at DESC';

  if (limit) {
    params.push(Number(limit));
    query += ` LIMIT $${params.length}`;
  }

  const { rows } = await getPool().query(query, params);
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
  const maxOrderResult = await getPool().query('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM medicines');
  const nextOrder = maxOrderResult.rows[0].max_order + 1;

  const { rows } = await getPool().query(
    `INSERT INTO medicines
      (name, description, price, stock, requires_prescription, image_url, manufacturer, category, expiry_date, manufacturing_date, supplier_id, dosage_instructions, side_effects, interactions, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING id`,
    [
      name,
      description || null,
      price,
      stock ?? 0,
      Boolean(requiresPrescription),
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

  return rows[0].id;
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
     SET name = $1,
         description = $2,
         price = $3,
         stock = $4,
         requires_prescription = $5,
         image_url = $6,
         manufacturer = $7,
         category = $8,
         expiry_date = $9,
         manufacturing_date = $10,
         supplier_id = $11,
         dosage_instructions = $12,
         side_effects = $13,
         interactions = $14,
         updated_at = NOW()
     WHERE id = $15`,
    [
      name,
      description || null,
      price,
      stock ?? 0,
      Boolean(requiresPrescription),
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
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // Get the sort_order of the medicine being deleted
    const { rows: medicine } = await connection.query('SELECT sort_order FROM medicines WHERE id = $1', [id]);

    if (medicine && medicine.length > 0) {
      const deletedOrder = medicine[0].sort_order;

      // Delete the medicine
      await connection.query('DELETE FROM medicines WHERE id = $1', [id]);

      // Shift back all products after this specific position
      await connection.query(
        'UPDATE medicines SET sort_order = sort_order - 1 WHERE sort_order > $1',
        [deletedOrder]
      );
    }

    await connection.query('COMMIT');
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
};

export const findLowStockMedicines = async (threshold = 10) => {
  const { rows } = await getPool().query(
    `SELECT m.*, s.name AS supplier_name
     FROM medicines m
     LEFT JOIN suppliers s ON s.id = m.supplier_id
     WHERE m.stock <= $1
     ORDER BY m.stock ASC`,
    [threshold]
  );

  return rows;
};

export const findExpiringMedicines = async (days = 30) => {
  const { rows } = await getPool().query(
    `SELECT m.*, s.name AS supplier_name
     FROM medicines m
     LEFT JOIN suppliers s ON s.id = m.supplier_id
     WHERE m.expiry_date IS NOT NULL
       AND m.expiry_date <= CURRENT_DATE + ($1 * INTERVAL '1 day')
     ORDER BY m.expiry_date ASC`,
    [days]
  );

  return rows;
};
