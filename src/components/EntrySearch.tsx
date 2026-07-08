"use client";

import { useMemo, useState } from "react";
import { EntryCard } from "./EntryCard";
import type { ManifestEntry } from "@/lib/schema";

export function EntrySearch({
  entries,
  tags,
}: {
  entries: ManifestEntry[];
  tags: string[];
}) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesTag = !activeTag || entry.tags.includes(activeTag);
      const matchesQuery =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        entry.language.toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });
  }, [entries, query, activeTag]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entries, tags, languages..."
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-zinc-300 transition focus:ring-2 dark:border-zinc-800 dark:bg-zinc-950"
        />
        {activeTag && (
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Clear tag
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              activeTag === tag
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        Showing {filtered.length} of {entries.length} entries
      </p>

      <div className="grid gap-4">
        {filtered.map((entry) => (
          <EntryCard key={entry.slug} entry={entry} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No entries match your search yet. The pipeline will add more soon.
          </div>
        )}
      </div>
    </div>
  );
}
