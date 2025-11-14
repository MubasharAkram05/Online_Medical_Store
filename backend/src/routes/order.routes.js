import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.js';
import {
  checkout,
  listOrders,
  getOrderDetails,
  downloadInvoice
} from '../controllers/order.controller.js';

const router = Router();

const checkoutValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Phone number must be 10-15 digits'),
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
    .optional({ nullable: true })
    .isURL()
    .withMessage('Receipt URL must be valid')
];

router.post('/checkout', authenticate, checkoutValidators, validateRequest, checkout);
router.get('/', authenticate, listOrders);
router.get('/:id/invoice', authenticate, downloadInvoice);
router.get('/:id', authenticate, getOrderDetails);

export default router;

