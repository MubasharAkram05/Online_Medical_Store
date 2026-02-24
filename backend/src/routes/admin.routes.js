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
  adminPreviewDeletePrescriptionRange,
  adminDeletePrescriptionRange,
  adminSalesReport,
  downloadReport,
  adminListUsers,
  adminUpdateUserRole,
  adminDeleteUser,
  adminListSuppliers,
  adminCreateSupplier,
  adminUpdateSupplier,
  adminDeleteSupplier,
  adminApprovePayment,
  adminVerifyOrderItemPrescription,
  adminVerifyOrderPrescription,
  adminClearOrderData
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
  medicineImageUpload.single('image'),
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be zero or positive'),
    body('expiry_date')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Expiry date must be a valid date'),
    body('manufacturing_date')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Manufacturing date must be a valid date'),
    body('manufacturer')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 150 })
      .withMessage('Manufacturer name is too long'),
    body('supplier_id')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Supplier id must be positive'),
    body('requires_prescription').optional().toBoolean()
  ],
  validateRequest,
  adminCreateMedicine
);
router.put(
  '/medicines/:id',
  medicineImageUpload.single('image'),
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be zero or positive'),
    body('expiry_date')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Expiry date must be a valid date'),
    body('manufacturing_date')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Manufacturing date must be a valid date'),
    body('manufacturer')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 150 })
      .withMessage('Manufacturer name is too long'),
    body('supplier_id')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Supplier id must be positive'),
    body('requires_prescription').optional().toBoolean()
  ],
  validateRequest,
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
      .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'pending_prescription'])
      .withMessage('Invalid order status')
  ],
  validateRequest,
  adminUpdateOrderStatus
);
router.patch('/orders/:id/approve-payment', adminApprovePayment);
router.delete('/orders/clear', adminClearOrderData);
router.patch(
  '/orders/items/:orderItemId/prescription',
  [
    body('status')
      .isIn(['approved', 'declined'])
      .withMessage('Status must be approved or declined'),
    body('notes').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Notes too long')
  ],
  validateRequest,
  adminVerifyOrderItemPrescription
);

router.patch(
  '/orders/:id/prescription/verify',
  [
    body('status')
      .isIn(['approved', 'declined'])
      .withMessage('Status must be approved or declined'),
    body('notes').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Notes too long')
  ],
  validateRequest,
  (req, res, next) => {
    // We'll rename adminVerifyOrderItemPrescription to something more generic or create a new one
    // For now I'll just use the existing controller function logic if I can adapt it
    next();
  },
  adminVerifyOrderPrescription
);

router.get('/prescriptions', adminListPrescriptions);
router.post(
  '/prescriptions/delete-range/preview',
  [
    body('fromDate').isISO8601().withMessage('From Date must be a valid date'),
    body('toDate').isISO8601().withMessage('To Date must be a valid date'),
    body('status')
      .optional()
      .isIn(['all', 'pending', 'approved', 'rejected'])
      .withMessage('Invalid prescription status filter')
  ],
  validateRequest,
  adminPreviewDeletePrescriptionRange
);
router.delete(
  '/prescriptions/delete-range',
  [
    body('fromDate').isISO8601().withMessage('From Date must be a valid date'),
    body('toDate').isISO8601().withMessage('To Date must be a valid date'),
    body('status')
      .optional()
      .isIn(['all', 'pending', 'approved', 'rejected'])
      .withMessage('Invalid prescription status filter')
  ],
  validateRequest,
  adminDeletePrescriptionRange
);
router.patch(
  '/prescriptions/:id',
  [
    body('status')
      .isIn(['pending', 'approved', 'rejected'])
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
router.delete('/users/:id', adminDeleteUser);

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

