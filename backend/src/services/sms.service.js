// src/services/sms.service.js
// Uses Fast2SMS free tier (Indian numbers) or any REST SMS gateway
// Set SMS_PROVIDER=fast2sms or SMS_PROVIDER=twilio in .env

const STATUS_SMS = {
  PENDING:          'Your LastMile order has been placed. Tracking ID: {id}',
  ASSIGNED:         'A delivery agent has been assigned to your LastMile order {id}.',
  PICKED_UP:        'Your package has been picked up. LastMile order {id} is on its way.',
  IN_TRANSIT:       'Your LastMile order {id} is in transit.',
  OUT_FOR_DELIVERY: 'Your LastMile order {id} is out for delivery. Expect it today!',
  DELIVERED:        'Your LastMile order {id} has been delivered. Thank you!',
  FAILED:           'Delivery failed for LastMile order {id}. Please reschedule via the app.',
  RESCHEDULED:      'Your LastMile order {id} has been rescheduled successfully.'
};

const sendSMS = async ({ phone, status, trackingId }) => {
  if (!phone) return;
  if (!process.env.SMS_API_KEY) {
    console.log(`[SMS SKIPPED - no SMS_API_KEY] To: ${phone}, Status: ${status}`);
    return;
  }

  const shortId = trackingId.slice(0, 8).toUpperCase();
  const message = (STATUS_SMS[status] || `Order ${shortId} status: ${status}`).replace('{id}', shortId);

  try {
    if (process.env.SMS_PROVIDER === 'fast2sms') {
      // Fast2SMS free tier (India)
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message,
          language: 'english',
          flash: 0,
          numbers: phone
        })
      });
      const data = await res.json();
      if (!data.return) console.error('Fast2SMS error:', data);
    } else if (process.env.SMS_PROVIDER === 'twilio') {
      // Twilio
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken  = process.env.TWILIO_AUTH_TOKEN;
      const from       = process.env.TWILIO_FROM;
      const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ To: phone, From: from, Body: message })
      });
    }
    console.log(`[SMS SENT] To: ${phone}, Status: ${status}`);
  } catch (err) {
    console.error('SMS send error:', err.message);
  }
};

module.exports = { sendSMS };
