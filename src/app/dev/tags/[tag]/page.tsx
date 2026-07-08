import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryCard } from "@/components/EntryCard";
import {
  getAllTags,
  getEntriesByTag,
  resolveTag,
} from "@/lib/entries";

export async function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const resolved = resolveTag(tag);
  if (!resolved) return {};

  const entries = getEntriesByTag(resolved);
  const count = entries.length;

  return {
    title: `${resolved} | Dev Lab`,
    description: `Browse ${count} Dev Lab ${count === 1 ? "entry" : "entries"} tagged with ${resolved}. Practical developer tips, patterns, and runnable snippets.`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const resolved = resolveTag(tag);
  if (!resolved) notFound();

  const entries = getEntriesByTag(resolved);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <Link
            href="/dev"
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Back to Dev Lab
          </Link>
          <p className="mt-4 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Tag
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            #{resolved}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} tagged
            with {resolved}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {entries.length > 0 ? (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <EntryCard key={entry.slug} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            No entries for this tag yet. The pipeline will add more soon.
          </div>
        )}
      </main>
    </div>
  );
}
