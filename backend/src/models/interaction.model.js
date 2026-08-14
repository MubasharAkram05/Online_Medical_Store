import { getPool } from '../config/database.js';

export const findInteractionsForMedicines = async (medicineIds) => {
  if (!medicineIds.length) return [];

  const placeholders = medicineIds.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await getPool().query(
    `SELECT m.id,
            m.name,
            m.dosage_instructions,
            m.side_effects,
            m.interactions
     FROM medicines m
     WHERE m.id IN (${placeholders})`,
    medicineIds
  );

  return rows;
};

export const findInteractionPairs = async (medicineIds) => {
  if (medicineIds.length < 2) return [];

  const count = medicineIds.length;
  const firstSet = medicineIds.map((_, i) => `$${i + 1}`).join(',');
  const secondSet = medicineIds.map((_, i) => `$${count + i + 1}`).join(',');
  const { rows } = await getPool().query(
    `SELECT i.medicine_id,
            i.interacts_with_id,
            i.severity,
            i.description,
            m1.name AS medicine_name,
            m2.name AS interacts_with_name
     FROM medicine_interactions i
     INNER JOIN medicines m1 ON m1.id = i.medicine_id
     INNER JOIN medicines m2 ON m2.id = i.interacts_with_id
     WHERE i.medicine_id IN (${firstSet})
       AND i.interacts_with_id IN (${secondSet})`,
    [...medicineIds, ...medicineIds]
  );

  return rows;
};

export const findInteractionsForMedicine = async (medicineId) => {
  const { rows } = await getPool().query(
    `SELECT i.medicine_id,
            i.interacts_with_id,
            i.severity,
            i.description,
            m1.name AS medicine_name,
            m2.name AS interacts_with_name
     FROM medicine_interactions i
     INNER JOIN medicines m1 ON m1.id = i.medicine_id
     INNER JOIN medicines m2 ON m2.id = i.interacts_with_id
     WHERE i.medicine_id = $1
        OR i.interacts_with_id = $1`,
    [medicineId]
  );

  return rows;
};
