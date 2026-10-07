// GET /.netlify/functions/get-availability
//
// Public, read-only. Returns the time-slot config plus which dates already
// have a deposit-paid booking against them, so the booking page can grey
// out full dates and taken slots before the client even picks one. Does
// NOT expose names, emails, or anything else about who booked — just
// dates and slot ids.

const { getBlobsStore } = require('./lib/blobs-store');
const { DAILY_CAP, TIME_SLOTS, buildAvailabilityMap } = require('./lib/availability');

const ALLOWED_ORIGINS = [
  'https://www.camerababe.com',
  'https://camerababe.com',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

exports.handler = async function (event) {
  const headers = corsHeaders(event.headers && event.headers.origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const store = getBlobsStore('bookings');
    const { blobs } = await store.list();

    const records = await Promise.all(
      blobs.map(function (b) { return store.get(b.key, { type: 'json' }).catch(function () { return null; }); })
    );

    const availability = buildAvailabilityMap(records.filter(Boolean));

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({ dailyCap: DAILY_CAP, slots: TIME_SLOTS, availability }),
    };
  } catch (err) {
    console.error('get-availability: failed to list Blobs store', err);
    // Fail open with "nothing known to be taken" rather than blocking the
    // whole calendar — worst case a client picks an already-full date and
    // finds out at deposit time, same as before this feature existed.
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyCap: DAILY_CAP, slots: TIME_SLOTS, availability: buildAvailabilityMap([]) }),
    };
  }
};
