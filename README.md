# camerababe — Photography Studio Website

A responsive, editorial-style portfolio and booking site built for **camerababe**, a wedding, traditional-ceremony, and milestone photography brand.

**Live site:** [camerababe.com](https://camerababe.com) *(update once launched)*

---

## Overview

Most small photography businesses end up with either a generic Squarespace template or a Linktree pointing at Instagram. This project was built to give camerababe something closer to a real editorial magazine spread — full-bleed imagery, a custom color system pulled directly from the actual photography, and a booking flow that turns visitors into inquiries.

## Features

- **Fully responsive** — custom breakpoints at ~480px, ~780–900px, and 1280px+, with a dedicated mobile navigation pattern
- **Editorial visual system** — a color palette and typography (Fraunces + Archivo) drawn from the brand's actual photography, not a generic template default
- **Magazine-style portfolio grid** — 14 featured shoots in an alternating asymmetric layout, each with its own title and story copy
- **Working booking form** — captures event type, date, location, and details; integrated with [Formspree](https://formspree.io) for reliable delivery regardless of the visitor's email setup
- **Performance-conscious** — compressed images, lazy-loading below the fold, and a hero image that loads eagerly for fast first paint
- **Accessible markup** — descriptive alt text on every image, visible focus states on all interactive elements, `prefers-reduced-motion` support
- **SEO-ready** — meta description, Open Graph and Twitter Card tags for clean link previews when shared on social platforms
- **Custom branding** — logo mark integrated into navigation, footer, and browser favicon

## Tech stack

- **HTML5 / CSS3** — no framework; custom design system built from scratch
- **Vanilla JavaScript** — mobile nav toggle, scroll-based header state, form handling
- **Formspree** — backend-free form submission handling
- **Google Fonts** — Fraunces (display) and Archivo (body/UI)
- **Hosted on Netlify**, connected to this repository for continuous deployment

## Project structure

```
├── index.html          # Main site (single page)
├── img/                 # Portfolio photography, logo, and favicon assets
└── README.md
```

## Running locally

No build step required — it's a static site.

```bash
git clone https://github.com/<your-username>/camerababe-site.git
cd camerababe-site
```

Then just open `index.html` in a browser, or serve it locally with any static server, e.g.:

```bash
npx serve .
```

## Credits

Photography © camerababe. Site design and build by Fatherson.
