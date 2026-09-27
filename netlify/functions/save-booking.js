// POST /.netlify/functions/save-booking
//
// Saves a booking inquiry (from the Booking page form) into a real database
// (Netlify Blobs — built into Netlify, no extra account needed) and hands
// back a bookingId. The front end keeps that id and attaches it to the
// deposit payment later, so verify-deposit.js can update the same record
// instead of creating a disconnected one.
//
// This does NOT replace Formspree — the booking form still emails you via
// Formspree as before. This just also keeps a structured, searchable record.

const { getStore } = require('@netlify/blobs');

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

  try {
    const store = getStore('bookings');
    await store.setJSON(bookingId, record);
  } catch (err) {
    console.error('save-booking: failed to write to Blobs store', err);
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Could not save booking right now' }) };
  }

  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId }),
  };
};
