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

/**
 * Listing JSON is stored GROUPED (media / copy / where / specs / pricing /
 * seo / admin) purely so Decap can render each group as a collapsible section
 * in the editor — a flat file gives the customer a 25-field wall.
 *
 * The site doesn't care about that grouping, so the schema flattens it straight
 * back out below. Every template keeps reading listing.data.price, .location,
 * .heroImage and so on, exactly as before.
 *
 * title and slug stay top-level because the CMS resolves identifier_field and
 * the media_folder upload path against top-level field names only.
 */
/**
 * Accept the OLD flat shape as well as the grouped one.
 *
 * A CMS tab opened before the grouped config deployed still holds the old flat
 * field list in memory, and saving from it writes a flat file — which would
 * fail the build and stall every later deploy. Re-group it here instead.
 *
 * Safe to delete once every editor has reloaded /admin (say, a month after
 * 2026-07-29) — nothing writes the flat shape any more.
 */
const regroupLegacyFlat = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const d = value as Record<string, unknown>;

  // Already grouped, or not a listing we recognise — leave it alone.
  if ('media' in d || 'copy' in d || 'where' in d) return d;
  if (!('heroImage' in d) && !('shortDescription' in d)) return d;

  return {
    title: d.title,
    slug: d.slug,
    media: { heroImage: d.heroImage, gallery: d.gallery, youtube: d.youtube },
    copy: {
      shortDescription: d.shortDescription,
      description: d.description,
      highlights: d.highlights,
    },
    where: {
      location: d.location,
      propertyType: d.propertyType,
      accessNotes: d.accessNotes,
    },
    specs: {
      lotSizeSqm: d.lotSizeSqm,
      lotSizeLabel: d.lotSizeLabel,
      beachfrontMeters: d.beachfrontMeters,
      bedrooms: d.bedrooms,
      bathrooms: d.bathrooms,
      floorAreaSqm: d.floorAreaSqm,
      utilities: d.utilities,
    },
    pricing: { price: d.price, priceLabel: d.priceLabel, currency: d.currency },
    seo: { metaTitle: d.metaTitle, metaDescription: d.metaDescription },
    admin: { status: d.status, featured: d.featured, order: d.order },
  };
};

const listings = defineCollection({
  type: 'data',
  schema: z.preprocess(
    regroupLegacyFlat,
    z
    .object({
      title: z.string(),
      slug: z.string(),

      media: z.object({
        heroImage: z.string(), // path under /images/listings/<slug>/
        gallery: stringList,
        youtube: stringList, // youtube IDs or full URLs
      }),

      copy: z.object({
        shortDescription: z.string(), // 1-2 sentences for cards
        description: z.array(z.string()), // paragraphs for the detail page
        highlights: stringList,
      }),

      where: z.object({
        location: z.string(), // e.g. "Busuanga, Coron, Palawan"
        propertyType: z.enum([
          'Beachfront',
          'Residential Lot',
          'Commercial Land',
          'Vacation Home',
          'Resort',
          'Investment',
        ]),
        accessNotes: stringList,
      }),

      // All optional — land listings won't have beds/baths
      specs: z
        .object({
          lotSizeSqm: optionalNumber,
          lotSizeLabel: z.string().optional(), // e.g. "1.6 hectares"
          beachfrontMeters: optionalNumber,
          bedrooms: optionalNumber,
          bathrooms: optionalNumber,
          floorAreaSqm: optionalNumber,
          utilities: stringList,
        })
        .default({}),

      // price is optional so we can show "Inquire for price"
      pricing: z
        .object({
          price: optionalNumber,
          priceLabel: z.string().optional(),
          currency: z.string().default('PHP'),
        })
        .default({}),

      seo: z
        .object({
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
        })
        .default({}),

      admin: z
        .object({
          status: z.enum(['available', 'reserved', 'sold']).default('available'),
          featured: z.preprocess(
            (v) => (blank(v) ? false : v),
            z.boolean().default(false)
          ),
          order: numberWithDefault(99),
        })
        .default({}),
    })
    // Flatten back to the shape the site has always used.
    .transform((d) => ({
      title: d.title,
      slug: d.slug,

      status: d.admin.status,
      featured: d.admin.featured,
      order: d.admin.order,

      price: d.pricing.price,
      priceLabel: d.pricing.priceLabel,
      currency: d.pricing.currency,

      propertyType: d.where.propertyType,
      location: d.where.location,
      accessNotes: d.where.accessNotes,

      lotSizeSqm: d.specs.lotSizeSqm,
      lotSizeLabel: d.specs.lotSizeLabel,
      beachfrontMeters: d.specs.beachfrontMeters,
      bedrooms: d.specs.bedrooms,
      bathrooms: d.specs.bathrooms,
      floorAreaSqm: d.specs.floorAreaSqm,
      utilities: d.specs.utilities,

      shortDescription: d.copy.shortDescription,
      description: d.copy.description,
      highlights: d.copy.highlights,

      heroImage: d.media.heroImage,
      gallery: d.media.gallery,
      youtube: d.media.youtube,

      metaTitle: d.seo.metaTitle,
      metaDescription: d.seo.metaDescription,
    }))
  ),
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
