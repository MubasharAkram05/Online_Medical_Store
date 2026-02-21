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
  getOrderWithItemsAdmin,
  getOrderItemsForUpdate,
  updateOrderItemQuantity,
  updateOrderFields,
  recalculateOrderTotals
} from '../models/order.model.js';
import {
  getAllPrescriptions,
  updatePrescriptionStatus,
  findPrescriptionById
} from '../models/prescription.model.js';
import { sendPrescriptionStatusEmail } from '../services/email.service.js';
import {
  getAllUsers,
  updateUserRole,
  updateUserVerification,
  findUserById,
  deleteUser
} from '../models/user.model.js';
import {
  listSuppliers,
  findSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../models/supplier.model.js';
import { updatePaymentStatusForOrder, approvePayment } from '../models/payment.model.js';
import {
  generateSalesReportPDF,
  generateInventoryReportPDF,
  generateExpiryReportPDF
} from '../utils/reportPdf.js';
import {
  generateSalesReportCSV,
  generateInventoryReportCSV,
  generateExpiryReportCSV
} from '../utils/reportCsv.js';

const PRIORITY_OPTIONS = ['normal', 'high', 'urgent'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'completed', 'failed', 'refunded'];

const formatMedicineResponse = (medicine) => ({
  id: medicine.id,
  name: medicine.name,
  description: medicine.description,
  price: Number(medicine.price),
  stock: medicine.stock,
  requires_prescription: Boolean(medicine.requires_prescription),
  image: medicine.image_url,
  manufacturer: medicine.manufacturer,
  category: medicine.category,
  expiryDate: medicine.expiry_date,
  manufacturingDate: medicine.manufacturing_date,
  supplier: medicine.supplier_id
    ? {
      id: medicine.supplier_id,
      name: medicine.supplier_name || null
    }
    : null,
  dosageInstructions: medicine.dosage_instructions || '',
  sideEffects: medicine.side_effects || '',
  interactionNotes: parseInteractionNotes(medicine.interactions),
  sortOrder: medicine.sort_order,
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

const mapAdminOrderResponse = (order, items) => ({
  id: order.id,
  orderNumber: order.order_number,
  status: order.status,
  totalAmount: Number(order.total_amount),
  subtotalAmount: Number(order.subtotal_amount),
  taxAmount: Number(order.tax_amount),
  shippingFee: Number(order.shipping_fee),
  paymentMethod: order.payment_method,
  paymentStatus: order.payment_status || (order.payment_method === 'cod' ? 'pending' : 'completed'),
  prescriptionVerified: Boolean(order.prescription_verified),
  customer: {
    id: order.user_id,
    name: order.customer_name,
    email: order.customer_email,
    phone: order.customer_phone
  },
  recipient: {
    name: order.full_name,
    email: order.email,
    phone: order.phone
  },
  createdAt: order.created_at,
  shippingAddress: order.address,
  shippingCity: order.city,
  shippingPostalCode: order.postal_code,
  priority: order.priority || 'normal',
  items
});

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
    // Handle image upload: if file is uploaded, use it; otherwise use URL from body
    let imageUrl = req.body.image || '';
    if (req.file) {
      const filePath = `medicines/${req.file.filename}`;
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${filePath}`;
    }

    // Parse interactionNotes if it's a JSON string
    let interactionNotes = req.body.interactionNotes;
    if (typeof interactionNotes === 'string') {
      try {
        const parsed = JSON.parse(interactionNotes);
        interactionNotes = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // If not JSON, treat as newline-separated string
        interactionNotes = interactionNotes
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
      }
    } else if (!Array.isArray(interactionNotes)) {
      interactionNotes = interactionNotes ? [interactionNotes] : [];
    }

    const newId = await createMedicine({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      requiresPrescription: req.body.requires_prescription,
      imageUrl: imageUrl,
      manufacturer: req.body.manufacturer,
      category: req.body.category,
      expiryDate: req.body.expiry_date,
      manufacturingDate: req.body.manufacturing_date,
      supplierId: req.body.supplier_id,
      dosageInstructions: req.body.dosageInstructions,
      sideEffects: req.body.sideEffects,
      interactionNotes: interactionNotes
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

    // Handle image upload: if file is uploaded, use it; otherwise use URL from body
    let imageUrl = req.body.image || existing.image || '';
    if (req.file) {
      const filePath = `medicines/${req.file.filename}`;
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${filePath}`;
    }

    // Parse interactionNotes if it's a JSON string
    let interactionNotes = req.body.interactionNotes;
    if (typeof interactionNotes === 'string') {
      try {
        const parsed = JSON.parse(interactionNotes);
        interactionNotes = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // If not JSON, treat as newline-separated string
        interactionNotes = interactionNotes
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
      }
    } else if (!Array.isArray(interactionNotes)) {
      interactionNotes = interactionNotes ? [interactionNotes] : [];
    }

    await updateMedicine(id, {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      requiresPrescription: req.body.requires_prescription,
      imageUrl: imageUrl,
      manufacturer: req.body.manufacturer,
      category: req.body.category,
      expiryDate: req.body.expiry_date,
      manufacturingDate: req.body.manufacturing_date,
      supplierId: req.body.supplier_id,
      dosageInstructions: req.body.dosageInstructions,
      sideEffects: req.body.sideEffects,
      interactionNotes: interactionNotes
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
          totalPrice: Number(item.total_price),
          requiresPrescription: Boolean(item.requires_prescription),
          prescriptionId: item.prescription_id,
          prescriptionStatus: item.prescription_status,
          prescriptionNotes: item.prescription_notes,
          prescriptionPath: item.prescription_path,
          prescriptionName: item.prescription_name,
          prescriptionUploadedAt: item.uploaded_at,
          file_mime_type: item.file_mime_type
        }));

        return mapAdminOrderResponse(order, items);
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
    const newStatus = req.body.status;

    // Get order data before updating to check if prescription is required
    const orderDataBefore = await getOrderWithItemsAdmin(id);
    const requiresPrescription = orderDataBefore?.items?.some(
      item => item.requires_prescription === 1 || item.requires_prescription === true
    );
    const userId = orderDataBefore?.order?.user_id;

    await updateOrderStatus(id, newStatus);

    // If order is completed/delivered and requires prescription, expire the prescription
    if ((newStatus === 'completed' || newStatus === 'delivered') && requiresPrescription && userId) {
      const [updateResult] = await getPool().query(
        `UPDATE prescriptions
         SET status = 'expired'
         WHERE user_id = ? 
           AND status IN ('pending', 'verified')
         ORDER BY uploaded_at DESC
         LIMIT 1`,
        [userId]
      );
      console.log(`Prescription expired for user ${userId} after order ${id} status changed to ${newStatus}. Affected rows: ${updateResult.affectedRows}`);
    }

    // If order is delivered and it's COD, mark payment as completed
    if (newStatus === 'delivered' && orderDataBefore?.order?.payment_method === 'cod') {
      await updatePaymentStatusForOrder(id, 'completed', {
        method: 'cod',
        amount: orderDataBefore.order.total_amount
      });
      console.log(`Payment marked as completed for COD order ${id} after status changed to delivered.`);
    }

    const orderData = await getOrderWithItemsAdmin(id);

    res.json({
      message: 'Order status updated successfully.',
      order: orderData ? orderData.order : null
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateOrderDetails = async (req, res, next) => {
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
    const detailed = await getOrderWithItemsAdmin(id);
    if (!detailed) {
      return res.status(404).json({
        error: {
          message: 'Order not found'
        }
      });
    }

    const fieldsToUpdate = {};
    if (req.body.priority && PRIORITY_OPTIONS.includes(req.body.priority)) {
      fieldsToUpdate.priority = req.body.priority;
    }
    if (req.body.shippingAddress) {
      fieldsToUpdate.address = req.body.shippingAddress;
    }
    if (req.body.city) {
      fieldsToUpdate.city = req.body.city;
    }
    if (req.body.postalCode) {
      fieldsToUpdate.postalCode = req.body.postalCode;
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await updateOrderFields(id, fieldsToUpdate);
    }

    if (Array.isArray(req.body.items) && req.body.items.length > 0) {
      const itemsPayload = req.body.items;
      const currentItems = await getOrderItemsForUpdate(id);

      for (const itemPayload of itemsPayload) {
        const currentItem = currentItems.find((item) => item.id === itemPayload.id);
        if (!currentItem) {
          continue;
        }

        const newQuantity = Number(itemPayload.quantity);
        if (!Number.isInteger(newQuantity) || newQuantity < 1) {
          return res.status(400).json({
            error: {
              message: 'Quantity must be a positive integer.'
            }
          });
        }

        const diff = newQuantity - currentItem.quantity;
        if (diff !== 0) {
          if (diff > 0 && currentItem.medicine_stock < diff) {
            return res.status(400).json({
              error: {
                message: `Insufficient stock available for item #${currentItem.id}`
              }
            });
          }

          await updateOrderItemQuantity(currentItem.id, newQuantity);
          await adjustMedicineStock(currentItem.medicine_id, -diff);
        }
      }

      await recalculateOrderTotals(id);
    }

    if (req.body.paymentStatus && PAYMENT_STATUS_OPTIONS.includes(req.body.paymentStatus)) {
      await updatePaymentStatusForOrder(id, req.body.paymentStatus, {
        method: detailed.order.payment_method,
        amount: detailed.order.total_amount
      });
    }

    const updated = await getOrderWithItemsAdmin(id);
    const items = (updated?.items || []).map((item) => ({
      id: item.id,
      medicineId: item.medicine_id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
      requiresPrescription: Boolean(item.requires_prescription)
    }));

    res.json({
      message: 'Order updated successfully.',
      order: updated ? mapAdminOrderResponse(updated.order, items) : null
    });
  } catch (error) {
    next(error);
  }
};

const buildFileUrl = (req, filePath) => {
  return `${req.protocol}://${req.get('host')}/uploads/${filePath.replace(/\\/g, '/')}`;
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
        fileMimeType: prescription.file_mime_type,
        fileSize: prescription.file_size,
        fileUrl: buildFileUrl(req, prescription.file_path),
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

export const downloadReport = async (req, res, next) => {
  try {
    const { type, format } = req.params;
    const days = req.query.days ? Number(req.query.days) : 7;

    if (!['sales', 'inventory', 'expiry'].includes(type)) {
      return res.status(400).json({
        error: { message: 'Invalid report type' }
      });
    }

    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({
        error: { message: 'Invalid format. Use pdf or csv' }
      });
    }

    if (type === 'sales') {
      const report = await getSalesReport({ days });
      const totalOrders = report.reduce((sum, day) => sum + (Number(day.orders) || 0), 0);
      const totalRevenue = report.reduce((sum, day) => sum + (Number(day.revenue) || 0), 0);
      const averageDailyRevenue = report.length > 0 ? totalRevenue / report.length : 0;

      const reportData = {
        summary: {
          totalOrders,
          totalRevenue,
          averageDailyRevenue
        },
        dailyData: report
      };

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=sales-report-${new Date().toISOString().split('T')[0]}.pdf`
        );
        generateSalesReportPDF(reportData, res);
      } else {
        const csv = generateSalesReportCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=sales-report-${new Date().toISOString().split('T')[0]}.csv`
        );
        res.send(csv);
      }
    } else if (type === 'inventory') {
      const lowStock = await findLowStockMedicines(5);
      const formattedProducts = lowStock.map(formatMedicineResponse);
      const totalValue = formattedProducts.reduce(
        (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0),
        0
      );

      const reportData = {
        summary: {
          totalItems: formattedProducts.length,
          totalValue
        },
        products: formattedProducts
      };

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.pdf`
        );
        generateInventoryReportPDF(reportData, res);
      } else {
        const csv = generateInventoryReportCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.csv`
        );
        res.send(csv);
      }
    } else if (type === 'expiry') {
      const expiring = await findExpiringMedicines(30);
      const formattedProducts = expiring.map(formatMedicineResponse);
      const totalValue = formattedProducts.reduce(
        (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0),
        0
      );

      const reportData = {
        summary: {
          totalItems: formattedProducts.length,
          totalValue
        },
        products: formattedProducts
      };

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=expiry-report-${new Date().toISOString().split('T')[0]}.pdf`
        );
        generateExpiryReportPDF(reportData, res);
      } else {
        const csv = generateExpiryReportCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=expiry-report-${new Date().toISOString().split('T')[0]}.csv`
        );
        res.send(csv);
      }
    }
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

