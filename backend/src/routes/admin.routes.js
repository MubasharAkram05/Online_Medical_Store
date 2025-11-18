import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAdminOverview,
  adminListMedicines,
  adminCreateMedicine,
  adminUpdateMedicine,
  adminDeleteMedicine,
  adminAdjustMedicineStock,
  adminListOrders,
  adminUpdateOrderStatus,
  adminUpdateOrderDetails,
  adminListPrescriptions,
  adminUpdatePrescriptionStatus,
  adminSalesReport,
  downloadReport,
  adminListUsers,
  adminUpdateUserRole,
  adminListSuppliers,
  adminCreateSupplier,
  adminUpdateSupplier,
  adminDeleteSupplier
} from '../controllers/admin.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.js';
import { medicineImageUpload } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/overview', getAdminOverview);

router.get('/medicines', adminListMedicines);
router.post(
  '/medicines',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be zero or positive'),
    body('expiry_date')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('Expiry date must be a valid date'),
    body('supplier_id')
      .optional({ nullable: true })
      .isInt({ min: 1 })
      .withMessage('Supplier id must be positive')
  ],
  validateRequest,
  (req, res, next) => {
    medicineImageUpload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: {
            message: err.message || 'Failed to upload image'
          }
        });
      }
      next();
    });
  },
  adminCreateMedicine
);
router.put(
  '/medicines/:id',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be zero or positive'),
    body('expiry_date')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('Expiry date must be a valid date'),
    body('supplier_id')
      .optional({ nullable: true })
      .isInt({ min: 1 })
      .withMessage('Supplier id must be positive')
  ],
  validateRequest,
  (req, res, next) => {
    medicineImageUpload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: {
            message: err.message || 'Failed to upload image'
          }
        });
      }
      next();
    });
  },
  adminUpdateMedicine
);
router.delete('/medicines/:id', adminDeleteMedicine);
router.patch(
  '/medicines/:id/stock',
  [
    body('direction')
      .isIn(['increase', 'decrease'])
      .withMessage('Direction must be either increase or decrease'),
    body('amount').isInt({ min: 1 }).withMessage('Amount must be at least 1')
  ],
  validateRequest,
  adminAdjustMedicineStock
);

router.get('/orders', adminListOrders);
router.patch(
  '/orders/:id',
  [
    body('priority')
      .optional()
      .isIn(['normal', 'high', 'urgent'])
      .withMessage('Invalid priority value'),
    body('paymentStatus')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'refunded'])
      .withMessage('Invalid payment status'),
    body('shippingAddress')
      .optional()
      .isLength({ min: 5 })
      .withMessage('Shipping address must be at least 5 characters'),
    body('city')
      .optional()
      .isLength({ min: 2 })
      .withMessage('City must be at least 2 characters'),
    body('postalCode')
      .optional()
      .isLength({ min: 3 })
      .withMessage('Postal code must be at least 3 characters'),
    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Items must be an array'),
    body('items.*.id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Item id must be positive'),
    body('items.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1')
  ],
  validateRequest,
  adminUpdateOrderDetails
);
router.patch(
  '/orders/:id/status',
  [
    body('status')
      .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid order status')
  ],
  validateRequest,
  adminUpdateOrderStatus
);

router.get('/prescriptions', adminListPrescriptions);
router.patch(
  '/prescriptions/:id',
  [
    body('status')
      .isIn(['pending', 'verified', 'rejected', 'expired'])
      .withMessage('Invalid prescription status'),
    body('notes').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Notes too long')
  ],
  validateRequest,
  adminUpdatePrescriptionStatus
);

router.get('/reports/sales', adminSalesReport);
router.get('/reports/download/:type/:format', downloadReport);

router.get('/users', adminListUsers);
router.patch(
  '/users/:id/role',
  [
    body('role').isIn(['patient', 'doctor', 'pharmacist', 'admin']).withMessage('Invalid role'),
    body('isVerified')
      .optional({ nullable: true })
      .isBoolean()
      .withMessage('isVerified must be boolean')
  ],
  validateRequest,
  adminUpdateUserRole
);

router.get('/suppliers', adminListSuppliers);
router.post(
  '/suppliers',
  [body('name').trim().isLength({ min: 2 }).withMessage('Supplier name is required')],
  validateRequest,
  adminCreateSupplier
);
router.put(
  '/suppliers/:id',
  [body('name').trim().isLength({ min: 2 }).withMessage('Supplier name is required')],
  validateRequest,
  adminUpdateSupplier
);
router.delete('/suppliers/:id', adminDeleteSupplier);

export default router;

