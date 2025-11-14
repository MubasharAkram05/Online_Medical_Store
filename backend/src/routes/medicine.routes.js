import { Router } from 'express';
import { getMedicines, getMedicineDetails, checkInteractions } from '../controllers/medicine.controller.js';

const router = Router();

router.get('/', getMedicines);
router.get('/:id', getMedicineDetails);
router.post('/interactions', checkInteractions);

export default router;

