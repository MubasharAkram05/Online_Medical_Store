import { listMedicines, getMedicineById, findMedicinesByIds } from '../models/medicine.model.js';
import { findInteractionPairs, findInteractionsForMedicine } from '../models/interaction.model.js';
import { buildInteractionWarnings } from '../utils/interactions.js';

export const getMedicines = async (req, res, next) => {
  try {
    const { search, category, limit } = req.query;
    const medicines = await listMedicines({ search, category, limit });

    res.json({
      medicines: medicines.map((medicine) => formatMedicineResponse(medicine))
    });
  } catch (error) {
    next(error);
  }
};

export const getMedicineDetails = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({
        error: {
          message: 'Invalid medicine id'
        }
      });
    }

    const medicine = await getMedicineById(id);
    if (!medicine) {
      return res.status(404).json({
        error: {
          message: 'Medicine not found'
        }
      });
    }

    const interactions = await findInteractionsForMedicine(id);
    const relatedMedicines = await findMedicinesByIds(
      interactions.reduce((acc, row) => {
        const otherId = row.medicine_id === id ? row.interacts_with_id : row.medicine_id;
        if (!acc.includes(otherId)) acc.push(otherId);
        return acc;
      }, [id])
    );

    const warnings = buildInteractionWarnings(relatedMedicines, interactions);

    res.json({
      ...formatMedicineResponse(medicine),
      interactionWarnings: warnings
    });
  } catch (error) {
    next(error);
  }
};

export const checkInteractions = async (req, res, next) => {
  try {
    const { medicineIds } = req.body;

    if (!Array.isArray(medicineIds) || medicineIds.length < 2) {
      return res.status(400).json({
        error: {
          message: 'At least two medicine ids are required to check interactions'
        }
      });
    }

    const uniqueIds = [...new Set(medicineIds.map((id) => Number(id)).filter(Boolean))];

    const medicines = await findMedicinesByIds(uniqueIds);
    if (medicines.length < 2) {
      return res.status(400).json({
        error: {
          message: 'Unable to find all medicines for interaction check'
        }
      });
    }

    const interactionRows = await findInteractionPairs(uniqueIds);
    const warnings = buildInteractionWarnings(medicines, interactionRows);

    res.json({
      warnings
    });
  } catch (error) {
    next(error);
  }
};

const formatMedicineResponse = (medicine) => ({
  id: medicine.id,
  name: medicine.name,
  description: medicine.description,
  price: Number(medicine.price),
  quantity: medicine.stock,
  stock: medicine.stock,
  requires_prescription: Boolean(medicine.requires_prescription),
  image: medicine.image_url,
  category: medicine.category,
  expiryDate: medicine.expiry_date,
  supplier: medicine.supplier_id
    ? {
        id: medicine.supplier_id,
        name: medicine.supplier_name || null
      }
    : null,
  dosageInstructions: medicine.dosage_instructions || '',
  sideEffects: medicine.side_effects || '',
  interactionNotes: parseInteractionNotes(medicine.interactions),
  createdAt: medicine.created_at,
  updatedAt: medicine.updated_at
});

const parseInteractionNotes = (value) => {
  if (!value) return [];
  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  } catch (error) {
    return [];
  }
};

