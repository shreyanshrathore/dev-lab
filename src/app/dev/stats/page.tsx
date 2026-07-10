import Link from "next/link";
import { StatsDashboard } from "@/components/StatsDashboard";
import { getEntryStats } from "@/lib/stats";

export const metadata = {
  title: "Stats | Dev Lab",
  description:
    "Overview of Dev Lab entries — difficulty breakdown, languages, tags, and monthly activity.",
};

export default function StatsPage() {
  const stats = getEntryStats();

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
            Overview
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Knowledge base stats
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            A snapshot of what the auto-commit pipeline has published — tags,
            difficulty levels, languages, and publishing cadence.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <StatsDashboard stats={stats} />
      </main>
    </div>
  );
}
