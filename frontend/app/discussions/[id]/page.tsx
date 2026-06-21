// app/discussions/[id]/page.tsx

import type { Metadata } from "next";
import DiscussionDetailClient from "./DiscussionDetailClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function fetchDiscussion(id: string) {
  try {
    const res = await fetch(
      `${API_BASE}/api/discussions/${id}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    return (await res.json()) as {
      title: string;
      body: string;
      tags?: string[];
    };
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

  const discussion = await fetchDiscussion(id);

  if (!discussion) {
    return {
      title: "Discussion not found",
    };
  }

  const description = discussion.body.slice(0, 160);

  return {
    title: discussion.title,
    description,
    keywords: discussion.tags,
    alternates: {
      canonical: `/discussions/${id}`,
    },
    openGraph: {
      type: "article",
      title: discussion.title,
      description,
      url: `/discussions/${id}`,
    },
    twitter: {
      card: "summary",
      title: discussion.title,
      description,
    },
  };
}

export default async function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DiscussionDetailClient id={id} />;
}