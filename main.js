// camerababe — shared site behavior

document.addEventListener('DOMContentLoaded', function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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

  // Booking form -> mailto
  const form = document.getElementById('bookForm');
  const confirmMsg = document.getElementById('confirmMsg');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const phone = form.phone.value.trim();
      const eventType = form.eventType.value;
      const date = form.date.value;
      const location = form.location.value.trim();
      const message = form.message.value.trim();

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
      if (confirmMsg) confirmMsg.classList.add('show');
    });
  }

  // Review form -> mailto
  const reviewForm = document.getElementById('reviewForm');
  const reviewConfirmMsg = document.getElementById('reviewConfirmMsg');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const rName = reviewForm.reviewName.value.trim();
      const rShoot = reviewForm.reviewShoot.value.trim();
      const rRating = reviewForm.reviewRating.value;
      const rText = reviewForm.reviewText.value.trim();

      const subject = encodeURIComponent(`New review: ${rShoot || 'Shoot'} — ${rName}`);
      const body = encodeURIComponent(
`Name: ${rName}
Type of shoot: ${rShoot}
Rating: ${rRating}

Review:
${rText}`
      );
      window.location.href = `mailto:afridauhtercreationsltd@camerababe.com?subject=${subject}&body=${body}`;
      if (reviewConfirmMsg) reviewConfirmMsg.classList.add('show');
    });
  }
});
