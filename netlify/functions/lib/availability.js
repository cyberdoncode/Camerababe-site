// Shared availability rules for the booking calendar.
//
// Design (see discussion with the studio owner, Oct 2026): shoots vary
// wildly in length (a 1-hour portrait session vs an 8-hour wedding), so
// instead of trying to model real start/end times, availability is kept
// simple and honest:
//   - Each date can hold up to DAILY_CAP shoots.
//   - Each shoot picks one of three fixed time-of-day slots below, purely
//     as a stated preference the studio reviews and confirms manually —
//     not a strict scheduling guarantee.
//   - A date only becomes "taken" once a booking's deposit has actually
//     been paid (status: 'deposit_paid') — an unpaid inquiry never blocks
//     a date for anyone else.

const DAILY_CAP = 2;

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

// Builds { "YYYY-MM-DD": { takenSlots: ["morning"], count: 1, full: false } }
// from a list of booking records. Only counts deposit-paid bookings with a
// recognized date + timeSlot; anything else (inquiries, custom-quote
// bookings with no slot chosen yet, malformed records) is ignored rather
// than breaking the whole calendar.
function buildAvailabilityMap(bookings) {
  const map = {};
  bookings.forEach(function (b) {
    if (!b || !isPaid(b.status)) return;
    const date = (b.date || '').toString().trim();
    const slot = (b.timeSlot || '').toString().trim();
    if (!date) return;

    if (!map[date]) map[date] = { takenSlots: [], count: 0 };
    map[date].count += 1;
    if (slot && TIME_SLOT_IDS.indexOf(slot) !== -1 && map[date].takenSlots.indexOf(slot) === -1) {
      map[date].takenSlots.push(slot);
    }
  });

  Object.keys(map).forEach(function (date) {
    map[date].full = map[date].count >= DAILY_CAP;
  });

  return map;
}

// True if `date` (YYYY-MM-DD) + `timeSlot` id is still bookable given the
// current set of deposit-paid bookings — i.e. the day isn't already at
// DAILY_CAP, and that specific slot isn't already taken that day.
// `excludeBookingId` lets a booking check against everyone else's slots
// without being blocked by its own not-yet-paid record.
function isSlotAvailable(bookings, date, timeSlot, excludeBookingId) {
  const relevant = bookings.filter(function (b) {
    return b && isPaid(b.status) && b.date === date && b.bookingId !== excludeBookingId;
  });
  if (relevant.length >= DAILY_CAP) return false;
  if (timeSlot && relevant.some(function (b) { return b.timeSlot === timeSlot; })) return false;
  return true;
}

module.exports = { DAILY_CAP, TIME_SLOTS, TIME_SLOT_IDS, buildAvailabilityMap, isSlotAvailable };
