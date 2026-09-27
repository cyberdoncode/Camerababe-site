# camerababe — Photography Studio Website

A responsive, editorial-style photography business site for **camerababe** (Afridauhter Creations Limited), an Abuja-based studio shooting weddings, portraits, milestones, lifestyle, editorial/fashion, brand, and event photography.

**Live site:** [camerababe.com](https://camerababe.com)

---

## Overview

A 13-page static site built to feel like a real editorial magazine spread rather than a generic template — full-bleed imagery, a color and type system pulled from the studio's own photography, dedicated one-photo-at-a-time galleries per category, a working booking flow with live online payment, and a short-films page for video work.

## Features

- **Fully responsive** — custom breakpoints for mobile, tablet, and desktop, with a dedicated mobile navigation pattern
- **Editorial visual system** — a color palette and typography (Fraunces + Archivo) drawn from the studio's actual photography
- **Six dedicated portfolio categories** — Weddings, Portraits & Milestones, Lifestyle, Editorial and Fashion, Brand and Commercial, and Events, each its own gallery page with a step-through viewer and a real story behind every photo
- **Films page** — short films and behind-the-scenes clips, played as native HTML5 video with poster thumbnails
- **Live booking + payments** — a booking form (via Formspree) plus an on-page Paystack checkout for deposits, with direct bank transfer as a backup option
- **Client reviews** — a review submission form (via Formspree), moderated before publishing
- **Light / dark mode** — toggle in the header, remembered per visitor and applied before first paint
- **Performance-conscious** — compressed images, lazy-loading below the fold, hero images that load eagerly for fast first paint
- **Accessible markup** — descriptive alt text on every image, visible focus states on all interactive elements
- **SEO-ready** — meta description, Open Graph and Twitter Card tags, sitemap.xml and robots.txt
- **Analytics** — Google Analytics (GA4) wired into every page, with custom events for booking submissions and Paystack checkout

## Tech stack

- **HTML5 / CSS3** — no framework; custom design system built from scratch
- **Vanilla JavaScript** — mobile nav toggle, theme toggle, portfolio viewer, form handling, Paystack checkout
- **Paystack Inline** — live deposit payments by card, bank transfer, or USSD
- **Formspree** — backend-free booking and review form submission
- **Google Fonts** — Fraunces (display) and Archivo (body/UI)
- **Hosted on Netlify**, connected to this repository for continuous deployment

## Project structure

```
├── index.html                    # Home
├── about.html                    # About the photographer
├── portfolio.html                # Portfolio hub (six category tiles)
├── portfolio-weddings.html       # Weddings gallery
├── portfolio-portraits.html      # Portraits & Milestones gallery
├── portfolio-lifestyle.html      # Lifestyle gallery
├── portfolio-editorial.html      # Editorial and Fashion gallery
├── portfolio-brand.html          # Brand and Commercial gallery
├── portfolio-events.html         # Events gallery
├── films.html                    # Short films and behind-the-scenes video
├── services.html                 # Rate card, packages, FAQ
├── policy.html                   # Booking, cancellation, and payment terms
├── booking.html                  # Booking form + Paystack checkout + bank details
├── main.js                       # Nav, theme toggle, portfolio viewer, forms, payment
├── styles.css                    # Full design system
├── img/                          # Portfolio photography, poster frames, logo, favicons
├── videos/                       # Film clips
├── sitemap.xml / robots.txt      # SEO
└── _headers                      # Netlify security headers
```

## Running locally

No build step required — it's a static site.

```bash
git clone https://github.com/cyberdoncode/Camerababe-site.git
cd Camerababe-site
```

Then just open `index.html` in a browser, or serve it locally with any static server, e.g.:

```bash
npx serve .
```

## Credits

Photography © camerababe. Site design and build by Fatherson.
