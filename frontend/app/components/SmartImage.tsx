"use client";

/**
 * SmartImage
 * ----------------------------------------------------------------------------
 * A single, reusable image primitive that gives EVERY image in the app the
 * production behaviours requested:
 *
 *   • Lazy loading            -> native loading="lazy" + decoding="async"
 *   • Skeleton loader         -> shimmering placeholder until the image paints
 *   • Smooth fade-in          -> opacity transition once loaded (no "pop")
 *   • Error fallback          -> swaps to `fallbackSrc`; if that also fails it
 *                                renders the `fallback` node (e.g. a letter badge)
 *   • Aspect / fit control    -> `fit="cover"` for banners, `fit="contain"` for logos
 *
 * It is intentionally framework-light (plain <img>) so it works in the existing
 * Express-served API + Next.js setup without next/image domain config. Swap the
 * inner <img> for next/image later if you whitelist remote domains.
 */

import { useEffect, useState } from "react";

type SmartImageProps = {
  src?: string | null;
  alt: string;
  /** object-fit behaviour: "cover" for banners, "contain" for logos. */
  fit?: "cover" | "contain";
  /** Optional secondary URL tried once the primary src errors. */
  fallbackSrc?: string | null;
  /** Rendered when there is no usable image at all (e.g. a letter avatar). */
  fallback?: React.ReactNode;
  className?: string;
  /** Extra classes applied to the wrapper (controls size / rounding / overflow). */
  wrapperClassName?: string;
  /** Eager-load above-the-fold images (e.g. the details hero). Defaults to lazy. */
  priority?: boolean;
};

export default function SmartImage({
  src,
  alt,
  fit = "cover",
  fallbackSrc,
  fallback,
  className = "",
  wrapperClassName = "",
  priority = false,
}: SmartImageProps) {
  // Tracks which URL we are currently attempting to load.
  const [currentSrc, setCurrentSrc] = useState<string | null>(src ?? null);
  const [loaded, setLoaded] = useState(false);
  // `true` once every candidate URL has failed -> render the `fallback` node.
  const [errored, setErrored] = useState(false);

  // Reset internal state whenever the incoming src changes (e.g. data refetch).
  useEffect(() => {
    setCurrentSrc(src ?? null);
    setLoaded(false);
    setErrored(false);
  }, [src]);

  const handleError = () => {
    // First failure: try the secondary fallback URL once.
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setLoaded(false);
      return;
    }
    // No (more) URLs to try -> surface the fallback node.
    setErrored(true);
  };

  const showFallbackNode = errored || !currentSrc;

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Skeleton shimmer — visible until the image paints or we give up. */}
      {!loaded && !showFallbackNode && (
        <div className="skeleton absolute inset-0 h-full w-full" aria-hidden />
      )}

      {showFallbackNode ? (
        // Hard fallback (letter badge, generic icon, etc.)
        <div className="flex h-full w-full items-center justify-center">
          {fallback}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentSrc as string}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`h-full w-full ${
            fit === "cover" ? "object-cover" : "object-contain"
          } transition-opacity duration-500 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
        />
      )}
    </div>
  );
}
