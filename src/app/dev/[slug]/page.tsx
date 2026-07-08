import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { getAllSlugs, getEntryBySlug } from "@/lib/entries";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) return {};

  return {
    title: `${entry.title} | Dev Lab`,
    description: entry.summary,
  };
}

export default async function EntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link
            href="/dev"
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Back to Dev Lab
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <time>{entry.date}</time>
            <span>•</span>
            <span className="capitalize">{entry.difficulty}</span>
            <span>•</span>
            <span>{entry.language}</span>
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {entry.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
            {entry.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
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
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <MarkdownContent content={entry.content} />
      </main>
    </div>
  );
}
