import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { prescriptionUpload } from '../middleware/upload.middleware.js';
import { uploadPrescription, listPrescriptions } from '../controllers/prescription.controller.js';

const router = Router();

router.post(
  '/',
  authenticate,
  (req, res, next) => {
    prescriptionUpload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: {
            message: err.message || 'Failed to upload prescription'
          }
        });
      }
      next();
    });
  },
  uploadPrescription
);

router.get('/', authenticate, listPrescriptions);

export default router;

