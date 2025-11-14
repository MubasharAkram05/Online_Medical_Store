import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

const registerValidators = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .optional({ nullable: true })
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Phone number must be 10-15 digits'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['patient', 'doctor', 'pharmacist', 'admin'])
    .withMessage('Invalid role supplied')
];

router.post('/register', registerValidators, validateRequest, register);

const loginValidators = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

router.post('/login', loginValidators, validateRequest, login);

router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail()
  ],
  validateRequest,
  requestPasswordReset
);

router.post(
  '/reset-password',
  [
    body('token')
      .isString()
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  validateRequest,
  resetPassword
);

router.get('/me', authenticate, getProfile);

router.put(
  '/profile',
  authenticate,
  [
    body('name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters long'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('phone')
      .optional({ nullable: true })
      .matches(/^[0-9]{10,15}$/)
      .withMessage('Phone number must be 10-15 digits')
  ],
  validateRequest,
  updateProfile
);

router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword')
      .isLength({ min: 6 })
      .withMessage('Current password must be at least 6 characters long'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],
  validateRequest,
  changePassword
);

export default router;

