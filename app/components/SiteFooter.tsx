import Link from "next/link";
import { type ProjectMeta } from "@/app/lib/types";
import { fmtLong } from "@/app/lib/helpers";

export function SiteFooter({ project: PROJECT }: { project: ProjectMeta }) {
  return (
    <footer id="contact" className="relative mt-24 border-t border-black/10 bg-canvas-2">
      <div className="h-[3px] w-full bg-gradient-to-r from-brand-bright via-brand to-brand-deep" />
      <div className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-brand font-display text-2xl text-white">
                A
              </span>
              <span className="font-display text-2xl tracking-wide text-ink">
                {PROJECT.builder}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-mute">
              {PROJECT.tagline}. This command center tracks the {PROJECT.programme} programme
              delivered for {PROJECT.client}.
            </p>
          </div>

          <div>
            <p className="mono-label">Programme</p>
            <ul className="mt-4 space-y-2 text-sm text-mute">
              <li>
                <Link href="/dashboard#workstreams" className="hover:text-ink">
                  Workstreams
                </Link>
              </li>
              <li>
                <Link href="/dashboard#timeline" className="hover:text-ink">
                  Timeline
                </Link>
              </li>
              <li>
                <Link href="/dashboard#team" className="hover:text-ink">
                  Departments & Team
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mono-label">Status</p>
            <ul className="mt-4 space-y-2 text-sm text-mute">
              <li>
                Project lead · <span className="text-ink">{PROJECT.lead}</span>
              </li>
              <li>
                Priority · <span className="text-brand-bright">{PROJECT.priority}</span>
              </li>
              <li>Updated · {fmtLong(PROJECT.asOf)}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-black/10 pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>
            © 2026 {PROJECT.builder}. Built for {PROJECT.client}.
          </span>
          <span className="font-mono uppercase tracking-widest">Confidential · internal use</span>
        </div>
      </div>
    </footer>
  );
}
