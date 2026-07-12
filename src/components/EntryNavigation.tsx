import Link from "next/link";
import type { ManifestEntry } from "@/lib/schema";

export function EntryNavigation({
  newer,
  older,
}: {
  newer: ManifestEntry | null;
  older: ManifestEntry | null;
}) {
  if (!newer && !older) return null;

  return (
    <nav
      aria-label="Entry navigation"
      className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {older ? (
          <Link
            href={`/dev/${older.slug}`}
            className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              ← Older
            </span>
            <p className="mt-1 font-medium text-zinc-900 transition group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
              {older.title}
            </p>
          </Link>
        ) : (
          <div />
        )}
        {newer ? (
          <Link
            href={`/dev/${newer.slug}`}
            className="group rounded-xl border border-zinc-200 bg-white p-4 text-right transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Newer →
            </span>
            <p className="mt-1 font-medium text-zinc-900 transition group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
              {newer.title}
            </p>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
