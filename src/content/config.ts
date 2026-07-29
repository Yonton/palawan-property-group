import { defineCollection, z } from 'astro:content';

// Decap writes a cleared field as "" (or null for empty lists) instead of
// dropping the key, which Zod rejects and which fails the whole build — one
// blank box in the CMS would take the site down. Treat those as "not set".
const blank = (v: unknown) => v === '' || v === null || v === undefined;

const optionalNumber = z.preprocess((v) => {
  if (blank(v)) return undefined;
  // Decap occasionally hands back a numeric string
  if (typeof v === 'string' && !Number.isNaN(Number(v))) return Number(v);
  return v;
}, z.number().optional());

const numberWithDefault = (fallback: number) =>
  z.preprocess((v) => {
    if (blank(v)) return fallback;
    if (typeof v === 'string' && !Number.isNaN(Number(v))) return Number(v);
    return v;
  }, z.number().default(fallback));

const stringList = z.preprocess(
  (v) => (blank(v) ? [] : v),
  z.array(z.string()).default([])
);

const listings = defineCollection({
  type: 'data',
  schema: z.object({
    // Core identity
    title: z.string(),
    slug: z.string(),
    status: z.enum(['available', 'reserved', 'sold']).default('available'),
    featured: z.preprocess((v) => (blank(v) ? false : v), z.boolean().default(false)),
    order: numberWithDefault(99),

    // Pricing — price is optional so we can show "Inquire for price"
    price: optionalNumber,
    priceLabel: z.string().optional(), // e.g. "Inquire for price"
    currency: z.string().default('PHP'),

    // Classification
    propertyType: z.enum([
      'Beachfront',
      'Residential Lot',
      'Commercial Land',
      'Vacation Home',
      'Resort',
      'Investment',
    ]),
    location: z.string(), // e.g. "Busuanga, Coron, Palawan"

    // Key specs (all optional — land listings won't have beds/baths)
    lotSizeSqm: optionalNumber,
    lotSizeLabel: z.string().optional(), // e.g. "1.6 hectares"
    beachfrontMeters: optionalNumber,
    bedrooms: optionalNumber,
    bathrooms: optionalNumber,
    floorAreaSqm: optionalNumber,

    // Content
    shortDescription: z.string(), // 1-2 sentences for cards
    description: z.array(z.string()), // paragraphs for the detail page

    highlights: stringList,
    utilities: stringList,
    accessNotes: stringList,

    // Media
    heroImage: z.string(), // path under /images/listings/<slug>/
    gallery: stringList,
    youtube: stringList, // youtube IDs or full URLs

    // SEO
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    // 1-2 sentence summary — used on cards and as the meta description fallback
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string(),
    category: z.enum([
      'El Nido',
      'Coron',
      'Investment',
      'Buying Guide',
      'Palawan',
    ]),
    author: z.string().default('Palawan Property Group'),
    tags: stringList,
    featured: z.preprocess((v) => (blank(v) ? false : v), z.boolean().default(false)),
    draft: z.preprocess((v) => (blank(v) ? false : v), z.boolean().default(false)),

    // SEO overrides (optional — fall back to title/description)
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

export const collections = { listings, blog };
