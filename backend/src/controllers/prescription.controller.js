import {
  createPrescription,
  getPrescriptionsByUser,
  findPrescriptionById,
  updatePrescription,
  deletePrescription,
  findActiveOrderUsageByPrescriptionId,
  normalizeLegacyPrescriptionStatuses
} from '../models/prescription.model.js';
import { logger } from '../utils/logger.js';

const buildFileUrl = (req, filePath) => {
  return `${req.protocol}://${req.get('host')}/uploads/${filePath.replace(/\\/g, '/')}`;
};

const mapPrescriptionResponse = (req, row) => ({
  id: row.id,
  medicineId: row.medicine_id,
  status: (() => {
    const normalized = String(row.status || '').toLowerCase().trim();
    if (normalized === 'verified') return 'approved';
    if (normalized === 'approved') return 'approved';
    if (normalized === 'rejected') return 'rejected';
    if (normalized === 'pending') return 'pending';
    return normalized || 'pending';
  })(),
  notes: row.notes,
  fileName: row.file_original_name,
  fileMimeType: row.file_mime_type,
  fileSize: row.file_size,
  filePath: row.file_path,
  fileUrl: buildFileUrl(req, row.file_path),
  uploadedAt: row.uploaded_at,
  verifiedAt: row.verified_at,
  verifiedBy: row.verified_by
});

export const uploadPrescription = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: 'Prescription file is required'
        }
      });
    }

    const filePath = `prescriptions/${req.file.filename}`;
    const prescriptionId = await createPrescription({
      userId: req.user.id,
      medicineId: req.body.medicineId || req.body.medicine_id,
      filePath,
      fileOriginalName: req.file.originalname,
      fileMimeType: req.file.mimetype,
      fileSize: req.file.size,
      notes: req.body.notes
    });

    logger.info(
      {
        userId: req.user.id,
        prescriptionId,
        file: filePath
      },
      'Prescription uploaded'
    );

    const prescriptions = await getPrescriptionsByUser(req.user.id);
    const created = prescriptions.find((p) => p.id === prescriptionId);

    res.status(201).json({
      prescription: mapPrescriptionResponse(req, created)
    });
  } catch (error) {
    next(error);
  }
};

export const listPrescriptions = async (req, res, next) => {
  try {
    const { medicineId, medicine_id } = req.query;
    const mid = medicineId || medicine_id;
    await normalizeLegacyPrescriptionStatuses();
    const prescriptions = await getPrescriptionsByUser(req.user.id, mid);

    res.json({
      prescriptions: prescriptions.map((row) => mapPrescriptionResponse(req, row))
    });
  } catch (error) {
    next(error);
  }
};

export const updatePrescriptionNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const prescription = await findPrescriptionById(id);
    if (!prescription) {
      return res.status(404).json({
        error: {
          message: 'Prescription not found'
        }
      });
    }

    if (prescription.user_id !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'You can only update your own prescriptions'
        }
      });
    }

    await updatePrescription(id, notes);

    const updatedPrescription = await findPrescriptionById(id);

    res.json({
      prescription: mapPrescriptionResponse(req, updatedPrescription)
    });
  } catch (error) {
    next(error);
  }
};

export const deletePrescriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);

    const prescription = await findPrescriptionById(numericId);
    if (!prescription) {
      return res.status(404).json({
        error: {
          message: 'Prescription not found'
        }
      });
    }

    if (prescription.user_id !== req.user.id) {
      return res.status(403).json({
        error: {
          message: 'You can only delete your own prescriptions'
        }
      });
    }

    const activeUsage = await findActiveOrderUsageByPrescriptionId(numericId, req.user.id);
    if (activeUsage) {
      return res.status(409).json({
        error: {
          message: 'This prescription is linked to an active order and cannot be deleted.'
        }
      });
    }

    const deleted = await deletePrescription(numericId, req.user.id);
    if (!deleted) {
      return res.status(404).json({
        error: {
          message: 'Prescription not found'
        }
      });
    }

    logger.info(
      {
        userId: req.user.id,
        prescriptionId: numericId
      },
      'Prescription deleted'
    );

    res.json({
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
