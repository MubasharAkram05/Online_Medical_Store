import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadRoot = path.join(process.cwd(), 'uploads');
const prescriptionDir = path.join(uploadRoot, 'prescriptions');
const medicineImageDir = path.join(uploadRoot, 'medicines');
const profilePicDir = path.join(uploadRoot, 'profiles');
const paymentDir = path.join(uploadRoot, 'payments');

fs.mkdirSync(prescriptionDir, { recursive: true });
fs.mkdirSync(medicineImageDir, { recursive: true });
fs.mkdirSync(profilePicDir, { recursive: true });
fs.mkdirSync(paymentDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'paymentProof') {
      cb(null, paymentDir);
    } else {
      cb(null, prescriptionDir);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${random}${ext}`);
  }
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed.'));
  }
};

export const prescriptionUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const paymentProofUpload = multer({
  storage: multer.diskStorage({
    destination: paymentDir,
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `payment-${timestamp}-${random}${ext}`);
    }
  }),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Medicine image upload middleware
const medicineImageStorage = multer.diskStorage({
  destination: medicineImageDir,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${random}${ext}`);
  }
});

const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

const imageFileFilter = (req, file, cb) => {
  if (allowedImageMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed.'));
  }
};

export const medicineImageUpload = multer({
  storage: medicineImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const profilePicUpload = multer({
  storage: multer.diskStorage({
    destination: profilePicDir,
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `profile-${req.user?.id || 'unknown'}-${timestamp}${ext}`);
    }
  }),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB for profile pics
  }
});

