import { getPool } from '../config/database.js';

export const listSuppliers = async () => {
  const [rows] = await getPool().query(
    `SELECT *
     FROM suppliers
     ORDER BY name ASC`
  );

  return rows;
};

export const findSupplierById = async (id) => {
  const [rows] = await getPool().query(
    `SELECT *
     FROM suppliers
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
};

export const createSupplier = async ({
  name,
  email,
  phone,
  address,
  notes
}) => {
  const [result] = await getPool().query(
    `INSERT INTO suppliers (name, email, phone, address, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email || null, phone || null, address || null, notes || null]
  );

  return result.insertId;
};

export const updateSupplier = async (
  id,
  {
    name,
    email,
    phone,
    address,
    notes
  }
) => {
  await getPool().query(
    `UPDATE suppliers
     SET name = ?,
         email = ?,
         phone = ?,
         address = ?,
         notes = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [name, email || null, phone || null, address || null, notes || null, id]
  );
};

export const deleteSupplier = async (id) => {
  await getPool().query(
    `UPDATE medicines
     SET supplier_id = NULL
     WHERE supplier_id = ?`,
    [id]
  );

  await getPool().query(
    `DELETE FROM suppliers
     WHERE id = ?`,
    [id]
  );
};

