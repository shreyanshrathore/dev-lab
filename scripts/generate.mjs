#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { generateEntry } from "./llm.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const contentDir = path.join(rootDir, "content");
const entriesDir = path.join(contentDir, "entries");

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

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function pickWorkItem() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86_400_000,
  );
  const useRoadmap = dayOfYear % 7 === 0;

  if (useRoadmap) {
    const roadmap = roadmapSchema.parse(
      readJson(path.join(contentDir, "roadmap.json")),
    );
    const nextRoadmap = roadmap.items
      .filter((item) => !item.done)
      .sort((a, b) => a.priority - b.priority)[0];

    if (nextRoadmap) {
      return { kind: "roadmap", item: nextRoadmap };
    }
  }

  const backlog = backlogSchema.parse(
    readJson(path.join(contentDir, "backlog.json")),
  );
  const nextBacklog = backlog.items.find((item) => !item.done);
  if (!nextBacklog) {
    throw new Error("No pending backlog items left.");
  }

  return { kind: "content", item: nextBacklog };
}

function buildMdx(frontmatter, body, codeSnippet) {
  const languageHint = frontmatter.language.toLowerCase();
  const fence = languageHint.includes("typescript")
    ? "typescript"
    : languageHint.includes("python")
      ? "python"
      : languageHint.includes("sql")
        ? "sql"
        : languageHint.includes("bash")
          ? "bash"
          : "javascript";

  return [
    "---",
    `title: ${JSON.stringify(frontmatter.title)}`,
    `slug: ${JSON.stringify(frontmatter.slug)}`,
    `date: ${frontmatter.date}`,
    "tags:",
    ...frontmatter.tags.map((tag) => `  - ${tag}`),
    `summary: ${JSON.stringify(frontmatter.summary)}`,
    `difficulty: ${frontmatter.difficulty}`,
    `language: ${JSON.stringify(frontmatter.language)}`,
    "---",
    "",
    body.trim(),
    "",
    "```" + fence,
    codeSnippet.trim(),
    "```",
    "",
  ].join("\n");
}

function updateManifest(entryMeta) {
  const manifestPath = path.join(contentDir, "manifest.json");
  const manifest = readJson(manifestPath);
  manifest.updatedAt = new Date().toISOString();
  manifest.entries = [
    entryMeta,
    ...manifest.entries.filter((e) => e.slug !== entryMeta.slug),
  ];
  writeJson(manifestPath, manifest);
}

function markDone(workItem) {
  if (workItem.kind === "content") {
    const backlogPath = path.join(contentDir, "backlog.json");
    const backlog = backlogSchema.parse(readJson(backlogPath));
    backlog.items = backlog.items.map((item) =>
      item.id === workItem.item.id ? { ...item, done: true } : item,
    );
    writeJson(backlogPath, backlog);
    return;
  }

  const roadmapPath = path.join(contentDir, "roadmap.json");
  const roadmap = roadmapSchema.parse(readJson(roadmapPath));
  roadmap.items = roadmap.items.map((item) =>
    item.id === workItem.item.id ? { ...item, done: true } : item,
  );
  writeJson(roadmapPath, roadmap);
}

async function main() {
  const workItem = pickWorkItem();
  const { provider, model, entry: generated } = await generateEntry(workItem);

  const date = today();
  const slug = slugify(generated.title);
  const filename = `${date}-${slug}.mdx`;
  const filePath = path.join(entriesDir, filename);

  const frontmatter = {
    title: generated.title,
    slug,
    date,
    tags: generated.tags,
    summary: generated.summary,
    difficulty: generated.difficulty,
    language: generated.language,
  };

  const mdx = buildMdx(frontmatter, generated.body, generated.codeSnippet);
  fs.mkdirSync(entriesDir, { recursive: true });
  fs.writeFileSync(filePath, mdx);

  updateManifest({
    ...frontmatter,
    file: filename,
  });

  markDone(workItem);

  const commitPrefix =
    workItem.kind === "content" ? "content" : workItem.item.type;
  const commitMessage = `${commitPrefix}: ${generated.title}`;

  fs.writeFileSync(
    path.join(rootDir, ".pipeline-output.json"),
    JSON.stringify(
      {
        commitMessage,
        slug,
        filename,
        workItemKind: workItem.kind,
        provider,
        model,
      },
      null,
      2,
    ),
  );

  console.log(`Generated entry: ${filename}`);
  console.log(`Provider: ${provider} (${model})`);
  console.log(`Suggested commit: ${commitMessage}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
