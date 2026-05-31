import { defineCollection, z } from 'astro:content';

const listings = defineCollection({
  type: 'data',
  schema: z.object({
    // Core identity
    title: z.string(),
    slug: z.string(),
    status: z.enum(['available', 'reserved', 'sold']).default('available'),
    featured: z.boolean().default(false),
    order: z.number().default(99),

    // Pricing — price is optional so we can show "Inquire for price"
    price: z.number().optional(),
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
    lotSizeSqm: z.number().optional(),
    lotSizeLabel: z.string().optional(), // e.g. "1.6 hectares"
    beachfrontMeters: z.number().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    floorAreaSqm: z.number().optional(),

    // Content
    shortDescription: z.string(), // 1-2 sentences for cards
    description: z.array(z.string()), // paragraphs for the detail page

    highlights: z.array(z.string()).default([]),
    utilities: z.array(z.string()).default([]),
    accessNotes: z.array(z.string()).default([]),

    // Media
    heroImage: z.string(), // path under /images/listings/<slug>/
    gallery: z.array(z.string()).default([]),
    youtube: z.array(z.string()).default([]), // youtube IDs or full URLs

    // SEO
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }),
});

export const collections = { listings };
