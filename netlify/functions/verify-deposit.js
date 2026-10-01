// POST /.netlify/functions/verify-deposit
//
// Called right after Paystack's checkout closes with a reference. Instead of
// trusting the browser's callback alone (which anyone could fake by calling
// the same JS function), this asks Paystack's server directly whether that
// reference really was paid, for how much, and only then:
//   1. marks the matching booking record as paid in Netlify Blobs
//   2. emails the client a real confirmation (via Resend), BCC'd to the
//      studio inbox
//
// Required environment variables (set in Netlify's dashboard, never in code
// or committed to the repo):
//   PAYSTACK_SECRET_KEY   - sk_live_... from Paystack (Settings > API Keys)
//   RESEND_API_KEY        - from resend.com
//   STUDIO_EMAIL          - afridauhtercreationsltd@camerababe.com (BCC target)
//   CONFIRMATION_FROM     - the "from" address Resend sends as (see notes
//                           in handoff.html about domain verification)

const { getBlobsStore } = require('./lib/blobs-store');

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

async function verifyWithPaystack(reference) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not set in this environment');
  }
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error('Paystack verify request failed: ' + (json.message || res.status));
  }
  return json.data; // { status, amount (kobo), currency, customer, reference, ... }
}

async function sendConfirmationEmail({ toEmail, packageLabel, amountNaira, reference }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONFIRMATION_FROM || 'camerababe <onboarding@resend.dev>';
  const studioEmail = process.env.STUDIO_EMAIL || 'afridauhtercreationsltd@camerababe.com';

  if (!apiKey) {
    console.warn('sendConfirmationEmail: RESEND_API_KEY not set — skipping email send');
    return { sent: false, reason: 'RESEND_API_KEY not set' };
  }

  const amountDisplay = '₦' + Math.round(amountNaira).toLocaleString('en-NG');
  const subject = 'Your camerababe deposit is confirmed';
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;color:#141413;line-height:1.6;">
      <p>Hi,</p>
      <p>Your deposit has been received and your booking is confirmed.</p>
      <table style="margin:1rem 0;border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Package</td><td style="padding:4px 0;font-weight:600;">${packageLabel}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Deposit paid</td><td style="padding:4px 0;font-weight:600;">${amountDisplay}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b6459;">Reference</td><td style="padding:4px 0;font-family:monospace;">${reference}</td></tr>
      </table>
      <p>I'll be in touch to confirm the remaining details for your session. If anything above looks wrong, just reply to this email.</p>
      <p>— camerababe</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      bcc: [studioEmail],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('Resend send failed:', res.status, errText);
    return { sent: false, reason: `Resend error ${res.status}` };
  }

  return { sent: true };
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

  const reference = (data.reference || '').toString().trim();
  const bookingId = (data.bookingId || '').toString().trim();
  const email = (data.email || '').toString().trim();
  const packageLabel = (data.packageLabel || 'Deposit').toString().trim().slice(0, 200);

  if (!reference || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'reference and email are required' }) };
  }

  let paystackData;
  try {
    paystackData = await verifyWithPaystack(reference);
  } catch (err) {
    console.error('verify-deposit: Paystack verification failed', err);
    return {
      statusCode: 502,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: false, error: 'Could not verify payment with Paystack' }),
    };
  }

  const isSuccessful = paystackData.status === 'success';
  const amountNaira = (paystackData.amount || 0) / 100;

  if (!isSuccessful) {
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: false, status: paystackData.status }),
    };
  }

  // Update (or create) the booking record in Netlify Blobs.
  try {
    const store = getBlobsStore('bookings');
    let record = null;
    if (bookingId) {
      record = await store.get(bookingId, { type: 'json' });
    }
    if (!record) {
      record = { bookingId: bookingId || reference, createdAt: new Date().toISOString() };
    }
    record.status = 'deposit_paid';
    record.email = record.email || email;
    record.packageLabel = packageLabel;
    record.depositAmountNaira = amountNaira;
    record.paystackReference = reference;
    record.paidAt = new Date().toISOString();

    await store.setJSON(record.bookingId, record);
  } catch (err) {
    // Payment is real and verified either way — a storage hiccup shouldn't
    // block confirming the client, but it's worth logging loudly.
    console.error('verify-deposit: failed to update Blobs record', err);
  }

  let emailResult = { sent: false };
  try {
    emailResult = await sendConfirmationEmail({ toEmail: email, packageLabel, amountNaira, reference });
  } catch (err) {
    console.error('verify-deposit: email send threw', err);
  }

  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verified: true,
      amountNaira,
      reference,
      emailSent: !!emailResult.sent,
    }),
  };
};
