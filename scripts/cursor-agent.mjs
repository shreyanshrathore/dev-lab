import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { Agent, CursorAgentError } from "@cursor/sdk";

function buildCursorPrompt(workItem, rootDir) {
  const item = workItem.item;

  return `You are a senior engineer improving the Dev Lab Next.js app in ${rootDir}.

## Task
- id: ${item.id}
- title: ${item.title}
- description: ${item.description}
- type: ${item.type}

## What to do
Implement this as a small, shippable code change in the REAL application files.

Required:
1. Edit actual source files under src/ (components, app routes, lib, etc.)
2. Make the feature work end-to-end in the Next.js app
3. Mark roadmap item "${item.id}" as done: true in content/roadmap.json
4. Keep the diff focused — do not touch unrelated files

Do NOT only create MDX blog posts. This task requires real code changes in src/.

Rules:
- Match existing TypeScript + Tailwind conventions
- Do not break existing /dev pages
- Prefer minimal, reviewable diffs
- Ensure the project still builds`;
}

function listRepoFiles(rootDir, relativeDirs) {
  const files = new Set();
  for (const relativeDir of relativeDirs) {
    const dir = path.join(rootDir, relativeDir);
    if (!fs.existsSync(dir)) continue;
    const walk = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) walk(fullPath);
        else files.add(fullPath);
      }
    };
    walk(dir);
  }
  return files;
}

function getGitChangedFiles(rootDir) {
  try {
    const output = execSync("git status --porcelain", {
      cwd: rootDir,
      encoding: "utf8",
    });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const file = line.slice(3).trim();
        return path.resolve(rootDir, file);
      });
  } catch {
    return [];
  }
}

function hasSrcChanges(changedFiles, rootDir) {
  const srcDir = path.join(rootDir, "src");
  return changedFiles.some((file) => file.startsWith(srcDir));
}

export async function runCursorAgent(workItem, rootDir) {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CURSOR_API_KEY is required. Get one at https://cursor.com/dashboard/integrations",
    );
  }

  const before = listRepoFiles(rootDir, ["src", "content"]);
  const prompt = buildCursorPrompt(workItem, rootDir);
  const model = process.env.CURSOR_MODEL || "composer-2.5";

  console.log(`Running Cursor agent (${model})...`);
  console.log(`Task: ${workItem.item.title}`);

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: model },
      local: {
        cwd: rootDir,
        settingSources: [],
      },
    });

    if (result.status === "error") {
      throw new Error(`Cursor agent run failed (run id: ${result.id})`);
    }

    const changedFiles = getGitChangedFiles(rootDir);
    let srcChanged = hasSrcChanges(changedFiles, rootDir);

    if (!srcChanged) {
      const after = listRepoFiles(rootDir, ["src", "content"]);
      for (const file of after) {
        if (!before.has(file) && file.includes(`${path.sep}src${path.sep}`)) {
          srcChanged = true;
          break;
        }
      }
    }

    if (!srcChanged) {
      throw new Error(
        "Cursor did not change any src/ files. This pipeline requires real code changes, not only content/ MDX.",
      );
    }

    const commitPrefix = workItem.item.type;
    const title = workItem.item.title;

    return {
      provider: "cursor",
      model,
      commitMessage: `${commitPrefix}: ${title}`,
      filename: null,
      slug: workItem.item.id,
      workItemKind: workItem.kind,
      runId: result.id,
      changedFiles: changedFiles.map((f) => path.relative(rootDir, f)),
      agentResult: result.result,
    };
  } catch (error) {
    if (error instanceof CursorAgentError) {
      throw new Error(`Cursor startup failed: ${error.message}`);
    }
    throw error;
  }
}
