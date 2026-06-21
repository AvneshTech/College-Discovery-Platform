import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./lib/AuthProvider";
import { ThemeProvider } from "./lib/ThemeProvider";
import { ToastProvider } from "./components/Toast";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://collegeedge.app"),
  title: {
    default: "CollegeEdge — Find Your Dream College",
    template: "%s · CollegeEdge",
  },
  description:
    "Search, compare, and discover the best colleges in India. Use our predictor tool to find colleges matching your rank.",
  openGraph: {
    type: "website",
    siteName: "CollegeEdge",
    title: "CollegeEdge — Find Your Dream College",
    description:
      "Search, compare, and discover the best colleges in India. Use our predictor tool to find colleges matching your rank.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CollegeEdge — Find Your Dream College",
    description: "Search, compare, and discover the best colleges in India.",
  },
};

// Applied before React hydrates so there is no light→dark flash on load.
const themeBootScript = `
(function() {
  try {
    var stored = localStorage.getItem('ce-theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Phase 13 — skip-to-content link for keyboard users (visually hidden
            until focused, then jumps past the sticky navbar). */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-slate-900 focus:shadow-lg"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <div id="main-content">{children}</div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