export const adminDeleteUser = async (req, res, next) => {
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

    // Protection for last admin or self-deletion could be added here
    if (user.role === 'admin' && req.user.id === id) {
      return res.status(400).json({
        error: {
          message: 'You cannot delete your own admin account.'
        }
      });
    }

    await deleteUser(id);
    res.json({
      message: 'User deleted successfully.'
    });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        error: {
          message: 'Cannot delete user because they have associated records (orders, prescriptions, etc.).'
        }
      });
    }
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

export const adminApprovePayment = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const detailed = await getOrderWithItemsAdmin(id);

    if (!detailed) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }

    if (detailed.order.payment_method === 'cod') {
      return res.status(400).json({ error: { message: 'COD orders do not require payment approval' } });
    }

    // Update payment status to completed
    await approvePayment(id, req.user.id);

    // Automatically update order status to confirmed
    await updateOrderStatus(id, 'confirmed');

    console.log(`Payment approved by admin ${req.user.id} (Name: ${req.user.name}) for order ${id} at ${new Date().toISOString()}`);

    const updated = await getOrderWithItemsAdmin(id);
    res.json({
      message: 'Payment approved and order confirmed.',
      order: updated ? updated.order : null
    });
  } catch (error) {
    next(error);
  }
};
export const adminVerifyOrderItemPrescription = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: { message: 'Validation failed', details: errors.array() } });
  }

  const { status, notes } = req.body;
  const orderItemId = Number(req.params.orderItemId);

  try {
    const pool = getPool();
    // 1. Get order item and associated prescription
    const [itemRows] = await pool.query(
      `SELECT oi.*, p.id AS p_id, p.status AS p_status, o.status AS o_status, o.order_number, u.email AS customer_email, m.name AS medicine_name
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN users u ON u.id = o.user_id
       JOIN medicines m ON m.id = oi.medicine_id
       LEFT JOIN prescriptions p ON p.id = oi.prescription_id
       WHERE oi.id = ?`,
      [orderItemId]
    );

    const item = itemRows[0];
    if (!item) {
      return res.status(404).json({ error: { message: 'Order item not found' } });
    }

    if (!item.prescription_id) {
      return res.status(400).json({ error: { message: 'This item does not have an attached prescription' } });
    }

    // 2. Update order item status
    await pool.query(
      `UPDATE order_items 
       SET prescription_status = ?, 
           prescription_notes = ?, 
           prescription_verified_by = ?, 
           prescription_verified_at = NOW() 
       WHERE id = ?`,
      [status, notes || null, req.user.id, orderItemId]
    );

    // 3. Rejection logic: If rejected, mark the global prescription as rejected too
    if (status === 'declined') {
      await pool.query(
        `UPDATE prescriptions SET status = 'rejected', notes = COALESCE(?, notes) WHERE id = ?`,
        [notes || 'Rejected in order review', item.prescription_id]
      );
    }

    // 4. Check if all items in this order are now verified
    const [allItemRows] = await pool.query(
      `SELECT prescription_status, medicine_id 
       FROM order_items 
       WHERE order_id = ?`,
      [item.order_id]
    );

    // Fetch medicine details to see which items require prescription
    const medicineIds = allItemRows.map(r => r.medicine_id);
    const [medicines] = await pool.query(`SELECT id, requires_prescription FROM medicines WHERE id IN (?)`, [medicineIds]);
    const medicinesMap = new Map(medicines.map(m => [m.id, m.requires_prescription]));

    const allVerified = allItemRows.every(row => {
      const requires = medicinesMap.get(row.medicine_id);
      if (!requires) return true;
      return row.prescription_status === 'approved';
    });

    if (allVerified) {
      // Update overall order status if it was pending prescription
      const newStatus = item.o_status === 'pending_prescription' ? 'pending' : item.o_status;
      await pool.query(
        `UPDATE orders SET prescription_verified = 1, status = ? WHERE id = ?`,
        [newStatus, item.order_id]
      );
    } else {
      await pool.query(
        `UPDATE orders SET prescription_verified = 0 WHERE id = ?`,
        [item.order_id]
      );
    }

    // 5. Send Email Notification
    if (item.customer_email) {
      sendPrescriptionStatusEmail(item.customer_email, {
        orderNumber: item.order_number,
        itemName: item.medicine_name,
        status: status,
        notes: notes
      }).catch(err => console.error('Failed to send status email:', err));
    }

    console.log(`Prescription for order item ${orderItemId} ${status} by admin ${req.user.id} at ${new Date().toISOString()}`);

    res.json({
      message: `Prescription ${status} successfully.`,
      allVerified
    });
  } catch (error) {
    next(error);
  }
};

