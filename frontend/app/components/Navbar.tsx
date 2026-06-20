"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/AuthProvider";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/compare", label: "Compare" },
  { href: "/predictor", label: "Predictor" },
  { href: "/discussions", label: "Q&A" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth(); // <-- replaces isLoggedIn()/getUser()/logout from utils/auth
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "navbar-glass shadow-lg" : "bg-[#0a0f1e]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-[#0a0f1e] font-bold text-sm flex-shrink-0 group-hover:bg-amber-400 transition-colors">
              CE
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              College<span className="text-amber-400">Edge</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  pathname === href ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/8"
                }`}
              >
                {label}
              </Link>
            ))}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  pathname?.startsWith("/admin") ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/8"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/saved" className="px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">
                  Saved
                </Link>
                <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/8 transition-all group">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-[#0a0f1e] text-xs font-bold flex items-center justify-center">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-white/80 group-hover:text-white">
                    {user.name.split(" ")[0]}
                  </span>
                </Link>
                <button onClick={logout} className="btn btn-sm btn-outline !text-white/60 !border-white/15 hover:!bg-white/10 hover:!text-white">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-sm btn-ghost !text-white/70 hover:!text-white hover:!bg-white/10">
                  Sign in
                </Link>
                <Link href="/register" className="btn btn-sm btn-accent">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/10 transition"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0d1529] animate-fade-in">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === href ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/8"
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2">
              {user ? (
                <>
                  <Link href="/saved" className="block px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">
                    Saved Colleges
                  </Link>
                  <Link href="/profile" className="block px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">
                    My Profile ({user.name.split(" ")[0]})
                  </Link>
                  <button onClick={logout} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-1 pb-1">
                  <Link href="/login" className="btn btn-outline !text-white/70 !border-white/15 flex-1 hover:!bg-white/10 hover:!text-white">
                    Sign in
                  </Link>
                  <Link href="/register" className="btn btn-accent flex-1">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}