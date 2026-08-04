// Central configuration for the whole site.
// Edit business details, contact info, and navigation here in one place.

export const site = {
  name: 'Palawan Property Group',
  tagline: 'Your slice of paradise in El Nido, Palawan',
  description:
    'Beachfront property, residential lots, commercial land and investment opportunities in El Nido and across Palawan. Locally owned, licensed, and rooted in paradise.',
  // TODO: replace with the real production domain before deploy
  url: 'https://palawanpropertygroup.com',
  locale: 'en',
};

export const company = {
  broker: {
    name: 'Roella White',
    title: 'Licensed Real Estate Broker',
    license: 'PRC License No. 5632',
  },
  salesperson: {
    name: 'Wella C. Fernandez',
    title: 'Accredited Real Estate Salesperson',
  },
  basedIn: 'El Nido, Palawan, Philippines',
};

export const contact = {
  email: 'palawanpropertygroup.com@gmail.com',
  // Each phone number with a label and a clean digits-only version for links
  phones: [
    { label: 'Smart', display: '+63 907-089-2784', e164: '639070892784' },
    { label: 'Globe', display: '+63 956-335-3323', e164: '639563353323' },
    { label: 'Globe', display: '+63 977-066-9099', e164: '639770669099' },
  ],
  // Primary number used for the floating WhatsApp button
  whatsappPrimary: '639070892784',
  officeHours: 'Monday – Saturday, 8:00 AM – 6:00 PM',
};

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Properties', href: '/listings' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

// Helper: build a WhatsApp click-to-chat link with an optional prefilled message
export function whatsappLink(number: string, message?: string): string {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// Helper: format a price in Philippine Peso, or fall back to a label
export function formatPrice(
  price?: number,
  priceLabel?: string,
  currency = 'PHP'
): string {
  if (price == null) return priceLabel ?? 'Inquire for price';
  // Intl throws on anything that isn't a 3-letter code, and the CMS currency
  // field is free text — a typo there must not be able to break the build.
  const code = /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : 'PHP';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(price);
}
