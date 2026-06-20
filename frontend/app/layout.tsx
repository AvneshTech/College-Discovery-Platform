import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./lib/AuthProvider";

export const metadata: Metadata = {
  title: "CollegeEdge — Find Your Dream College",
  description: "Search, compare, and discover the best colleges in India. Use our predictor tool to find colleges matching your rank.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}