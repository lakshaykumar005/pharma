"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShimmerButton } from "./ui/ShimmerButton";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#roles", label: "For your team" },
];

export function MarketingHeader({ authed }: { authed: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-black/10 bg-canvas/80 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="h-[3px] w-full bg-gradient-to-r from-brand-deep via-brand to-brand-bright" />
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-brand font-display text-xl text-white shadow-[0_6px_20px_-8px_rgba(236,28,43,0.9)] transition-transform group-hover:scale-105">
            AB
          </span>
          <span className="leading-none">
            <span className="block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">
              Anthem Biosciences
            </span>
            <span className="block text-sm font-semibold tracking-tight text-ink">Command Center</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-mute transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ShimmerButton href={authed ? "/dashboard" : "/login"} className="hidden sm:inline-flex">
            {authed ? "Open dashboard" : "Sign in"}
            <span aria-hidden>→</span>
          </ShimmerButton>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-black/10 bg-black/[0.03] md:hidden"
          >
            <span className="relative block h-3.5 w-5">
              <span className={`absolute left-0 h-0.5 w-5 rounded bg-ink transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-ink transition-all ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-0.5 w-5 rounded bg-ink transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-t border-black/10 bg-canvas/95 backdrop-blur-xl transition-[max-height] duration-300 md:hidden ${
          open ? "max-h-72" : "max-h-0 border-transparent"
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base text-mute">
              {l.label}
            </a>
          ))}
          <Link
            href={authed ? "/dashboard" : "/login"}
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-brand px-3 py-3 text-center text-sm font-semibold text-white"
          >
            {authed ? "Open dashboard" : "Sign in"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
