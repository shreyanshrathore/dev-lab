#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import matter from "gray-matter";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const contentDir = path.join(rootDir, "content");
const entriesDir = path.join(contentDir, "entries");

const entryFrontmatterSchema = z.object({
  title: z.string().min(3).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string().min(1)).min(1).max(6),
  summary: z.string().min(20).max(300),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string().min(1).max(40),
});

const manifestEntrySchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  tags: z.array(z.string()),
  summary: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string(),
  file: z.string(),
});

const manifestSchema = z.object({
  updatedAt: z.string(),
  entries: z.array(manifestEntrySchema),
});

const backlogSchema = z.object({
  version: z.number(),
  items: z.array(
    z.object({
      id: z.string(),
      topic: z.string(),
      tags: z.array(z.string()),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      language: z.string(),
      angle: z.string(),
      done: z.boolean(),
    }),
  ),
});

const roadmapSchema = z.object({
  version: z.number(),
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      type: z.enum(["feat", "refactor", "fix", "docs"]),
      priority: z.number(),
      done: z.boolean(),
    }),
  ),
});

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function validateContentFiles() {
  const manifest = manifestSchema.parse(
    readJson(path.join(contentDir, "manifest.json")),
  );
  backlogSchema.parse(readJson(path.join(contentDir, "backlog.json")));
  roadmapSchema.parse(readJson(path.join(contentDir, "roadmap.json")));

  const slugs = new Set();
  for (const entry of manifest.entries) {
    if (slugs.has(entry.slug)) {
      throw new Error(`Duplicate slug in manifest: ${entry.slug}`);
    }
    slugs.add(entry.slug);

    const filePath = path.join(entriesDir, entry.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing entry file for slug ${entry.slug}: ${entry.file}`);
    }

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

    if (frontmatter.slug !== entry.slug) {
      throw new Error(
        `Slug mismatch for ${entry.file}: manifest=${entry.slug}, frontmatter=${frontmatter.slug}`,
      );
    }

    if (!content.trim()) {
      throw new Error(`Entry body is empty: ${entry.file}`);
    }

    if (!/```[\s\S]*?```/.test(content)) {
      throw new Error(`Entry missing code block: ${entry.file}`);
    }
  }

  console.log(`Validated ${manifest.entries.length} entries.`);
}

function runBuildChecks() {
  console.log("Running TypeScript check...");
  execSync("npx tsc --noEmit", { cwd: rootDir, stdio: "inherit" });

  console.log("Running Next.js build...");
  execSync("npm run build", { cwd: rootDir, stdio: "inherit" });
}

function main() {
  validateContentFiles();
  runBuildChecks();
  console.log("Validation passed.");
}

main();
