import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  secure: env.emailSecure,
  auth: env.emailUser && env.emailPassword
    ? {
      user: env.emailUser,
      pass: env.emailPassword
    }
    : undefined
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"${env.emailFromName}" <${env.emailFromAddress}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to: options.to }, 'Email sent successfully');
    return info;
  } catch (error) {
    logger.error({ error: error.message, to: options.to }, 'Failed to send email');
    // Don't throw if email fails in dev, but log it
    if (env.nodeEnv === 'production') {
      throw error;
    }
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetLink - The password reset link
 */
export const sendPasswordResetEmail = async (to, resetLink) => {
  const subject = 'Password Reset Request - Online Medical Store';
  const text = `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 30 minutes. If you didn't request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f8b7f; text-align: center;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>You requested to reset your password for your <strong>Online Medical Store</strong> account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #0f8b7f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetLink}</p>
      <p>This link will expire in <strong>30 minutes</strong>.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

/**
 * Send prescription status update email
 * @param {string} to - Recipient email
 * @param {Object} data - Update details
 */
export const sendPrescriptionStatusEmail = async (to, data) => {
  const { orderNumber, itemName, status, notes } = data;
  const isApproved = status === 'approved';
  const subject = `Prescription ${status === 'approved' ? 'Approved' : 'Rejected'} - Order #${orderNumber}`;

  const text = isApproved
    ? `Good news! Your prescription for ${itemName} in Order #${orderNumber} has been approved.`
    : `Important: Your prescription for ${itemName} in Order #${orderNumber} was rejected. Reason: ${notes || 'Please use a valid prescription.'}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: ${isApproved ? '#10b981' : '#ef4444'}; text-align: center;">Prescription ${isApproved ? 'Approved' : 'Rejected'}</h2>
      <p>Hello,</p>
      <p>This is an update regarding the prescription for <strong>${itemName}</strong> in your order <strong>#${orderNumber}</strong>.</p>
      <div style="background-color: ${isApproved ? '#ecfdf5' : '#fef2f2'}; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid ${isApproved ? '#10b981' : '#ef4444'};">
        <p style="margin: 0; font-weight: bold; color: ${isApproved ? '#065f46' : '#991b1b'};">
          Status: ${status.toUpperCase()}
        </p>
        ${notes ? `<p style="margin: 10px 0 0 0; color: #374151;"><strong>Admin Note:</strong> ${notes}</p>` : ''}
      </div>
      ${!isApproved ? '<p style="color: #6b7280; font-size: 14px;">Please log in to your account to upload a valid prescription or contact support if you have questions.</p>' : ''}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.frontendUrl}/orders" style="background-color: #0f8b7f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order Status</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        Online Medical Store Management System
      </p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};
