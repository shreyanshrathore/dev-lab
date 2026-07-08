import { z } from "zod";

export const entryFrontmatterSchema = z.object({
  title: z.string().min(3).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string().min(1)).min(1).max(6),
  summary: z.string().min(20).max(300),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string().min(1).max(40),
});

export const manifestEntrySchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  tags: z.array(z.string()),
  summary: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string(),
  file: z.string(),
});

export const manifestSchema = z.object({
  updatedAt: z.string(),
  entries: z.array(manifestEntrySchema),
});

export const backlogItemSchema = z.object({
  id: z.string(),
  topic: z.string(),
  tags: z.array(z.string()),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string(),
  angle: z.string(),
  done: z.boolean().default(false),
});

export const backlogSchema = z.object({
  version: z.number(),
  items: z.array(backlogItemSchema),
});

export const roadmapItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["feat", "refactor", "fix", "docs"]),
  priority: z.number(),
  done: z.boolean().default(false),
});

export const roadmapSchema = z.object({
  version: z.number(),
  items: z.array(roadmapItemSchema),
});

export type EntryFrontmatter = z.infer<typeof entryFrontmatterSchema>;
export type ManifestEntry = z.infer<typeof manifestEntrySchema>;
export type BacklogItem = z.infer<typeof backlogItemSchema>;
export type RoadmapItem = z.infer<typeof roadmapItemSchema>;

export const generatedEntrySchema = z.object({
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string(),
  body: z.string(),
  codeSnippet: z.string(),
});

export type GeneratedEntry = z.infer<typeof generatedEntrySchema>;
