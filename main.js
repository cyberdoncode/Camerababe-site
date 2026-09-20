// camerababe — shared site behavior

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

      fetch('https://formspree.io/f/mdekaajw', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, eventType, date, location, message })
      })
      .then(res => {
        if (res.ok) {
          if (confirmMsg) {
            confirmMsg.textContent = "Thank you — your booking request has been sent. I'll get back to you within 24–48 hours.";
            confirmMsg.classList.add('show');
          }
          form.reset();
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
          confirmMsg.textContent = "Your email app should now be open with your request ready to send. If it didn't open, email afridauhtercreationsltd@camerababe.com directly.";
          confirmMsg.classList.add('show');
        }
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