export const adminVerifyOrderPrescription = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const { status, notes } = req.body;
    const pool = getPool();

    // 1. Get order and items info
    const [items] = await pool.query(
      `SELECT oi.id, oi.prescription_id, o.user_id, o.email as customer_email, o.order_number
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.id = ? AND oi.prescription_id IS NOT NULL`,
      [orderId]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: { message: 'No items with prescriptions found for this order' } });
    }

    // 2. Update all order items that have a prescription
    await pool.query(
      `UPDATE order_items 
       SET prescription_status = ?, 
           prescription_notes = ?, 
           prescription_verified_by = ?, 
           prescription_verified_at = NOW() 
       WHERE order_id = ? AND prescription_id IS NOT NULL`,
      [status, notes || null, req.user.id, orderId]
    );

    // 3. Update global prescription status if rejected
    const prescriptionId = items[0].prescription_id;
    if (status === 'declined') {
      await pool.query(
        `UPDATE prescriptions SET status = 'rejected', notes = COALESCE(?, notes) WHERE id = ?`,
        [notes || 'Rejected in order review', prescriptionId]
      );
    } else if (status === 'approved') {
      await pool.query(
        `UPDATE prescriptions SET status = 'verified' WHERE id = ?`,
        [prescriptionId]
      );
    }

    // 4. Update overall order status
    if (status === 'approved') {
      await pool.query(
        `UPDATE orders SET prescription_verified = 1 WHERE id = ?`,
        [orderId]
      );
    } else {
      await pool.query(
        `UPDATE orders SET prescription_verified = 0 WHERE id = ?`,
        [orderId]
      );
    }

    // 5. Send Email Notification
    if (items[0].customer_email) {
      sendPrescriptionStatusEmail(items[0].customer_email, {
        orderNumber: items[0].order_number,
        itemName: 'Order Prescription',
        status: status,
        notes: notes
      }).catch(err => console.error('Failed to send status email:', err));
    }

    res.json({
      message: `Order prescription ${status} successfully.`,
      orderId
    });
  } catch (error) {
    next(error);
  }
};
