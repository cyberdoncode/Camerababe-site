// GET /.netlify/functions/get-reviews
//
// Returns the published reviews (newest first) so the booking page can
// render real testimonials instead of a hand-edited static block. Reviews
// are auto-published the moment they're submitted (see save-review.js) — the
// studio still gets an email for every one, so nothing goes up unnoticed,
// but nothing needs manual publishing either.

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
    const store = getBlobsStore('reviews');
    const { blobs } = await store.list();

    const records = await Promise.all(
      blobs.map(function (b) { return store.get(b.key, { type: 'json' }).catch(function () { return null; }); })
    );

    // Anything not explicitly rejected is shown — this also covers reviews
    // saved before auto-publish existed (status: 'pending'), so nothing
    // already sitting in the store gets silently hidden.
    const published = records
      .filter(function (r) { return r && r.status !== 'rejected'; })
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
      .slice(0, 24)
      .map(function (r) {
        return {
          name: r.name,
          shootType: r.shootType,
          rating: r.rating,
          review: r.review,
          createdAt: r.createdAt,
        };
      });

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' },
      body: JSON.stringify({ reviews: published }),
    };
  } catch (err) {
    console.error('get-reviews: failed to list Blobs store', err);
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviews: [] }),
    };
  }
};
