// app/utils/collegeImages.ts
// Derives a logo + photo for every college so the UI always shows something,
// even when logoUrl / bannerUrl aren't set in the database.
//
//  • Logo  → the institution's favicon from its website domain (real logo for
//            most colleges). Falls back to a letter avatar in the UI when there
//            is no website.
//  • Photo → a deterministic placeholder photo keyed by the college, so each
//            college consistently shows the same image. An admin can override
//            it any time by setting a real `bannerUrl` (or `logoUrl`).

type CollegeImageInput = {
  id?: number;
  slug?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  website?: string | null;
};

export function getDomain(website?: string | null): string | null {
  if (!website) return null;
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Returns a logo URL, or null when we can't derive one (UI shows a letter badge).
export function collegeLogo(c: CollegeImageInput): string | null {
  if (c.logoUrl) return c.logoUrl;
  const domain = getDomain(c.website);
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
}

// Always returns a photo URL: the real bannerUrl if set, otherwise a stable
// placeholder photo unique to this college.
export function collegeBanner(c: CollegeImageInput): string {
  if (c.bannerUrl) return c.bannerUrl;
  const seed = c.slug || (c.id != null ? String(c.id) : "college");
  return `https://picsum.photos/seed/ce-${encodeURIComponent(seed)}/1200/400`;
}
