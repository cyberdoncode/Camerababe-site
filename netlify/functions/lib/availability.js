// Shared availability rules for the booking calendar.
//
// Design (see discussion with the studio owner, Oct 2026 — updated after
// she raised her daily capacity to 5): shoots vary wildly in length (a
// 1-hour portrait session vs an 8-hour wedding), so instead of trying to
// model real start/end times, availability is kept simple and honest:
//   - Each date can hold up to DAILY_CAP shoots in total.
//   - Each shoot picks one of three fixed time-of-day slots below, purely
//     as a stated preference the studio reviews and confirms manually —
//     not an exclusive booking slot. More than one shoot can share the
//     same time-of-day label (e.g. three "Morning" bookings in one day);
//     only the total count against DAILY_CAP actually blocks a date.
//   - A date only becomes "taken" once a booking's deposit has actually
//     been paid (status: 'deposit_paid') — an unpaid inquiry never blocks
//     a date for anyone else.

const DAILY_CAP = 5;

// Dates the studio has marked fully booked by hand (travel, an out-of-town
// job, a private engagement — anything that isn't a paid website booking).
// Inclusive ranges, YYYY-MM-DD. To block or unblock days later, edit this
// list (and the matching BLOCKED_RANGES list at the top of main.js), then
// redeploy.
const BLOCKED_RANGES = [
  { from: '2026-10-22', to: '2026-10-31' },
];

function expandBlockedDates() {
  const out = [];
  BLOCKED_RANGES.forEach(function (r) {
    const d = new Date(r.from + 'T00:00:00Z');
    const end = new Date(r.to + 'T00:00:00Z');
    while (d <= end) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  });
  return out;
}
const BLOCKED_DATES = expandBlockedDates();

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (9am–12pm)' },
  { id: 'afternoon', label: 'Afternoon (1pm–4pm)' },
  { id: 'evening', label: 'Evening (5pm–8pm)' },
];

const TIME_SLOT_IDS = TIME_SLOTS.map(function (s) { return s.id; });

// A booking counts against capacity once real money has moved for it —
// that includes 'deposit_paid_conflict' (flagged for the studio to sort
// out manually, see verify-deposit.js) as well as a clean 'deposit_paid',
// since both represent an actual paid commitment, not just an inquiry.
function isPaid(status) {
  return status === 'deposit_paid' || status === 'deposit_paid_conflict';
}

// Builds { "YYYY-MM-DD": { slotCounts: {morning:2,afternoon:0,evening:1},
// count: 3, full: false } } from a list of booking records. slotCounts is
// informational only (lets the UI show "2 already booked that morning")
// — it never disables a slot, since slots aren't exclusive. Only counts
// deposit-paid bookings with a recognized date; a missing/unrecognized
// timeSlot still counts toward the day's total, it just isn't tallied
// under any specific slot.
function buildAvailabilityMap(bookings) {
  const map = {};
  bookings.forEach(function (b) {
    if (!b || !isPaid(b.status)) return;
    const date = (b.date || '').toString().trim();
    const slot = (b.timeSlot || '').toString().trim();
    if (!date) return;

    if (!map[date]) map[date] = { slotCounts: {}, count: 0 };
    map[date].count += 1;
    if (slot && TIME_SLOT_IDS.indexOf(slot) !== -1) {
      map[date].slotCounts[slot] = (map[date].slotCounts[slot] || 0) + 1;
    }
  });

  Object.keys(map).forEach(function (date) {
    map[date].full = map[date].count >= DAILY_CAP;
  });

  // Hand-blocked dates always show as fully booked, whatever the bookings say.
  BLOCKED_DATES.forEach(function (date) {
    map[date] = { slotCounts: {}, count: DAILY_CAP, full: true, blocked: true };
  });

  return map;
}

// True if `date` is still bookable given the current set of deposit-paid
// bookings — i.e. the day isn't already at DAILY_CAP. `timeSlot` is kept
// in the signature for callers that still pass it, but slots aren't
// exclusive, so it has no effect on the result. `excludeBookingId` lets a
// booking check against everyone else's count without being blocked by
// its own not-yet-paid record.
function isSlotAvailable(bookings, date, timeSlot, excludeBookingId) {
  if (BLOCKED_DATES.indexOf(date) !== -1) return false;
  const relevant = bookings.filter(function (b) {
    return b && isPaid(b.status) && b.date === date && b.bookingId !== excludeBookingId;
  });
  return relevant.length < DAILY_CAP;
}

module.exports = { BLOCKED_DATES, DAILY_CAP, TIME_SLOTS, TIME_SLOT_IDS, buildAvailabilityMap, isSlotAvailable };
