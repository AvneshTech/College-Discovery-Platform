import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./lib/AuthProvider";
import { ThemeProvider } from "./lib/ThemeProvider";

export const metadata: Metadata = {
  title: "CollegeEdge — Find Your Dream College",
  description: "Search, compare, and discover the best colleges in India. Use our predictor tool to find colleges matching your rank.",
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
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
