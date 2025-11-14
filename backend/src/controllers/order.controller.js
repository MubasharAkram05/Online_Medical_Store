import { validationResult } from 'express-validator';
import crypto from 'crypto';
import { getPool } from '../config/database.js';
import { findMedicinesByIds, decrementMedicineStock } from '../models/medicine.model.js';
import { createOrder, createOrderItems, getOrdersByUser, getOrderWithItems } from '../models/order.model.js';
import { hasAnyPrescription, hasVerifiedPrescription } from '../models/prescription.model.js';
import { createPayment } from '../models/payment.model.js';
import { findInteractionPairs } from '../models/interaction.model.js';
import { buildInteractionWarnings } from '../utils/interactions.js';
import { generateInvoicePDF } from '../utils/invoicePdf.js';

const SHIPPING_FEE = 200;
const TAX_RATE = 0.05;

const buildOrderResponse = (order, items, payment) => ({
  id: order.id,
  orderNumber: order.order_number,
  status: order.status,
  paymentMethod: order.payment_method,
  subtotalAmount: Number(order.subtotal_amount),
  taxAmount: Number(order.tax_amount),
  shippingFee: Number(order.shipping_fee),
  totalAmount: Number(order.total_amount),
  prescriptionVerified: Boolean(order.prescription_verified),
  fullName: order.full_name,
  email: order.email,
  phone: order.phone,
  address: order.address,
  city: order.city,
  postalCode: order.postal_code,
  createdAt: order.created_at,
  payment: payment
    ? {
        id: payment.id,
        status: payment.status,
        amount: Number(payment.amount),
        method: payment.method,
        transactionId: payment.transaction_id,
        reference: payment.reference,
        receiptUrl: payment.receipt_url,
        capturedAt: payment.captured_at,
        createdAt: payment.created_at
      }
    : null,
  items: items.map((item) => ({
    id: item.id,
    medicineId: item.medicine_id,
    name: item.name,
    quantity: item.quantity,
    unitPrice: Number(item.unit_price),
    totalPrice: Number(item.total_price),
    requiresPrescription: Boolean(item.requires_prescription),
    imageUrl: item.image_url
  }))
});

