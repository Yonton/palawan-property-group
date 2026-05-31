# Palawan Property Group — Website

A fast, modern real-estate website built with [Astro](https://astro.build).
Beachfront, residential, commercial, and investment listings for El Nido and
across Palawan.

---

## 1. Getting started (run it on your computer)

You need [Node.js](https://nodejs.org) version 18 or newer installed.

```bash
# install dependencies (only needed once)
npm install

# start the local dev server
npm run dev
```

Then open the address it prints (usually `http://localhost:4321`) in your
browser. The site reloads automatically as files change.

```bash
# build the final site for deployment
npm run build

# preview the built site locally
npm run preview
```

The built site lands in the `dist/` folder — that's what gets deployed.

---

## 2. How the project is organized

```
src/
  data/site.ts                  ← company info, phone numbers, email, nav
  content/
    config.ts                   ← the "shape" of a listing (do not break the field names)
    listings/                   ← ONE .json file per property  ← YOU EDIT THESE
      hotel-sa-coron-cashew-grove.json
  components/                   ← reusable pieces (header, footer, cards, logo)
  layouts/BaseLayout.astro      ← shared page wrapper (SEO, fonts, header/footer)
  pages/
    index.astro                 ← home page
    about.astro                 ← about page
    contact.astro               ← contact page + form
    listings/index.astro        ← the "all properties" grid
    listings/[slug].astro       ← the template that builds EVERY listing page
public/
  images/                       ← all photos live here  ← YOU ADD THESE
    hero.jpg                    ← homepage hero (replace the placeholder)
    listings/<slug>/            ← one folder of photos per property
  favicon.svg                   ← browser tab icon
  logo.svg                      ← standalone logo file
```

---

## 3. Adding a new property (the important part)

Each property is **one JSON file** in `src/content/listings/`. Copy an existing
one, rename it, and edit the values. The filename doesn't matter, but keep the
`"slug"` unique — that becomes the web address: `/listings/your-slug`.

**Photos** for that property go in `public/images/listings/<slug>/`. Reference
them from the JSON like `"/images/listings/<slug>/hero.jpg"`.

**Videos:** upload to YouTube (Unlisted is fine), then put either the full link
or just the video id in the `"youtube"` list. The site loads them efficiently
(only when a visitor clicks play).

Fields you can leave out: `price` (shows "Inquire for price" instead),
`bedrooms`, `bathrooms`, `floorAreaSqm`, `beachfrontMeters` — land listings
simply omit the ones that don't apply.

Set `"featured": true` on the one property you want highlighted on the homepage.
Use `"order"` (1, 2, 3 …) to control the sort order.

---

## 4. Updating company details

Everything — phone numbers, email, office hours, names, navigation — lives in
**`src/data/site.ts`**. Change it once there and it updates across the whole
site (header, footer, contact page, every listing's inquiry box).

---

## 5. The contact form

Right now the form opens the visitor's email app with their message
pre-filled (works everywhere, no setup). To have submissions arrive
automatically in your inbox instead, connect a free form service:

- **Web3Forms** (https://web3forms.com) — easiest, just an email
- **Formspree** (https://formspree.io)
- **Netlify Forms** — free if you host on Netlify

Ask your developer to wire one of these into `src/pages/contact.astro`; it's a
small change.

---

## 6. Deploying (putting it online)

This is a static site, so it can be hosted free on:

- **Netlify** (recommended) — drag the `dist/` folder onto netlify.com, or
  connect your GitHub repo for automatic deploys
- **Vercel**
- **Cloudflare Pages**

Before deploying, set your real domain in two places:
`astro.config.mjs` (the `site:` line) and `src/data/site.ts` (the `url`).

---

## 7. Branding reference

- **Script font** (logo): Pacifico
- **Display font** (headings): Fraunces
- **Body font:** Plus Jakarta Sans
- **Colors:** sky blue `#13B5EA`, deep navy `#16407A`, sun orange `#FF9E12`

---

## Need a hand?

Adding the remaining listings is mostly copy-paste once the first one is in
place. Send the photos and the rough details for each property and they can be
turned into finished listing files quickly.
