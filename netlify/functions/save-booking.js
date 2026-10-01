// POST /.netlify/functions/save-booking
//
// Saves a booking inquiry (from the Booking page form) into a real database
// (Netlify Blobs — built into Netlify, no extra account needed), hands back
// a bookingId, and emails the studio a notification directly (via Resend) —
// server-side, so it never depends on the visitor's browser reaching
// Formspree successfully, and never pops open anyone's email app.
//
// This runs ALONGSIDE Formspree (the booking form still also tries
// Formspree, unchanged) rather than replacing it — belt and suspenders.
// Needs RESEND_API_KEY set in Netlify to actually send the notification;
// without it, the booking is still safely saved, just not emailed.

const { getBlobsStore } = require('./lib/blobs-store');

async function notifyStudio(record) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONFIRMATION_FROM || 'camerababe <onboarding@resend.dev>';
  const studioEmail = process.env.STUDIO_EMAIL || 'afridauhtercreationsltd@camerababe.com';

  if (!apiKey) {
    console.warn('notifyStudio: RESEND_API_KEY not set — skipping studio notification email');
    return { sent: false, reason: 'RESEND_API_KEY not set' };
  }

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#141413;line-height:1.6;">
      <p>New booking inquiry from the site:</p>
      <table style="border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Name</td><td style="padding:4px 0;font-weight:600;">${record.name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Email</td><td style="padding:4px 0;">${record.email}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Phone</td><td style="padding:4px 0;">${record.phone || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Type of shoot</td><td style="padding:4px 0;">${record.eventType || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Preferred date</td><td style="padding:4px 0;">${record.date || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Location</td><td style="padding:4px 0;">${record.location || '—'}</td></tr>
      </table>
      <p style="margin-top:1rem;color:#6b6459;">Details:</p>
      <p style="white-space:pre-wrap;">${(record.message || '(none provided)').replace(/</g, '&lt;')}</p>
      <p style="margin-top:1rem;font-size:12px;color:#9a9284;">Booking ID: ${record.bookingId}</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [studioEmail],
      reply_to: record.email,
      subject: `New booking inquiry — ${record.eventType || 'Shoot'} — ${record.name}`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('notifyStudio: Resend send failed:', res.status, errText);
    return { sent: false, reason: `Resend error ${res.status}` };
  }
  return { sent: true };
}

const ALLOWED_ORIGINS = [
  'https://www.camerababe.com',
  'https://camerababe.com',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

exports.handler = async function (event) {
  const headers = corsHeaders(event.headers && event.headers.origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const name = (data.name || '').toString().trim().slice(0, 200);
  const email = (data.email || '').toString().trim().slice(0, 200);
  const phone = (data.phone || '').toString().trim().slice(0, 60);
  const eventType = (data.eventType || '').toString().trim().slice(0, 120);
  const date = (data.date || '').toString().trim().slice(0, 40);
  const location = (data.location || '').toString().trim().slice(0, 200);
  const message = (data.message || '').toString().trim().slice(0, 4000);

  if (!name || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'name and email are required' }) };
  }

  const bookingId = 'bk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  const record = {
    bookingId,
    name,
    email,
    phone,
    eventType,
    date,
    location,
    message,
    status: 'inquiry', // inquiry -> deposit_paid once verify-deposit confirms payment
    createdAt: new Date().toISOString(),
  };

  // Saving to Blobs and emailing the studio are independent — if the
  // database write fails for any reason, that must NOT stop the studio
  // notification email from going out. The email is the important part;
  // the database is a nice-to-have record on top of it.
  let saved = false;
  try {
    const store = getBlobsStore('bookings');
    await store.setJSON(bookingId, record);
    saved = true;
  } catch (err) {
    console.error('save-booking: failed to write to Blobs store (continuing to email anyway)', err);
  }

  let notifyResult = { sent: false };
  try {
    notifyResult = await notifyStudio(record);
  } catch (err) {
    console.error('save-booking: notifyStudio threw', err);
  }

  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, saved, notified: !!notifyResult.sent }),
  };
};
