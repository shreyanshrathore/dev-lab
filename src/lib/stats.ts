import { getAllManifestEntries, getAllTags } from "./entries";
import type { ManifestEntry } from "./schema";

export type Difficulty = ManifestEntry["difficulty"];

export type EntryStats = {
  totalEntries: number;
  totalTags: number;
  byDifficulty: Record<Difficulty, number>;
  byLanguage: { language: string; count: number }[];
  byTag: { tag: string; count: number }[];
  byMonth: { month: string; label: string; count: number }[];
  latestDate: string | null;
  oldestDate: string | null;
};

function countBy<T extends string>(
  items: T[],
  order?: T[],
): { key: T; count: number }[] {
  const counts = new Map<T, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }

  const keys = order ?? Array.from(counts.keys()).sort();
  return keys
    .filter((key) => counts.has(key))
    .map((key) => ({ key, count: counts.get(key)! }));
}

function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-");
  const date = new Date(Number(year), Number(monthNum) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function getEntryStats(): EntryStats {
  const entries = getAllManifestEntries();
  const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced"];

  const byDifficulty = Object.fromEntries(
    countBy(
      entries.map((e) => e.difficulty),
      difficulties,
    ).map(({ key, count }) => [key, count]),
  ) as Record<Difficulty, number>;

  const byLanguage = countBy(entries.map((e) => e.language)).map(
    ({ key, count }) => ({ language: key, count }),
  );

  const tagCounts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const byTag = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const monthCounts = new Map<string, number>();
  for (const entry of entries) {
    const month = entry.date.slice(0, 7);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
  }
  const byMonth = Array.from(monthCounts.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, count]) => ({
      month,
      label: formatMonthLabel(month),
      count,
    }));

  const dates = entries.map((e) => e.date).sort();

  return {
    totalEntries: entries.length,
    totalTags: getAllTags().length,
    byDifficulty,
    byLanguage,
    byTag,
    byMonth,
    latestDate: dates.at(-1) ?? null,
    oldestDate: dates.at(0) ?? null,
  };
}
