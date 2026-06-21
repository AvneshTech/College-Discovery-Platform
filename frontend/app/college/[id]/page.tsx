// app/college/[id]/page.tsx — SERVER component (Phase 11 + 12).
// Exports generateMetadata() for per-college SEO (title/description/OpenGraph/
// Twitter using real metaTitle/metaDescription where set) and injects JSON-LD
// (schema.org/CollegeOrUniversity). The interactive UI lives in the client
// island CollegeDetailClient so the page still streams server-rendered <head>
// metadata for crawlers and link-preview cards.

import type { Metadata } from "next";
import CollegeDetailClient from "./CollegeDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type CollegeMeta = {
  id: number;
  name: string;
  city: string;
  state?: string | null;
  rating?: number;
  reviewCount?: number;
  nirfRank?: number | null;
  overview?: string | null;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

async function fetchCollege(id: string): Promise<CollegeMeta | null> {
  try {
    const res = await fetch(`${API_BASE}/api/colleges/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as CollegeMeta;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const college = await fetchCollege(id);
  if (!college) {
    return {
      title: "College not found",
      description: "This college could not be found.",
    };
  }

  const title =
    college.metaTitle ||
    `${college.name} — ${college.city}${college.state ? ", " + college.state : ""}`;
  const description =
    college.metaDescription ||
    college.overview?.slice(0, 160) ||
    `Explore ${college.name} in ${college.city}: ratings, fees, placements, courses, cutoffs and student reviews on CollegeEdge.`;
  const image = college.bannerUrl || college.logoUrl || undefined;

  return {
    title,
    description,
    alternates: { canonical: `/college/${college.id}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/college/${college.id}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const college = await fetchCollege(id);

  // JSON-LD structured data (schema.org/CollegeOrUniversity).
  const jsonLd = college
    ? {
        "@context": "https://schema.org",
        "@type": "CollegeOrUniversity",
        name: college.name,
        url: college.website || undefined,
        image: college.bannerUrl || college.logoUrl || undefined,
        description: college.metaDescription || college.overview || undefined,
        address: {
          "@type": "PostalAddress",
          addressLocality: college.city,
          addressRegion: college.state || undefined,
          addressCountry: "IN",
        },
        ...(college.rating && college.reviewCount
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: college.rating,
                reviewCount: college.reviewCount,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CollegeDetailClient id={id} />
    </>
  );
}
