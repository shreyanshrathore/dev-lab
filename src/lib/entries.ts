import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  entryFrontmatterSchema,
  manifestSchema,
  type EntryFrontmatter,
  type ManifestEntry,
} from "./schema";

const contentDir = path.join(process.cwd(), "content");
const entriesDir = path.join(contentDir, "entries");
const manifestPath = path.join(contentDir, "manifest.json");

export type Entry = EntryFrontmatter & {
  content: string;
  codeSnippet?: string;
};

function readManifestFile() {
  const raw = fs.readFileSync(manifestPath, "utf8");
  return manifestSchema.parse(JSON.parse(raw));
}

export function getAllManifestEntries(): ManifestEntry[] {
  const manifest = readManifestFile();
  return manifest.entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const entry of getAllManifestEntries()) {
    entry.tags.forEach((tag) => tags.add(tag));
  }
  return Array.from(tags).sort();
}

export function getEntryBySlug(slug: string): Entry | null {
  const manifestEntry = getAllManifestEntries().find((e) => e.slug === slug);
  if (!manifestEntry) return null;

  const filePath = path.join(entriesDir, manifestEntry.file);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const normalized = {
    ...data,
    date:
      data.date instanceof Date
        ? data.date.toISOString().slice(0, 10)
        : String(data.date),
  };
  const frontmatter = entryFrontmatterSchema.parse(normalized);

  const codeMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
  const codeSnippet = codeMatch?.[1]?.trim();

  return {
    ...frontmatter,
    content,
    codeSnippet,
  };
}

export function getAllSlugs(): string[] {
  return getAllManifestEntries().map((entry) => entry.slug);
}
