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
      const deposit = price * STANDARD_DEPOSIT_RATE;

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
        amountNaira = price * STANDARD_DEPOSIT_RATE;
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
      if (payNowBtn) { payNowBtn.disabled = true; payNowBtn.textContent = 'Opening secure checkout...'; }

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
    });
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

  // Booking form -> Formspree
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
      const location = form.location.value.trim();
      const message = form.message.value.trim();

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

      // Save a structured record of this inquiry to the booking database.
      // Runs alongside the Formspree email below, not instead of it — if the
      // API isn't reachable (e.g. this preview isn't on Netlify yet), this
      // just quietly fails and the Formspree email flow still works.
      fetch('/api/save-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, eventType, date, location, message })
      })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('save-booking returned ' + res.status)); })
      .then(function (result) {
        if (result && result.bookingId) {
          try { sessionStorage.setItem('camerababe_bookingId', result.bookingId); } catch (e) {}
        }
      })
      .catch(function () { /* non-fatal — see comment above */ });

      fetch('https://formspree.io/f/mdekaajw', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, eventType, date, location, message })
      })
      .then(res => {
        if (res.ok) {
          if (confirmMsg) {
            confirmMsg.textContent = "Thank you — your booking request has been sent. To lock in your date right away, pick your package below and pay your deposit — otherwise I'll get back to you within 24–48 hours.";
            confirmMsg.classList.add('show');
          }
          if (typeof gtag === 'function') {
            gtag('event', 'book_submit', { shoot_type: eventType || 'Unspecified' });
          }
          form.reset();
          promptForDeposit();
        } else {
          throw new Error('Submission failed');
        }
      })
      .catch(() => {
        const subject = encodeURIComponent(`Booking request: ${eventType || 'Shoot'} — ${name}`);
        const body = encodeURIComponent(
`Name: ${name}
Email: ${email}
Phone: ${phone}
Type of shoot: ${eventType}
Preferred date: ${date}
Location: ${location}

Details:
${message}`
        );
        window.location.href = `mailto:afridauhtercreationsltd@camerababe.com?subject=${subject}&body=${body}`;
        if (confirmMsg) {
          confirmMsg.textContent = "Your email app should now be open with your request ready to send. If it didn't open, email afridauhtercreationsltd@camerababe.com directly. You can also lock in your date now — pick your package below and pay your deposit.";
          confirmMsg.classList.add('show');
        }
        if (typeof gtag === 'function') {
          gtag('event', 'book_submit_fallback', { shoot_type: eventType || 'Unspecified' });
        }
        promptForDeposit();
      })
      .finally(() => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send booking request'; }
      });
    });
  }

  // Review form -> Formspree
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

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

      fetch('https://formspree.io/f/xljdggvz', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rName, shootType: rShoot, rating: rRating, review: rText })
      })
      .then(res => {
        if (res.ok) {
          if (reviewConfirmMsg) {
            reviewConfirmMsg.textContent = 'Thank you — your review has been sent for approval.';
            reviewConfirmMsg.classList.add('show');
          }
          reviewForm.reset();
        } else {
          throw new Error('Submission failed');
        }
      })
      .catch(() => {
        const subject = encodeURIComponent(`New review: ${rShoot || 'Shoot'} — ${rName}`);
        const body = encodeURIComponent(
`Name: ${rName}
Type of shoot: ${rShoot}
Rating: ${rRating}

Review:
${rText}`
        );
        window.location.href = `mailto:afridauhtercreationsltd@camerababe.com?subject=${subject}&body=${body}`;
        if (reviewConfirmMsg) {
          reviewConfirmMsg.textContent = "Your email app should now be open with your review ready to send. If it didn't open, email afridauhtercreationsltd@camerababe.com directly.";
          reviewConfirmMsg.classList.add('show');
        }
      })
      .finally(() => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit review'; }
      });
    });
  }
});
