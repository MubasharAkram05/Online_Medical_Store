import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.js';
import { paymentProofUpload } from '../middleware/upload.middleware.js';
import {
  checkout,
  listOrders,
  getOrderDetails,
  downloadInvoice,
  uploadPaymentProof
} from '../controllers/order.controller.js';

const router = Router();

const checkoutValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone')
    .matches(/^[0-9+\- ]{10,20}$/)
    .withMessage('Please enter a valid phone number'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('payment_method')
    .isIn(['cod', 'card', 'bank', 'wallet'])
    .withMessage('Invalid payment method'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one cart item is required'),
  body('items.*.medicine_id')
    .isInt({ min: 1 })
    .withMessage('Medicine id must be a positive integer'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('payment')
    .optional({ nullable: true })
    .isObject()
    .withMessage('Payment details must be an object'),
  body('payment.transactionId')
    .optional({ nullable: true })
    .if((value, { req }) => req.body.payment_method && req.body.payment_method !== 'cod')
    .notEmpty()
    .withMessage('Transaction ID is required for electronic payments'),
  body('payment.reference')
    .optional({ nullable: true })
    .isLength({ max: 150 })
    .withMessage('Reference is too long'),
  body('payment.receiptUrl')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Receipt URL must be valid'),
  body('priority')
    .optional({ nullable: true })
    .isIn(['normal', 'high', 'urgent'])
    .withMessage('Invalid priority value')
];

router.post('/checkout', authenticate, checkoutValidators, validateRequest, checkout);
router.get('/', authenticate, listOrders);
router.get('/:id/invoice', authenticate, downloadInvoice);

router.post(
  '/:id/payment-proof',
  authenticate,
  (req, res, next) => {
    paymentProofUpload.single('proof')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: {
            message: err.message || 'Failed to upload payment proof'
          }
        });
      }
      next();
    });
  },
  uploadPaymentProof
);

router.get('/:id', authenticate, getOrderDetails);

export default router;
