import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col items-center px-6 py-32 text-center">
      <span className="display-num text-[clamp(5rem,18vw,11rem)] text-brand">404</span>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Task not found</h1>
      <p className="mt-3 max-w-sm text-sm text-mute">
        That item isn&apos;t part of the Anthem Biosciences programme. It may have been renamed or
        removed from the plan.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-bright"
      >
        <span aria-hidden>←</span> Back to Command Center
      </Link>
    </div>
  );
}
