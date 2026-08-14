import { getPool } from '../config/database.js';

export const listSuppliers = async () => {
  const { rows } = await getPool().query(
    `SELECT *
     FROM suppliers
     ORDER BY name ASC`
  );

  return rows;
};

export const findSupplierById = async (id) => {
  const { rows } = await getPool().query(
    `SELECT *
     FROM suppliers
     WHERE id = $1`,
    [id]
  );

  return rows[0] || null;
};

export const createSupplier = async ({
  name,
  email,
  phone,
  address,
  manufacturer,
  notes
}) => {
  const { rows } = await getPool().query(
    `INSERT INTO suppliers (name, email, phone, address, manufacturer, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      name,
      email || null,
      phone || null,
      address || null,
      manufacturer || null,
      notes || null
    ]
  );

  return rows[0].id;
};

export const updateSupplier = async (
  id,
  {
    name,
    email,
    phone,
    address,
    manufacturer,
    notes
  }
) => {
  await getPool().query(
    `UPDATE suppliers
     SET name = $1,
         email = $2,
         phone = $3,
         address = $4,
         manufacturer = $5,
         notes = $6,
         updated_at = NOW()
     WHERE id = $7`,
    [
      name,
      email || null,
      phone || null,
      address || null,
      manufacturer || null,
      notes || null,
      id
    ]
  );
};

export const deleteSupplier = async (id) => {
  await getPool().query(
    `UPDATE medicines
     SET supplier_id = NULL
     WHERE supplier_id = $1`,
    [id]
  );

  await getPool().query(
    `DELETE FROM suppliers
     WHERE id = $1`,
    [id]
  );
};
