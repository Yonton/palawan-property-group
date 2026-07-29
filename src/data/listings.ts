import { getCollection, type CollectionEntry } from 'astro:content';

type ListingData = CollectionEntry<'listings'>['data'];

/**
 * How the lot size should read on the site.
 *
 * The CMS has two lot-size fields: a number in sqm and an optional label for
 * when hectares read better. Previously only the label was ever displayed, so
 * a listing with just the sqm figure filled in showed no lot size at all —
 * data entered, silently never shown. Fall back to formatting the number.
 */
export function lotSizeText(d: ListingData): string | null {
  if (d.lotSizeLabel) return d.lotSizeLabel;
  if (d.lotSizeSqm) return `${d.lotSizeSqm.toLocaleString('en-PH')} sqm`;
  return null;
}

/**
 * Single source of truth for reading property listings.
 *
 * Decap creates a new file every time an entry is saved as "new", so saving the
 * same property twice leaves e.g. resort.json and resort-1.json — both carrying
 * the same URL slug. Two entries with one slug means two identical routes, which
 * fails the build and takes the whole site offline. Rather than trust the CMS to
 * stay tidy, drop the later duplicate here: the site stays up and the property
 * shows once, and the stray file can be deleted in the CMS whenever.
 */
export async function getListings(): Promise<CollectionEntry<'listings'>[]> {
  const all = await getCollection('listings');

  // Sort by file id first so the winner of a slug clash is stable across builds
  // ("resort" beats "resort-1", the original beats the accidental copy).
  const seen = new Set<string>();
  return [...all]
    .sort((a, b) => a.id.localeCompare(b.id))
    .filter((entry) => {
      if (seen.has(entry.data.slug)) return false;
      seen.add(entry.data.slug);
      return true;
    })
    .sort((a, b) => a.data.order - b.data.order);
}
