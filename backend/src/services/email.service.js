// src/services/email.service.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const STATUS_MESSAGES = {
  PENDING: 'Your order has been placed and is pending assignment.',
  ASSIGNED: 'A delivery agent has been assigned to your order.',
  PICKED_UP: 'Your package has been picked up by the delivery agent.',
  IN_TRANSIT: 'Your package is in transit.',
  OUT_FOR_DELIVERY: 'Your package is out for delivery and will arrive soon!',
  DELIVERED: 'Your package has been delivered successfully. Thank you!',
  FAILED: 'Delivery attempt failed. Please reschedule your delivery.',
  RESCHEDULED: 'Your delivery has been rescheduled. We will attempt delivery on the new date.'
};

const sendStatusEmail = async ({ to, customerName, trackingId, status, note, scheduledDate }) => {
  const subject = `Order #${trackingId.slice(0, 8).toUpperCase()} - ${status.replace(/_/g, ' ')}`;
  const statusMsg = STATUS_MESSAGES[status] || `Order status updated to ${status}.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a56db; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">LastMile Delivery</h2>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>${statusMsg}</p>
        ${note ? `<p><em>Note: ${note}</em></p>` : ''}
        ${scheduledDate ? `<p><strong>Rescheduled Date:</strong> ${new Date(scheduledDate).toLocaleDateString()}</p>` : ''}
        <div style="background: #f3f4f6; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Tracking ID</p>
          <p style="margin: 4px 0 0; font-size: 18px; font-weight: bold; color: #111827;">${trackingId}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">Track your order at ${process.env.FRONTEND_URL}/track/${trackingId}</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });
  } catch (err) {
    // Log but don't crash the request if email fails
    console.error('Email send error:', err.message);
  }
};

module.exports = { sendStatusEmail };
