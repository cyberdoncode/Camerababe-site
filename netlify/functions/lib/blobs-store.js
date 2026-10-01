// Shared helper for every function that talks to Netlify Blobs.
//
// Netlify is supposed to auto-inject the site ID + token a Function needs to
// reach its Blobs store, with zero configuration. On this site that
// auto-wiring isn't happening — getStore(name) alone throws
// "MissingBlobsEnvironmentError: The environment has not been configured to
// use Netlify Blobs" (confirmed in the Function logs). The documented fix is
// to stop relying on the automatic context and pass the site ID + a token
// explicitly, which is what this does.
//
// Needs two environment variables set in Netlify (Site settings ->
// Environment variables), same place as PAYSTACK_SECRET_KEY etc:
//   BLOBS_SITE_ID  - Site settings -> General -> Site details -> Site ID
//   BLOBS_TOKEN    - a Personal Access Token: click your avatar (top right)
//                    -> User settings -> Applications -> New access token
//
// If those two aren't set yet, this falls back to the automatic method (so
// nothing here makes things worse) — but until they're added, every save
// will keep failing exactly as before.

const { getStore } = require('@netlify/blobs');

function getBlobsStore(name) {
  const siteID = process.env.BLOBS_SITE_ID;
  const token = process.env.BLOBS_TOKEN;

  if (siteID && token) {
    return getStore({ name, siteID, token });
  }

  console.warn(
    `getBlobsStore("${name}"): BLOBS_SITE_ID / BLOBS_TOKEN are not set — ` +
    'falling back to automatic Blobs context, which has been failing on this site.'
  );
  return getStore(name);
}

module.exports = { getBlobsStore };
