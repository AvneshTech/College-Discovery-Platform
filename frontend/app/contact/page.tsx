"use client";

// app/contact/page.tsx — Phase 4. Public contact form (works for anonymous and
// logged-in visitors; the backend route uses optionalAuth). POST /api/contact.
// Supports a ?subject=… prefill so the college detail page's "Contact" button
// can deep-link here with the college name pre-filled.

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { apiFetch } from "../lib/apiClient";
import { useAuth } from "../lib/AuthProvider";
import { useToast } from "../components/Toast";
import { CheckCircle2, Mail } from "lucide-react";

function ContactInner() {
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Prefill from the logged-in user and any ?subject= query.
  useEffect(() => {
    if (user) {
      setName((n) => n || user.name);
      setEmail((e) => e || user.email);
    }
  }, [user]);
  useEffect(() => {
    const s = searchParams.get("subject");
    if (s) setSubject(s);
  }, [searchParams]);

  const validate = () => {
    if (name.trim().length < 2) return "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email.";
    if (subject.trim().length < 3) return "Subject needs at least 3 characters.";
    if (message.trim().length < 10) return "Message needs at least 10 characters.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.errors?.[0]?.message || data.message || "Failed to send message.");
        return;
      }
      setDone(true);
      toast.success("Message sent! We'll get back to you soon.");
      setSubject("");
      setMessage("");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--surface-1)" }}>
      <Navbar />

      <div className="hero-navy">
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-12 text-center">
          <div className="badge badge-amber mx-auto mb-4 px-4 py-1.5 text-sm">
            <Mail size={14} /> Get in touch
          </div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Contact Us</h1>
          <p className="mx-auto mt-3 max-w-lg text-white/60">
            Questions, feedback, or a college to add? Send us a message and our team will respond.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-2xl px-6 py-10">
        {done ? (
          <div className="card flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Message sent!</h2>
            <p className="max-w-sm text-slate-500">
              Thanks for reaching out — we&apos;ll get back to you at <strong>{email}</strong> soon.
            </p>
            <button onClick={() => setDone(false)} className="btn btn-outline">
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4 p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                className="input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                className="input"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here…"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary btn-lg w-full sm:w-auto">
              {submitting ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>
      }
    >
      <ContactInner />
    </Suspense>
  );
}
