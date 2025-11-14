import { validationResult } from 'express-validator';
import { getPool } from '../config/database.js';
import {
  listMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  findLowStockMedicines,
  getMedicineById,
  findExpiringMedicines,
  adjustMedicineStock
} from '../models/medicine.model.js';
import {
  getAllOrders,
  updateOrderStatus,
  getSalesReport,
  getOrderWithItemsAdmin
} from '../models/order.model.js';
import {
  getAllPrescriptions,
  updatePrescriptionStatus,
  findPrescriptionById
} from '../models/prescription.model.js';
import {
  getAllUsers,
  updateUserRole,
  updateUserVerification,
  findUserById
} from '../models/user.model.js';
import {
  listSuppliers,
  findSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../models/supplier.model.js';

const formatMedicineResponse = (medicine) => ({
  id: medicine.id,
  name: medicine.name,
  description: medicine.description,
  price: Number(medicine.price),
  stock: medicine.stock,
  requires_prescription: Boolean(medicine.requires_prescription),
  image: medicine.image_url,
  category: medicine.category,
  expiryDate: medicine.expiry_date,
  supplier: medicine.supplier_id
    ? {
        id: medicine.supplier_id,
        name: medicine.supplier_name || null
      }
    : null,
  dosageInstructions: medicine.dosage_instructions || '',
  sideEffects: medicine.side_effects || '',
  interactionNotes: parseInteractionNotes(medicine.interactions),
  createdAt: medicine.created_at,
  updatedAt: medicine.updated_at
});

const parseInteractionNotes = (value) => {
  if (!value) return [];
  try {
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    if (Array.isArray(value)) return value;
    return [value];
  } catch (error) {
    return [];
  }
};

export const getAdminOverview = async (req, res, next) => {
  try {
    const pool = getPool();
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalOrders, totalRevenue }]] = await pool.query(
      'SELECT COUNT(*) AS totalOrders, IFNULL(SUM(total_amount), 0) AS totalRevenue FROM orders'
    );
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM medicines');
    const lowStock = await findLowStockMedicines(5);
    const expiring = await findExpiringMedicines(30);
    const products = await listMedicines({});

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue: Number(totalRevenue || 0),
        totalUsers
      },
      alerts: {
        lowStock: lowStock.map(formatMedicineResponse),
        expiring: expiring.map(formatMedicineResponse)
      },
      products: products.map(formatMedicineResponse)
    });
  } catch (error) {
    next(error);
  }
};

export const adminListMedicines = async (req, res, next) => {
  try {
    const medicines = await listMedicines({
      search: req.query.search,
      category: req.query.category
    });

    res.json({
      medicines: medicines.map(formatMedicineResponse)
    });
  } catch (error) {
    next(error);
  }
};

