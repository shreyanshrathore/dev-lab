import Link from "next/link";
import type { EntryStats } from "@/lib/stats";

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500",
  intermediate: "bg-amber-500",
  advanced: "bg-rose-500",
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}

function DistributionBars({
  items,
  labelKey,
  countKey,
  colorClass = "bg-zinc-900 dark:bg-zinc-100",
}: {
  items: Record<string, unknown>[];
  labelKey: string;
  countKey: string;
  colorClass?: string;
}) {
  const max = Math.max(...items.map((item) => item[countKey] as number), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const label = String(item[labelKey]);
        const count = item[countKey] as number;
        const width = Math.round((count / max) * 100);

        return (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium capitalize text-zinc-700 dark:text-zinc-300">
                {label}
              </span>
              <span className="text-zinc-500">{count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
              <div
                className={`h-full rounded-full transition-all ${colorClass}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TagCloud({ tags }: { tags: EntryStats["byTag"] }) {
  const max = Math.max(...tags.map((t) => t.count), 1);

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag, count }) => {
        const scale = 0.75 + (count / max) * 0.5;
        return (
          <Link
            key={tag}
            href={`/dev/tags/${encodeURIComponent(tag)}`}
            className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            style={{ fontSize: `${scale}rem` }}
          >
            #{tag}
            <span className="ml-1 text-xs text-zinc-500">({count})</span>
          </Link>
        );
      })}
    </div>
  );
}

export function StatsDashboard({ stats }: { stats: EntryStats }) {
  const difficultyItems = (
    ["beginner", "intermediate", "advanced"] as const
  ).map((level) => ({
    level,
    count: stats.byDifficulty[level],
    color: difficultyColors[level],
  }));

  const dateRange =
    stats.oldestDate && stats.latestDate
      ? `${stats.oldestDate} → ${stats.latestDate}`
      : "—";

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total entries" value={stats.totalEntries} />
        <StatCard label="Unique tags" value={stats.totalTags} />
        <StatCard label="Languages" value={stats.byLanguage.length} />
        <StatCard label="Date range" value={dateRange} hint="oldest to newest" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            By difficulty
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            How entries are distributed across skill levels
          </p>
          <div className="mt-5 space-y-3">
            {difficultyItems.map(({ level, count }) => {
              const max = Math.max(...difficultyItems.map((d) => d.count), 1);
              const width = Math.round((count / max) * 100);
              return (
                <div key={level}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-zinc-700 dark:text-zinc-300">
                      {level}
                    </span>
                    <span className="text-zinc-500">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                    <div
                      className={`h-full rounded-full ${difficultyColors[level]}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            By language
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Topics grouped by primary language or framework
          </p>
          <div className="mt-5">
            <DistributionBars
              items={stats.byLanguage}
              labelKey="language"
              countKey="count"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Tag cloud
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Larger tags have more entries — click to browse
        </p>
        <div className="mt-5">
          <TagCloud tags={stats.byTag} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Monthly activity
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Entries published per month
        </p>
        <div className="mt-5">
          {stats.byMonth.length > 0 ? (
            <DistributionBars
              items={stats.byMonth}
              labelKey="label"
              countKey="count"
              colorClass="bg-sky-500"
            />
          ) : (
            <p className="text-sm text-zinc-500">No entries yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
