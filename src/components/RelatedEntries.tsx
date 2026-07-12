import Link from "next/link";
import type { ManifestEntry } from "@/lib/schema";

export function RelatedEntries({ entries }: { entries: ManifestEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <aside className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">
        Related entries
      </h2>
      <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
        {entries.map((entry) => (
          <li key={entry.slug} className="py-4 first:pt-0 last:pb-0">
            <Link href={`/dev/${entry.slug}`} className="group block">
              <h3 className="font-medium text-zinc-900 transition group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
                {entry.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {entry.summary}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
