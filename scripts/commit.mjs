#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, ".pipeline-output.json");

function run(cmd) {
  return execSync(cmd, { cwd: rootDir, encoding: "utf8" }).trim();
}

function main() {
  if (!fs.existsSync(outputPath)) {
    throw new Error("Missing .pipeline-output.json. Run generate first.");
  }

  const output = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  const commitMessage = output.commitMessage;
  if (!commitMessage) {
    throw new Error("No commitMessage in .pipeline-output.json");
  }

  const status = run("git status --porcelain");
  if (!status) {
    console.log("No file changes to commit.");
    return;
  }

  console.log("Staging changes...");
  run("git add content/ src/");

  const staged = run("git diff --staged --name-only");
  if (!staged) {
    console.log("No staged changes after git add.");
    return;
  }

  console.log("Committing:\n" + staged.split("\n").map((f) => `  - ${f}`).join("\n"));

  const escaped = commitMessage.replace(/"/g, '\\"');
  run(`git commit -m "${escaped}"`);

  const branch = run("git branch --show-current");
  const hash = run("git rev-parse --short HEAD");
  console.log(`Committed ${hash} on branch ${branch}`);
  console.log(`Message: ${commitMessage}`);

  if (process.env.PIPELINE_PUSH === "1") {
    run(`git push origin ${branch}`);
    console.log(`Pushed to origin/${branch}`);
  } else {
    console.log("Skipping push (set PIPELINE_PUSH=1 to push automatically).");
  }
}

main();
