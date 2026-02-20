import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
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
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
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
        if (process.env.NODE_ENV === 'production') {
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
