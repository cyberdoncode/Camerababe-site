// camerababe — shared site behavior

// Always land at the top of a page — stops the browser from restoring a
// previously-scrolled position (e.g. tab reuse or back/forward cache), which
// was causing "Book a shoot" to sometimes open already scrolled down.
(function () {
  if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
  if (!location.hash) { window.scrollTo(0, 0); }
  window.addEventListener('pageshow', function () {
    if (!location.hash) { window.scrollTo(0, 0); }
  });
})();

document.addEventListener('DOMContentLoaded', function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Light / dark theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const next = isLight ? 'dark' : 'light';
      if (next === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      try { localStorage.setItem('camerababe-theme', next); } catch (e) {}
    });
  }

  // Header background on scroll
  const nav = document.getElementById('siteNav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
  }

  // Mobile nav toggle + body scroll lock
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuBtn.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open);
      document.documentElement.classList.toggle('nav-open', open);
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuBtn.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', false);
      document.documentElement.classList.remove('nav-open');
    }));
  }

  // Portfolio category photo viewer
  const stage = document.getElementById('viewerFrame');
  if (stage && window.PORTFOLIO_VIEWER) {
    const cfg = window.PORTFOLIO_VIEWER;
    const photos = cfg.photos;
    let index = 0;

    const imgEl = document.getElementById('viewerImg');
    const numEl = document.getElementById('viewerNum');
    const titleEl = document.getElementById('viewerTitle');
    const textEl = document.getElementById('viewerText');
    const counterEl = document.getElementById('viewerCounter');
    const prevBtn = document.getElementById('viewerPrev');
    const nextBtn = document.getElementById('viewerNext');

    function render() {
      const p = photos[index];
      imgEl.src = p.src;
      imgEl.alt = p.alt;
      imgEl.style.animation = 'none';
      void imgEl.offsetWidth; // restart fade-in
      imgEl.style.animation = '';
      numEl.textContent = p.num;
      titleEl.textContent = p.title;
      textEl.textContent = p.text;
      counterEl.textContent = (index + 1) + ' / ' + photos.length;

      if (index === 0) {
        prevBtn.href = cfg.backHref;
        prevBtn.querySelector('.label').textContent = cfg.backLabel;
      } else {
        prevBtn.href = '#';
        prevBtn.querySelector('.label').textContent = 'Previous photo';
      }

      if (index === photos.length - 1) {
        nextBtn.href = cfg.nextHref;
        nextBtn.querySelector('.label').textContent = cfg.nextLabel;
      } else {
        nextBtn.href = '#';
        nextBtn.querySelector('.label').textContent = 'Next photo';
      }
    }

    prevBtn.addEventListener('click', function (e) {
      if (index > 0) {
        e.preventDefault();
        index -= 1;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    nextBtn.addEventListener('click', function (e) {
      if (index < photos.length - 1) {
        e.preventDefault();
        index += 1;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    render();
  }

  // Online deposit payment -> Paystack Inline
  const PAYSTACK_PUBLIC_KEY = 'pk_live_8cc948f650be249b1eaa0bbb39df4995b4058838';
  const STANDARD_DEPOSIT_RATE = 0.5; // 50% deposit on every priced package below
  const payDepositBtn = document.getElementById('payDepositBtn');
  const payDepositForm = document.getElementById('payDepositForm');
  const packageSelect = document.getElementById('packageSelect');
  const depositSummary = document.getElementById('depositSummary');
  const fullPriceDisplay = document.getElementById('fullPriceDisplay');
  const depositAmountDisplay = document.getElementById('depositAmountDisplay');
  const depositFromNote = document.getElementById('depositFromNote');
  const customAmountField = document.getElementById('customAmountField');
  const payAmountInput = document.getElementById('payAmount');
  const payEmailInput = document.getElementById('payEmail');
  const payConfirmMsg = document.getElementById('payConfirmMsg');

  function formatNaira(n) {
    return '₦' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  if (payDepositBtn && payDepositForm) {
    payDepositBtn.addEventListener('click', function () {
      payDepositForm.classList.toggle('open');
      if (payDepositForm.classList.contains('open') && packageSelect) {
        packageSelect.focus();
      }
    });
  }

  if (packageSelect) {
    packageSelect.addEventListener('change', function () {
      const opt = packageSelect.options[packageSelect.selectedIndex];
      const isCustom = opt.dataset.custom === '1';

      if (payConfirmMsg) { payConfirmMsg.classList.remove('show'); payConfirmMsg.textContent = ''; }

      if (isCustom) {
        if (depositSummary) depositSummary.style.display = 'none';
        if (customAmountField) customAmountField.style.display = '';
        if (payAmountInput) { payAmountInput.required = true; payAmountInput.focus(); }
        return;
      }

      if (customAmountField) customAmountField.style.display = 'none';
      if (payAmountInput) { payAmountInput.required = false; payAmountInput.value = ''; }

      const price = parseFloat(opt.dataset.price) || 0;
      const isFrom = opt.dataset.from === '1';
      const rate = parseFloat(opt.dataset.deposit) || STANDARD_DEPOSIT_RATE;
      const deposit = price * rate;
      const depLabel = document.getElementById('depositLabel');
      if (depLabel) depLabel.textContent = 'Deposit due now (' + Math.round(rate * 100) + '%)';

      if (fullPriceDisplay) fullPriceDisplay.textContent = (isFrom ? 'From ' : '') + formatNaira(price);
      if (depositAmountDisplay) depositAmountDisplay.textContent = formatNaira(deposit);
      if (depositFromNote) {
        depositFromNote.textContent = isFrom
          ? 'This package starts from the price above — the final total (and remaining balance) may be higher once the scope of your session is confirmed.'
          : '';
      }
      if (depositSummary) depositSummary.style.display = '';
    });
  }

  if (payDepositForm) {
    payDepositForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const opt = packageSelect ? packageSelect.options[packageSelect.selectedIndex] : null;
      const isCustom = opt && opt.dataset.custom === '1';
      const email = payEmailInput.value.trim();

      let amountNaira;
      let packageLabel;

      if (!opt || !opt.value) {
        if (payConfirmMsg) {
          payConfirmMsg.textContent = 'Please choose what you\'re booking first.';
          payConfirmMsg.classList.add('show');
        }
        return;
      }

      if (isCustom) {
        amountNaira = parseFloat(payAmountInput.value);
        packageLabel = 'Custom quote (weddings / larger events)';
      } else {
        const price = parseFloat(opt.dataset.price) || 0;
        amountNaira = price * (parseFloat(opt.dataset.deposit) || STANDARD_DEPOSIT_RATE);
        packageLabel = opt.textContent;
      }

      if (!amountNaira || amountNaira <= 0 || !email) {
        if (payConfirmMsg) {
          payConfirmMsg.textContent = 'Please enter a valid deposit amount and email.';
          payConfirmMsg.classList.add('show');
        }
        return;
      }

      const payNowBtn = document.getElementById('payNowBtn');
      if (payNowBtn) { payNowBtn.disabled = true; payNowBtn.textContent = 'Checking date availability...'; }

      // One more check, right before money moves: the calendar already
      // kept them off a full date when they picked it, but time has
      // passed since then — someone else could have paid for that same
      // date/slot in the meantime. This doesn't fully close the race (the
      // server does the final, authoritative check at verify-deposit) but
      // it catches the common case before Paystack even opens.
      let storedDate = null, storedTimeSlot = null;
      try {
        storedDate = sessionStorage.getItem('camerababe_bookingDate');
        storedTimeSlot = sessionStorage.getItem('camerababe_bookingTimeSlot');
      } catch (err) {}

      const proceedToCheckout = function () {
        if (payNowBtn) { payNowBtn.textContent = 'Opening secure checkout...'; }
        openPaystackCheckout(amountNaira, email, packageLabel);
      };

      if (storedDate) {
        fetch('/api/get-availability')
          .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('bad status')); })
          .then(function (data) {
            const info = data.availability && data.availability[storedDate];
            const isFull = !!(info && info.full);

            if (isFull) {
              if (payNowBtn) { payNowBtn.disabled = false; payNowBtn.textContent = 'Continue to Paystack'; }
              if (payConfirmMsg) {
                payConfirmMsg.textContent = 'That date just filled up with other bookings — please go back up, pick a different date, and resubmit before paying.';
                payConfirmMsg.classList.add('show');
              }
              return;
            }
            proceedToCheckout();
          })
          .catch(function () {
            // Couldn't reach the availability check — don't block a real
            // payment over a connectivity hiccup; the server still does
            // the authoritative check when the deposit is verified.
            proceedToCheckout();
          });
      } else {
        proceedToCheckout();
      }
    });
  }

  function openPaystackCheckout(amountNaira, email, packageLabel) {
      const payNowBtn = document.getElementById('payNowBtn');
      const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: Math.round(amountNaira * 100), // kobo
        currency: 'NGN',
        ref: 'camerababe_' + Math.floor(Math.random() * 1000000000) + '_' + Date.now(),
        metadata: {
          custom_fields: [
            { display_name: 'Package', variable_name: 'package', value: packageLabel },
            { display_name: 'Source', variable_name: 'source', value: 'camerababe booking page' }
          ]
        },
        callback: function (response) {
          if (payConfirmMsg) {
            payConfirmMsg.textContent = 'Payment received — reference ' + response.reference + '. Confirming with Paystack...';
            payConfirmMsg.classList.add('show');
          }
          if (typeof gtag === 'function') {
            gtag('event', 'deposit_paid', { value: amountNaira, currency: 'NGN', package: packageLabel });
          }
          if (payNowBtn) { payNowBtn.disabled = false; payNowBtn.textContent = 'Continue to Paystack'; }

          // Server-side verification: confirm with Paystack directly (rather
          // than trusting this in-browser callback alone) and record the
          // paid booking. If the API isn't reachable (e.g. this preview
          // isn't running on Netlify, or the function isn't deployed yet),
          // fail gracefully — the payment still went through on Paystack's
          // side either way, so tell the client it'll be confirmed manually.
          let storedBookingId = null;
          try { storedBookingId = sessionStorage.getItem('camerababe_bookingId'); } catch (e) {}

          fetch('/api/verify-deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference: response.reference,
              bookingId: storedBookingId || undefined,
              email: email,
              packageLabel: packageLabel
            })
          })
          .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('verify-deposit returned ' + res.status)); })
          .then(function (result) {
            if (payConfirmMsg) {
              if (result.verified) {
                payConfirmMsg.textContent = 'Payment confirmed — reference ' + response.reference + '. A confirmation email is on its way' + (result.emailSent ? '.' : ', and I\'ll follow up personally shortly.');
              } else {
                payConfirmMsg.textContent = 'Paystack shows this payment as "' + (result.status || 'unconfirmed') + '" — reference ' + response.reference + '. I\'ll check this manually and follow up.';
              }
              payConfirmMsg.classList.add('show');
            }
          })
          .catch(function () {
            if (payConfirmMsg) {
              payConfirmMsg.textContent = 'Payment received — reference ' + response.reference + '. I\'ll confirm your booking by email shortly.';
              payConfirmMsg.classList.add('show');
            }
          });
        },
        onClose: function () {
          if (payNowBtn) { payNowBtn.disabled = false; payNowBtn.textContent = 'Continue to Paystack'; }
        }
      });

      if (typeof gtag === 'function') {
        gtag('event', 'begin_checkout', { value: amountNaira, currency: 'NGN', package: packageLabel });
      }

      handler.openIframe();
  }

  // After a booking request is sent, guide the client straight into the
  // payment picker so they can secure the date now rather than just wait on
  // an email back-and-forth.
  function promptForDeposit() {
    const paymentBox = document.getElementById('paymentBox');
    if (!paymentBox) return;
    if (payDepositForm && !payDepositForm.classList.contains('open')) {
      payDepositForm.classList.add('open');
    }
    setTimeout(function () {
      paymentBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (packageSelect) packageSelect.focus();
    }, 400);
  }

  // Booking calendar: shows which dates already have a deposit-paid shoot
  // against them (greyed out once the studio's daily cap is hit) and lets
  // the client pick one of the fixed time-of-day slots for whichever date
  // they choose. The date itself is a hard check against real bookings;
  // the time is a stated preference the studio confirms manually — shoots
  // vary too much in length (an hour vs a full wedding day) to model real
  // start/end times here.
  const calGrid = document.getElementById('calGrid');
  const calMonthLabel = document.getElementById('calMonthLabel');
  const calPrev = document.getElementById('calPrev');
  const calNext = document.getElementById('calNext');
  const dateHiddenInput = document.getElementById('date');
  const dateHint = document.getElementById('dateHint');
  const slotField = document.getElementById('slotField');
  const slotOptions = document.getElementById('slotOptions');
  const timeSlotHiddenInput = document.getElementById('timeSlot');

  let availabilityData = { dailyCap: 2, slots: [], availability: {} };
  let calViewYear, calViewMonth; // 0-indexed month currently shown
  let selectedDateStr = '';

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function toDateStr(y, m, d) { return y + '-' + pad2(m + 1) + '-' + pad2(d); }

  // Dates the studio has blocked by hand — kept in sync with
  // BLOCKED_RANGES in netlify/functions/lib/availability.js. The server is
  // the real gatekeeper; this copy just keeps the calendar honest if the
  // availability request ever fails.
  const BLOCKED_RANGES = [{ from: '2026-10-22', to: '2026-10-31' }];
  function applyBlockedDates(map) {
    BLOCKED_RANGES.forEach(function (r) {
      const d = new Date(r.from + 'T00:00:00');
      const end = new Date(r.to + 'T00:00:00');
      while (d <= end) {
        map[toDateStr(d.getFullYear(), d.getMonth(), d.getDate())] = { slotCounts: {}, count: 99, full: true, blocked: true };
        d.setDate(d.getDate() + 1);
      }
    });
    return map;
  }

  function fetchAvailability() {
    return fetch('/api/get-availability')
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('bad status')); })
      .then(function (data) {
        availabilityData = {
          dailyCap: data.dailyCap || 2,
          slots: data.slots || [],
          availability: applyBlockedDates(data.availability || {}),
        };
      })
      .catch(function () {
        availabilityData.availability = applyBlockedDates(availabilityData.availability || {});
        // Leave the "nothing known taken" default — the calendar still
        // works, it just can't warn about full dates until a later
        // refresh succeeds (and the server double-checks at deposit time
        // regardless, so this never risks an actual double-booking).
      });
  }

  function renderCalendar() {
    if (!calGrid || !calMonthLabel) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    calMonthLabel.textContent = monthNames[calViewMonth] + ' ' + calViewYear;

    const firstOfMonth = new Date(calViewYear, calViewMonth, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();

    calGrid.innerHTML = '';
    for (let i = 0; i < startOffset; i++) {
      const pad = document.createElement('span');
      pad.className = 'cal-pad';
      calGrid.appendChild(pad);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateStr(calViewYear, calViewMonth, d);
      const cellDate = new Date(calViewYear, calViewMonth, d);
      const isPast = cellDate < today;
      const info = availabilityData.availability[dateStr];
      const isFull = !!(info && info.full);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day';
      btn.textContent = d;
      if (info && !isFull) btn.classList.add('partial');
      if (dateStr === selectedDateStr) btn.classList.add('selected');
      if (isPast || isFull) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', function () { selectDate(dateStr); });
      }
      calGrid.appendChild(btn);
    }

    const viewedMonthIsPastOrCurrent = (calViewYear < today.getFullYear()) ||
      (calViewYear === today.getFullYear() && calViewMonth <= today.getMonth());
    if (calPrev) calPrev.disabled = viewedMonthIsPastOrCurrent;
  }

  function renderSlots(dateStr) {
    if (!slotField || !slotOptions) return;
    const info = availabilityData.availability[dateStr];
    const slotCounts = (info && info.slotCounts) || {};
    const slotsConfig = availabilityData.slots.length ? availabilityData.slots : [
      { id: 'morning', label: 'Morning' }, { id: 'afternoon', label: 'Afternoon' }, { id: 'evening', label: 'Evening' },
    ];

    // Slots are a stated preference, not an exclusive booking — more than
    // one shoot can share the same time-of-day label. Only the date's
    // total (against the studio's daily cap) actually blocks anything, so
    // every slot stays selectable; a count just hints how busy it already is.
    slotOptions.innerHTML = '';
    slotsConfig.forEach(function (slot) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-btn';
      const count = slotCounts[slot.id] || 0;
      btn.textContent = slot.label + (count ? ' (' + count + ' booked)' : '');
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(slotOptions.children, function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        if (timeSlotHiddenInput) timeSlotHiddenInput.value = slot.id;
      });
      slotOptions.appendChild(btn);
    });

    slotField.style.display = '';
  }

  function selectDate(dateStr) {
    selectedDateStr = dateStr;
    if (dateHiddenInput) dateHiddenInput.value = dateStr;
    if (timeSlotHiddenInput) timeSlotHiddenInput.value = '';

    renderCalendar();
    renderSlots(dateStr);

    if (dateHint) {
      const d = new Date(dateStr + 'T00:00:00');
      dateHint.textContent = 'Selected: ' + d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      dateHint.classList.add('chosen');
    }
  }

  function resetCalendarSelection() {
    selectedDateStr = '';
    if (dateHiddenInput) dateHiddenInput.value = '';
    if (timeSlotHiddenInput) timeSlotHiddenInput.value = '';
    if (slotField) slotField.style.display = 'none';
    if (dateHint) {
      dateHint.textContent = 'Pick a date to see available times.';
      dateHint.classList.remove('chosen');
    }
    renderCalendar();
  }

  if (calGrid && calMonthLabel) {
    const now = new Date();
    calViewYear = now.getFullYear();
    calViewMonth = now.getMonth();

    if (calPrev) {
      calPrev.addEventListener('click', function () {
        calViewMonth -= 1;
        if (calViewMonth < 0) { calViewMonth = 11; calViewYear -= 1; }
        renderCalendar();
      });
    }
    if (calNext) {
      calNext.addEventListener('click', function () {
        calViewMonth += 1;
        if (calViewMonth > 11) { calViewMonth = 0; calViewYear += 1; }
        renderCalendar();
      });
    }

    renderCalendar(); // paint immediately so the grid isn't blank while the fetch is in flight
    fetchAvailability().then(renderCalendar);
  }

  // Booking form -> our own API (reliable: saves it + emails the studio via
  // Resend). Formspree is kept only as a silent backup copy — it no longer
  // decides what message the visitor sees, since it's proven unreliable.
  const form = document.getElementById('bookForm');
  const confirmMsg = document.getElementById('confirmMsg');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const phone = form.phone.value.trim();
      const eventType = form.eventType.value;
      const date = form.date.value;
      const timeSlot = form.timeSlot.value;
      const location = form.location.value.trim();
      const message = form.message.value.trim();

      // Only nudge for a time once they've actually picked a date — a date
      // is still optional overall, same as before this feature existed.
      if (date && !timeSlot) {
        if (confirmMsg) {
          confirmMsg.textContent = 'Please pick a preferred time for that date, or clear the date if you\'re not sure yet.';
          confirmMsg.classList.add('show');
        }
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

      // Silent backup copy only — never affects what the visitor sees.
      fetch('https://formspree.io/f/mdekaajw', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, eventType, date, timeSlot, location, message })
      }).catch(function () {});

      // The real, reliable path — this is what the visitor's message is
      // based on. Whatever happens, they still get moved into the payment
      // picker right after (see .finally below).
      fetch('/api/save-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, eventType, date, timeSlot, location, message })
      })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('save-booking returned ' + res.status)); })
      .then(function (result) {
        if (result && result.bookingId) {
          try {
            sessionStorage.setItem('camerababe_bookingId', result.bookingId);
            sessionStorage.setItem('camerababe_bookingDate', date || '');
            sessionStorage.setItem('camerababe_bookingTimeSlot', timeSlot || '');
          } catch (e) {}
        }
        if (confirmMsg) {
          confirmMsg.textContent = "Thank you — your booking request has been sent. To lock in your date right away, pick your package below and pay your deposit — otherwise I'll get back to you within 24–48 hours.";
          confirmMsg.classList.add('show');
        }
        if (typeof gtag === 'function') {
          gtag('event', 'book_submit', { shoot_type: eventType || 'Unspecified' });
        }
        form.reset();
        resetCalendarSelection();
      })
      .catch(function () {
        if (confirmMsg) {
          confirmMsg.innerHTML = 'Your request didn\'t go through automatically — please email <a href="mailto:afridauhtercreationsltd@camerababe.com">afridauhtercreationsltd@camerababe.com</a> directly so nothing gets missed. You can still lock in your date now — pick your package below and pay your deposit.';
          confirmMsg.classList.add('show');
        }
        if (typeof gtag === 'function') {
          gtag('event', 'book_submit_fallback', { shoot_type: eventType || 'Unspecified' });
        }
      })
      .finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send booking request'; }
        promptForDeposit();
      });
    });
  }

  // Review form -> our own API (same reliable pattern as bookings). Formspree
  // is kept only as a silent backup copy.
  const reviewForm = document.getElementById('reviewForm');
  const reviewConfirmMsg = document.getElementById('reviewConfirmMsg');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = reviewForm.querySelector('button[type="submit"]');
      const rName = reviewForm.reviewName.value.trim();
      const rShoot = reviewForm.reviewShoot.value.trim();
      const rRating = reviewForm.reviewRating.value;
      const rText = reviewForm.reviewText.value.trim();
      const rCompany = reviewForm.reviewCompany ? reviewForm.reviewCompany.value.trim() : '';

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

      // Silent backup copy only — never affects what the visitor sees.
      fetch('https://formspree.io/f/xljdggvz', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rName, shootType: rShoot, rating: rRating, review: rText })
      }).catch(function () {});

      fetch('/api/save-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rName, shootType: rShoot, rating: rRating, review: rText, company: rCompany })
      })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('save-review returned ' + res.status)); })
      .then(function () {
        if (reviewConfirmMsg) {
          reviewConfirmMsg.textContent = 'Thank you — your review is now live on the site.';
          reviewConfirmMsg.classList.add('show');
        }
        reviewForm.reset();
        loadReviews();
      })
      .catch(function () {
        if (reviewConfirmMsg) {
          reviewConfirmMsg.innerHTML = 'Your review didn\'t go through automatically — please email <a href="mailto:afridauhtercreationsltd@camerababe.com">afridauhtercreationsltd@camerababe.com</a> directly so it isn\'t missed.';
          reviewConfirmMsg.classList.add('show');
        }
      })
      .finally(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit review'; }
      });
    });
  }

  // ---------------------------------------------------------------
  // Render published reviews into the testimonials grid. Reviews
  // auto-publish the moment they're submitted (see save-review.js /
  // get-reviews.js), so this is the only thing that puts them on the
  // page — there's no manual editing step anymore. Everything is
  // inserted via textContent, never innerHTML, so a review's own text
  // can never break the page's markup.
  // ---------------------------------------------------------------
  function countStars(ratingText) {
    const match = (ratingText || '').match(/★+/);
    return match ? match[0].length : 5;
  }

  function loadReviews() {
    const grid = document.getElementById('tGrid');
    if (!grid) return;

    fetch('/api/get-reviews')
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('get-reviews returned ' + res.status)); })
      .then(function (data) {
        const reviews = (data && data.reviews) || [];
        if (!reviews.length) return; // keep the "Be the first..." placeholder already in the HTML

        function buildCard(r) {
          const card = document.createElement('div');
          card.className = 't-card';

          const stars = document.createElement('span');
          stars.className = 't-stars';
          stars.textContent = '★★★★★'.slice(0, countStars(r.rating));
          card.appendChild(stars);

          const quote = document.createElement('p');
          quote.className = 't-quote';
          quote.textContent = '"' + (r.review || '') + '"';
          card.appendChild(quote);

          const name = document.createElement('span');
          name.className = 't-name';
          name.textContent = r.name + (r.shootType ? ' — ' + r.shootType : '');
          card.appendChild(name);
          return card;
        }

        grid.innerHTML = '';

        // A few reviews: a tidy static grid. Many reviews: a slow,
        // continuously drifting strip (pauses on hover) so the wall of
        // praise feels alive instead of becoming a long list.
        if (reviews.length < 4) {
          reviews.forEach(function (r) { grid.appendChild(buildCard(r)); });
          return;
        }

        grid.className = 't-marquee';
        const rowCount = reviews.length >= 8 ? 2 : 1;
        for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
          const subset = reviews.filter(function (_, i) { return i % rowCount === rowIdx; });
          const row = document.createElement('div');
          row.className = 't-row' + (rowIdx % 2 ? ' rev' : '');
          row.style.setProperty('--dur', Math.max(30, subset.length * 9) + 's');
          // Two identical sets so the loop is seamless; the copy is hidden
          // from screen readers so reviews aren't read twice.
          for (let copy = 0; copy < 2; copy++) {
            const set = document.createElement('div');
            set.className = 't-set';
            if (copy) set.setAttribute('aria-hidden', 'true');
            subset.forEach(function (r) { set.appendChild(buildCard(r)); });
            row.appendChild(set);
          }
          grid.appendChild(row);
        }
      })
      .catch(function () { /* leave the static placeholder in place */ });
  }

  loadReviews();
});
