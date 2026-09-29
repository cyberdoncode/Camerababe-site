// POST /.netlify/functions/save-review
//
// Same reliable pattern as save-booking.js: saves the review (Netlify Blobs,
// non-blocking — a database hiccup never stops the email), and emails the
// studio directly via Resend so it never depends on Formspree or the
// visitor's own email app.

const { getStore } = require('@netlify/blobs');

async function notifyStudio(record) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONFIRMATION_FROM || 'camerababe <onboarding@resend.dev>';
  const studioEmail = process.env.STUDIO_EMAIL || 'afridauhtercreationsltd@camerababe.com';

  if (!apiKey) {
    console.warn('notifyStudio: RESEND_API_KEY not set — skipping studio notification email');
    return { sent: false, reason: 'RESEND_API_KEY not set' };
  }

  const stars = '★'.repeat(Math.max(0, Math.min(5, parseInt(record.rating, 10) || 0)));

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#141413;line-height:1.6;">
      <p>New review submitted on the site (pending approval):</p>
      <table style="border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Name</td><td style="padding:4px 0;font-weight:600;">${record.name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Type of shoot</td><td style="padding:4px 0;">${record.shootType || '—'}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Rating</td><td style="padding:4px 0;">${stars || record.rating || '—'}</td></tr>
      </table>
      <p style="margin-top:1rem;color:#6b6459;">Review:</p>
      <p style="white-space:pre-wrap;">${(record.review || '(none provided)').replace(/</g, '&lt;')}</p>
      <p style="margin-top:1rem;font-size:12px;color:#9a9284;">Review ID: ${record.reviewId}</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [studioEmail],
      subject: `New review — ${record.shootType || 'Shoot'} — ${record.name}`,
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
  const shootType = (data.shootType || '').toString().trim().slice(0, 120);
  const rating = (data.rating || '').toString().trim().slice(0, 10);
  const review = (data.review || '').toString().trim().slice(0, 4000);

  if (!name || !review) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'name and review are required' }) };
  }

  const reviewId = 'rv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  const record = {
    reviewId,
    name,
    shootType,
    rating,
    review,
    status: 'pending', // pending -> approved once you publish it on the site
    createdAt: new Date().toISOString(),
  };

  // Saving to Blobs and emailing the studio are independent — a database
  // hiccup must never stop the notification email from going out.
  let saved = false;
  try {
    const store = getStore('reviews');
    await store.setJSON(reviewId, record);
    saved = true;
  } catch (err) {
    console.error('save-review: failed to write to Blobs store (continuing to email anyway)', err);
  }

  let notifyResult = { sent: false };
  try {
    notifyResult = await notifyStudio(record);
  } catch (err) {
    console.error('save-review: notifyStudio threw', err);
  }

  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewId, saved, notified: !!notifyResult.sent }),
  };
};
