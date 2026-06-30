"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/lib/actions";
import type { SessionUser } from "@/app/lib/types";

const NAV = [
  { href: "/dashboard#overview", id: "overview", label: "Overview" },
  { href: "/dashboard#plan", id: "plan", label: "Plan" },
  { href: "/dashboard#timeline", id: "timeline", label: "Timeline" },
  { href: "/dashboard#team", id: "team", label: "Team" },
  { href: "/dashboard#activity", id: "activity", label: "Activity" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SiteHeader({
  asOf,
  user,
  alertCount = 0,
}: {
  asOf: string;
  user: SessionUser | null;
  alertCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("overview");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [user]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-black/10 bg-canvas/85 backdrop-blur-xl" : "border-transparent bg-transparent"
      }`}
    >
      <div className="h-[3px] w-full bg-gradient-to-r from-brand-deep via-brand to-brand-bright" />

      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* lockup */}
        <Link href="/dashboard" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/aapaavani-mark.png"
            alt="Aapaavani"
            width={34}
            height={34}
            className="h-[34px] w-[34px] object-contain transition-transform group-hover:scale-105"
          />
          <span className="border-l border-black/12 pl-2.5 leading-none">
            <span className="block font-mono text-[0.6rem] uppercase tracking-[0.2em] text-faint">
              Anthem Biosciences
            </span>
            <span className="block text-sm font-semibold tracking-tight text-ink">Command Center</span>
          </span>
        </Link>

        {user ? (
          <>
            {/* desktop nav */}
            <nav className="hidden items-center gap-0.5 lg:flex">
              {NAV.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  className={`relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    active === n.id ? "text-ink" : "text-mute hover:text-ink"
                  }`}
                >
                  {active === n.id && (
                    <span className="absolute inset-0 -z-10 rounded-full bg-black/[0.06] ring-1 ring-black/10" />
                  )}
                  {n.label}
                </Link>
              ))}
              <span className="mx-1.5 h-5 w-px bg-black/10" />
              <Link
                href="/tasks"
                className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-mute transition-colors hover:text-brand"
              >
                Tasks
              </Link>
              {(user.role === "ADMIN" || user.role === "EDITOR") && (
                <Link
                  href="/my-tasks"
                  className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-mute transition-colors hover:text-brand"
                >
                  My work
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link
                  href="/manage"
                  className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-mute transition-colors hover:text-brand"
                >
                  Manage
                </Link>
              )}
            </nav>

            {/* desktop user menu */}
            <div className="hidden items-center gap-2.5 lg:flex">
              <Link
                href="/alerts"
                aria-label={`Alerts${alertCount ? ` (${alertCount})` : ""}`}
                className="relative grid h-9 w-9 place-items-center rounded-full border border-black/10 text-mute transition-colors hover:border-brand/40 hover:text-brand"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {alertCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[0.55rem] font-bold text-white">
                    {alertCount}
                  </span>
                )}
              </Link>
              <span className="chip hidden border-brand/40 text-brand-bright xl:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-bright animate-[blink_1.6s_ease-in-out_infinite]" />
                Live · {asOf}
              </span>
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] py-1 pl-1 pr-3 transition-colors hover:border-brand/40"
                title="Account settings"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/20 font-mono text-[0.62rem] text-brand-bright">
                  {initials(user.name)}
                </span>
                <span className="leading-tight">
                  <span className="block max-w-[120px] truncate text-xs font-semibold text-ink">
                    {user.name}
                  </span>
                  <span className="block font-mono text-[0.55rem] uppercase tracking-widest text-faint">
                    {user.role}
                    {user.department ? ` · ${user.department}` : ""}
                  </span>
                </span>
              </Link>
              <form action={logoutAction}>
                <button className="rounded-full border border-black/10 px-3 py-2 text-xs font-medium text-mute transition-colors hover:border-brand/40 hover:text-ink">
                  Sign out
                </button>
              </form>
            </div>

            {/* mobile toggle */}
            <button
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-black/10 bg-black/[0.03] lg:hidden"
            >
              <span className="relative block h-3.5 w-5">
                <span className={`absolute left-0 h-0.5 w-5 rounded bg-ink transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-ink transition-all ${open ? "opacity-0" : "opacity-100"}`} />
                <span className={`absolute left-0 h-0.5 w-5 rounded bg-ink transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </>
        ) : (
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">
            Authorised access
          </span>
        )}
      </div>

      {/* mobile menu */}
      {user && (
        <div
          className={`overflow-hidden border-t border-black/10 bg-canvas/95 backdrop-blur-xl transition-[max-height] duration-300 lg:hidden ${
            open ? "max-h-96" : "max-h-0 border-transparent"
          }`}
        >
          <nav className="flex flex-col gap-1 px-4 py-4">
            {NAV.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-3 text-base font-medium ${
                  active === n.id ? "bg-black/[0.06] text-ink" : "text-mute"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/tasks"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-mute"
            >
              Tasks
            </Link>
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-mute"
            >
              Alerts
              {alertCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[0.6rem] font-bold text-white">
                  {alertCount}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-mute"
            >
              Account
            </Link>
            <Link
              href="/assignments"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-mute"
            >
              Who&apos;s on what
            </Link>
            <Link
              href="/report"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-mute"
            >
              Report
            </Link>
            {(user.role === "ADMIN" || user.role === "EDITOR") && (
              <Link
                href="/my-tasks"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-mute"
              >
                My work
              </Link>
            )}
            {user.role === "ADMIN" && (
              <Link
                href="/manage"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-mute"
              >
                Manage
              </Link>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-3">
              <span className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/20 font-mono text-[0.62rem] text-brand-bright">
                  {initials(user.name)}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-ink">{user.name}</span>
                  <span className="block font-mono text-[0.55rem] uppercase tracking-widest text-faint">
                    {user.role}
                    {user.department ? ` · ${user.department}` : ""}
                  </span>
                </span>
              </span>
              <form action={logoutAction}>
                <button className="rounded-full border border-black/10 px-3 py-2 text-xs font-medium text-mute">
                  Sign out
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
