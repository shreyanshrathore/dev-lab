import Link from "next/link";
import type { ManifestEntry } from "@/lib/schema";

const difficultyColors = {
  beginner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  intermediate: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  advanced: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

export function EntryCard({ entry }: { entry: ManifestEntry }) {
  return (
    <article className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <time className="text-zinc-500">{entry.date}</time>
        <span
          className={`rounded-full px-2 py-0.5 font-medium ${difficultyColors[entry.difficulty]}`}
        >
          {entry.difficulty}
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {entry.language}
        </span>
      </div>
      <h2 className="mb-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        <Link href={`/dev/${entry.slug}`} className="hover:underline">
          {entry.title}
        </Link>
      </h2>
      <p className="mb-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {entry.summary}
      </p>
      <div className="flex flex-wrap gap-2">
        {entry.tags.map((tag) => (
          <Link
            key={tag}
            href={`/dev/tags/${encodeURIComponent(tag)}`}
            className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            #{tag}
          </Link>
        ))}
      </div>
    </article>
  );
}