const generateOrderNumber = () => {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${Date.now().toString().slice(-8)}-${random}`;
};

export const checkout = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  const {
    items,
    payment_method: paymentMethod,
    fullName,
    email,
    phone,
    address,
    city,
    postalCode
  } = req.body;
const paymentDetails = req.body.payment || {};

  if (!items || !items.length) {
    return res.status(400).json({
      error: {
        message: 'Cart is empty'
      }
    });
  }

  try {
    const medicineIds = [...new Set(items.map((item) => item.medicine_id))];
    const medicines = await findMedicinesByIds(medicineIds);

    if (medicines.length !== medicineIds.length) {
      const foundIds = new Set(medicines.map((med) => med.id));
      const missingIds = medicineIds.filter((id) => !foundIds.has(id));
      return res.status(400).json({
        error: {
          message: 'One or more medicines in the cart are not available',
          missingMedicineIds: missingIds
        }
      });
    }

    const medicinesMap = new Map(medicines.map((med) => [med.id, med]));

    const orderItems = items.map((item) => {
      const medicine = medicinesMap.get(item.medicine_id);
      const quantity = Number(item.quantity) || 1;

      if (quantity <= 0) {
        const error = new Error('Invalid quantity for item');
        error.status = 400;
        throw error;
      }

      if (medicine.stock < quantity) {
        const error = new Error(`Insufficient stock for ${medicine.name}`);
        error.status = 400;
        throw error;
      }

      const unitPrice = Number(medicine.price);
      return {
        medicineId: medicine.id,
        name: medicine.name,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        requiresPrescription: Boolean(medicine.requires_prescription)
      };
    });

    const requiresPrescription = orderItems.some((item) => item.requiresPrescription);
    let prescriptionVerifiedFlag = false;

    if (requiresPrescription) {
      const hasPrescription = await hasAnyPrescription(req.user.id);
      if (!hasPrescription) {
        return res.status(400).json({
          error: {
            message: 'Prescription required. Please upload a prescription before placing this order.'
          }
        });
      }
      prescriptionVerifiedFlag = await hasVerifiedPrescription(req.user.id);
    }

    const interactionRows = await findInteractionPairs(medicineIds);
    const interactionWarnings = buildInteractionWarnings(medicines, interactionRows);
    const hasCriticalInteraction = interactionWarnings.some((warning) => warning.severity === 'critical');

    if (hasCriticalInteraction) {
      return res.status(400).json({
        error: {
          message: 'Dangerous medicine interactions detected. Please review your cart.',
          details: interactionWarnings
        }
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const shipping = SHIPPING_FEE;
    const total = Number((subtotal + tax + shipping).toFixed(2));

    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();

      const orderId = await createOrder(connection, {
        userId: req.user.id,
        orderNumber: generateOrderNumber(),
        paymentMethod,
        subtotal,
        tax,
        shipping,
        total,
        prescriptionVerified: prescriptionVerifiedFlag,
        fullName,
        email,
        phone,
        address,
        city,
        postalCode
      });

      await createOrderItems(connection, orderId, orderItems);
      await decrementMedicineStock(connection, orderItems);

      const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'completed';
      const capturedAt = paymentStatus === 'completed' ? new Date() : null;

      await createPayment(connection, {
        orderId,
        method: paymentMethod,
        status: paymentStatus,
        amount: total,
        transactionId: paymentDetails.transactionId,
        reference: paymentDetails.reference,
        receiptUrl: paymentDetails.receiptUrl,
        capturedAt
      });

      await connection.commit();

      const { order, items: orderItemRows, payment } = await getOrderWithItems(req.user.id, orderId);

      res.status(201).json({
        order: buildOrderResponse(order, orderItemRows, payment),
        message: prescriptionVerifiedFlag
          ? 'Order placed successfully.'
          : 'Order placed and pending prescription verification.',
        warnings: interactionWarnings
      });
    } catch (error) {
      await connection.rollback();
      if (!error.status) {
        error.status = 500;
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
};

export const listOrders = async (req, res, next) => {
  try {
    const orders = await getOrdersByUser(req.user.id);
    res.json({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        totalAmount: Number(order.total_amount),
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status || (order.payment_method === 'cod' ? 'pending' : 'completed'),
        prescriptionVerified: Boolean(order.prescription_verified),
        createdAt: order.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!orderId) {
      return res.status(400).json({
        error: {
          message: 'Invalid order id'
        }
      });
    }

    const data = await getOrderWithItems(req.user.id, orderId);
    if (!data) {
      return res.status(404).json({
        error: {
          message: 'Order not found'
        }
      });
    }

    res.json({
      order: buildOrderResponse(data.order, data.items, data.payment)
    });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!orderId) {
      return res.status(400).json({
        error: {
          message: 'Invalid order id'
        }
      });
    }

    const data = await getOrderWithItems(req.user.id, orderId);
    if (!data) {
      return res.status(404).json({
        error: {
          message: 'Order not found'
        }
      });
    }

    const { order, items, payment } = data;

    const invoice = {
      title: `${process.env.APP_NAME || 'Online Medical Store'} Invoice`,
      invoiceNumber: `INV-${order.order_number}`,
      orderNumber: order.order_number,
      orderDate: order.created_at,
      customer: {
        name: order.full_name,
        email: order.email,
        phone: order.phone,
        address: order.address,
        city: order.city,
        postalCode: order.postal_code
      },
      payment: payment
        ? {
            method: payment.method,
            status: payment.status,
            amount: Number(payment.amount),
            transactionId: payment.transaction_id,
            reference: payment.reference
          }
        : {
            method: order.payment_method,
            status: order.payment_method === 'cod' ? 'pending' : 'completed',
            amount: Number(order.total_amount)
          },
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price)
      })),
      totals: {
        subtotal: Number(order.subtotal_amount),
        tax: Number(order.tax_amount),
        shipping: Number(order.shipping_fee),
        total: Number(order.total_amount)
      }
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${order.order_number}.pdf`
    );
    generateInvoicePDF(invoice, res);
  } catch (error) {
    next(error);
  }
};

