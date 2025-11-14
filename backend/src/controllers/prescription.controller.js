import { createPrescription, getPrescriptionsByUser } from '../models/prescription.model.js';
import { logger } from '../utils/logger.js';

const buildFileUrl = (req, filePath) => {
  return `${req.protocol}://${req.get('host')}/uploads/${filePath.replace(/\\/g, '/')}`;
};

const mapPrescriptionResponse = (req, row) => ({
  id: row.id,
  status: row.status,
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
    const prescriptions = await getPrescriptionsByUser(req.user.id);

    res.json({
      prescriptions: prescriptions.map((row) => mapPrescriptionResponse(req, row))
    });
  } catch (error) {
    next(error);
  }
};