export const adminCreateMedicine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  try {
    const newId = await createMedicine({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      requiresPrescription: req.body.requires_prescription,
      imageUrl: req.body.image,
      category: req.body.category,
      expiryDate: req.body.expiry_date,
      supplierId: req.body.supplier_id,
      dosageInstructions: req.body.dosageInstructions,
      sideEffects: req.body.sideEffects,
      interactionNotes: req.body.interactionNotes
    });

    const medicine = await getMedicineById(newId);

    res.status(201).json({
      medicine: formatMedicineResponse(medicine),
      message: 'Medicine created successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateMedicine = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  try {
    const id = Number(req.params.id);
    const existing = await getMedicineById(id);
    if (!existing) {
      return res.status(404).json({
        error: {
          message: 'Medicine not found'
        }
      });
    }

    await updateMedicine(id, {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      requiresPrescription: req.body.requires_prescription,
      imageUrl: req.body.image,
      category: req.body.category,
      expiryDate: req.body.expiry_date,
      supplierId: req.body.supplier_id,
      dosageInstructions: req.body.dosageInstructions,
      sideEffects: req.body.sideEffects,
      interactionNotes: req.body.interactionNotes
    });

    const updated = await getMedicineById(id);

    res.json({
      medicine: formatMedicineResponse(updated),
      message: 'Medicine updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const adminAdjustMedicineStock = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  try {
    const id = Number(req.params.id);
    const direction = req.body.direction;
    const amount = Number(req.body.amount);

    const existing = await getMedicineById(id);
    if (!existing) {
      return res.status(404).json({
        error: {
          message: 'Medicine not found'
        }
      });
    }

    const delta = direction === 'decrease' ? -amount : amount;
    await adjustMedicineStock(id, delta);

    const updated = await getMedicineById(id);

    res.json({
      message: 'Stock updated successfully.',
      medicine: formatMedicineResponse(updated)
    });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteMedicine = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await getMedicineById(id);
    if (!existing) {
      return res.status(404).json({
        error: {
          message: 'Medicine not found'
        }
      });
    }

    await deleteMedicine(id);
    res.json({
      message: 'Medicine deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const adminListOrders = async (req, res, next) => {
  try {
    const orders = await getAllOrders();
    const detailedOrders = await Promise.all(
      orders.map(async (order) => {
        const detailed = await getOrderWithItemsAdmin(order.id);
        const items = (detailed?.items || []).map((item) => ({
          id: item.id,
          medicineId: item.medicine_id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price)
        }));

        return {
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          totalAmount: Number(order.total_amount),
          paymentMethod: order.payment_method,
          paymentStatus:
            order.payment_status || (order.payment_method === 'cod' ? 'pending' : 'completed'),
          prescriptionVerified: Boolean(order.prescription_verified),
          customer: {
            id: order.user_id,
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone
          },
          createdAt: order.created_at,
          shippingAddress: order.address,
          priority: order.priority || 'normal',
          items
        };
      })
    );

    res.json({
      orders: detailedOrders
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateOrderStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  try {
    const id = Number(req.params.id);
    await updateOrderStatus(id, req.body.status);

    const orderData = await getOrderWithItemsAdmin(id);

    res.json({
      message: 'Order status updated successfully.',
      order: orderData ? orderData.order : null
    });
  } catch (error) {
    next(error);
  }
};

export const adminListPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await getAllPrescriptions({ status: req.query.status });

    res.json({
      prescriptions: prescriptions.map((prescription) => ({
        id: prescription.id,
        userId: prescription.user_id,
        userName: prescription.user_name,
        userEmail: prescription.user_email,
        filePath: prescription.file_path,
        fileName: prescription.file_original_name,
        status: prescription.status,
        notes: prescription.notes,
        uploadedAt: prescription.uploaded_at,
        verifiedAt: prescription.verified_at
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpdatePrescriptionStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  try {
    const id = Number(req.params.id);
    const prescription = await findPrescriptionById(id);
    if (!prescription) {
      return res.status(404).json({
        error: {
          message: 'Prescription not found'
        }
      });
    }

    await updatePrescriptionStatus(id, req.body.status, req.user.id, req.body.notes);

    res.json({
      message: 'Prescription status updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const adminSalesReport = async (req, res, next) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 7;
    const report = await getSalesReport({ days });

    res.json({
      report
    });
  } catch (error) {
    next(error);
  }
};

export const adminListUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers();

    res.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: Boolean(user.is_verified),
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateUserRole = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  try {
    const id = Number(req.params.id);
    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }

    await updateUserRole(id, req.body.role);
    if (typeof req.body.isVerified === 'boolean') {
      await updateUserVerification(id, req.body.isVerified);
    }

    res.json({
      message: 'User updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const adminListSuppliers = async (req, res, next) => {
  try {
    const suppliers = await listSuppliers();
    res.json({ suppliers });
  } catch (error) {
    next(error);
  }
};

export const adminCreateSupplier = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  try {
    const id = await createSupplier(req.body);
    const supplier = await findSupplierById(id);
    res.status(201).json({
      supplier,
      message: 'Supplier created successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateSupplier = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  try {
    const id = Number(req.params.id);
    const supplier = await findSupplierById(id);
    if (!supplier) {
      return res.status(404).json({
        error: {
          message: 'Supplier not found'
        }
      });
    }

    await updateSupplier(id, req.body);
    const updated = await findSupplierById(id);
    res.json({
      supplier: updated,
      message: 'Supplier updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteSupplier = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const supplier = await findSupplierById(id);
    if (!supplier) {
      return res.status(404).json({
        error: {
          message: 'Supplier not found'
        }
      });
    }

    await deleteSupplier(id);
    res.json({
      message: 'Supplier deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

