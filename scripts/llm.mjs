import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const generatedEntrySchema = z.object({
  title: z.string().min(3).max(120),
  summary: z.string().min(20).max(300),
  tags: z.array(z.string()).min(1).max(6),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.string().min(1).max(40),
  body: z.string().min(200),
  codeSnippet: z.string().min(20),
});

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
].filter(Boolean);

const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPrompt(workItem) {
  if (workItem.kind === "content") {
    return `You are writing a practical developer knowledge-base entry.

Topic: ${workItem.item.topic}
Angle: ${workItem.item.angle}
Tags: ${workItem.item.tags.join(", ")}
Difficulty: ${workItem.item.difficulty}
Language: ${workItem.item.language}

Return strict JSON with keys:
- title (string)
- summary (string, 1-2 sentences)
- tags (string array, 2-5 tags)
- difficulty ("beginner" | "intermediate" | "advanced")
- language (string)
- body (markdown string with sections: Why this matters, The pattern, Practical tip, Gotcha)
- codeSnippet (runnable code only, no markdown fences, minimum 5 lines / 80 characters)

Requirements:
- Be technically correct and concise.
- Include one runnable code snippet.
- Avoid fluff and repetition.
- Do not mention AI or automation.
- Return JSON only, no markdown fences.`;
  }

  return `You are improving a Next.js Dev Lab site.

Roadmap task:
Title: ${workItem.item.title}
Description: ${workItem.item.description}
Type: ${workItem.item.type}

Return strict JSON with keys:
- title (string)
- summary (string)
- tags (string array)
- difficulty ("beginner" | "intermediate" | "advanced")
- language ("Next.js")
- body (markdown explaining what changed and why)
- codeSnippet (a short code example or patch-style snippet)

Focus on a small, shippable improvement.
Return JSON only, no markdown fences.`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model response did not contain JSON.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function extractCodeFromBody(body) {
  const match = body.match(/```[\w]*\n([\s\S]*?)```/);
  return match?.[1]?.trim() ?? "";
}

function extractCodeSnippet(raw, body) {
  const candidates = [
    raw.codeSnippet,
    raw.code_snippet,
    raw.snippet,
    raw.example,
    raw.code,
    extractCodeFromBody(body),
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value.length >= 20) {
      return value;
    }
  }

  return String(candidates.find((c) => String(c ?? "").trim()) ?? "").trim();
}

function normalizeGeneratedEntry(raw) {
  const body =
    typeof raw.body === "string"
      ? raw.body
      : typeof raw.body === "object" && raw.body !== null
        ? Object.entries(raw.body)
            .map(([heading, value]) => `## ${heading}\n\n${String(value).trim()}`)
            .join("\n\n")
        : String(raw.body ?? "");

  const codeSnippet = extractCodeSnippet(raw, body);

  return generatedEntrySchema.parse({
    ...raw,
    body,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    codeSnippet,
  });
}

function isValidationError(error) {
  return error?.name === "ZodError" || error?.issues?.length > 0;
}

function isRetryableGenerationError(error) {
  return (
    isValidationError(error) ||
    error instanceof SyntaxError ||
    /json|parse|did not contain json/i.test(String(error?.message))
  );
}

function buildFallbackEntry(workItem) {
  if (workItem.kind === "content") {
    const item = workItem.item;
    const codeSnippet = getFallbackCode(item);

    return generatedEntrySchema.parse({
      title: item.topic,
      summary: `${item.angle} This note captures the core pattern with a runnable example you can adapt in real projects.`,
      tags: item.tags,
      difficulty: item.difficulty,
      language: item.language,
      body: [
        "## Why this matters",
        "",
        item.angle,
        "",
        "## The pattern",
        "",
        `This entry focuses on ${item.topic.toLowerCase()}. The example below shows the idea in ${item.language} with just enough context to apply it quickly.`,
        "",
        "## Practical tip",
        "",
        "Start with the smallest working version, verify behavior, then layer in edge-case handling only where your app needs it.",
        "",
        "## Gotcha",
        "",
        "Do not copy snippets blindly into production. Adjust naming, error handling, and types to match your codebase conventions.",
      ].join("\n"),
      codeSnippet,
    });
  }

  const item = workItem.item;
  return generatedEntrySchema.parse({
    title: item.title,
    summary: `${item.description} This roadmap note documents the intended improvement for the Dev Lab site.`,
    tags: ["nextjs", "dev-lab", item.type],
    difficulty: "intermediate",
    language: "Next.js",
    body: [
      "## Why this matters",
      "",
      item.description,
      "",
      "## The pattern",
      "",
      "Ship this as a small, isolated change with validation before merge.",
      "",
      "## Practical tip",
      "",
      "Keep the first version narrow and iterate after the build passes.",
      "",
      "## Gotcha",
      "",
      "Avoid mixing content generation changes with large UI refactors in one commit.",
    ].join("\n"),
    codeSnippet: [
      "// Example Next.js route handler skeleton",
      "export async function GET() {",
      "  return Response.json({ status: 'ok', feature: '" + item.id + "' });",
      "}",
    ].join("\n"),
  });
}

function getFallbackCode(item) {
  const templates = {
    "ts-discriminated-unions": [
      "type RequestState =",
      "  | { status: 'loading' }",
      "  | { status: 'success'; data: string[] }",
      "  | { status: 'error'; message: string };",
      "",
      "function render(state: RequestState) {",
      "  switch (state.status) {",
      "    case 'loading': return 'Loading...';",
      "    case 'success': return state.data.join(', ');",
      "    case 'error': return state.message;",
      "  }",
      "}",
    ],
    "react-use-transition": [
      "import { useState, useTransition } from 'react';",
      "",
      "export function SearchList({ items }: { items: string[] }) {",
      "  const [query, setQuery] = useState('');",
      "  const [isPending, startTransition] = useTransition();",
      "  const [filtered, setFiltered] = useState(items);",
      "",
      "  return (",
      "    <div>",
      "      <input onChange={(e) => {",
      "        const value = e.target.value;",
      "        setQuery(value);",
      "        startTransition(() => {",
      "          setFiltered(items.filter((item) => item.includes(value)));",
      "        });",
      "      }} />",
      "      {isPending ? <p>Updating...</p> : null}",
      "      <ul>{filtered.map((item) => <li key={item}>{item}</li>)}</ul>",
      "    </div>",
      "  );",
      "}",
    ],
  };

  if (templates[item.id]) {
    return templates[item.id].join("\n");
  }

  return [
    `// ${item.topic}`,
    `// ${item.angle}`,
    "const example = {",
    `  topic: ${JSON.stringify(item.topic)},`,
    `  language: ${JSON.stringify(item.language)},`,
    "  ready: true,",
    "};",
    "",
    "console.log(example);",
  ].join("\n");
}

function buildRepairPrompt(originalPrompt, error) {
  const issues = error?.issues
    ?.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  return `${originalPrompt}

Your previous response failed validation: ${issues || error.message}
Fix the JSON and ensure:
- codeSnippet is runnable code with at least 5 lines and 80+ characters
- body is markdown with at least 200 characters
- return JSON only`;
}

async function withValidationRetries(generateFn, prompt) {
  let lastError;
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const text = await generateFn(currentPrompt);
      const entry = parseGeneratedEntry(text);
      return entry;
    } catch (error) {
      lastError = error;
      if (isRetryableGenerationError(error) && attempt < MAX_RETRIES) {
        console.warn(`Generation failed (attempt ${attempt}): ${error.message}`);
        currentPrompt = buildRepairPrompt(prompt, error);
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Generation failed after retries.");
}

function parseGeneratedEntry(text) {
  return normalizeGeneratedEntry(extractJson(text));
}

function getRetryDelayMs(error, attempt) {
  const retryInfo = error?.errorDetails?.find(
    (detail) => detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
  );
  const suggested = retryInfo?.retryDelay;
  if (typeof suggested === "string" && suggested.endsWith("s")) {
    const seconds = Number.parseFloat(suggested.replace("s", ""));
    if (!Number.isNaN(seconds)) {
      return Math.ceil(seconds * 1000) + 500;
    }
  }
  return 2 ** attempt * 2000;
}

function isQuotaError(error) {
  return error?.status === 429 || /quota|rate limit|too many requests/i.test(String(error?.message));
}

async function generateWithGemini(prompt, modelName, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function tryGeminiProviders(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const models = [...new Set(GEMINI_MODELS)];
  let lastError;

  for (const modelName of models) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Trying Gemini model: ${modelName} (attempt ${attempt})`);
        const entry = await withValidationRetries(
          (p) => generateWithGemini(p, modelName, apiKey),
          prompt,
        );
        return { provider: "gemini", model: modelName, entry };
      } catch (error) {
        lastError = error;
        if (isQuotaError(error) && attempt < MAX_RETRIES) {
          const delay = getRetryDelayMs(error, attempt);
          console.warn(
            `Gemini quota/rate limit on ${modelName}. Retrying in ${Math.round(delay / 1000)}s...`,
          );
          await sleep(delay);
          continue;
        }
        console.warn(`Gemini failed for ${modelName}: ${error.message}`);
        break;
      }
    }
  }

  throw lastError ?? new Error("All Gemini models failed.");
}

async function generateWithOllama(prompt) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:3b";

  const callOllama = async (userPrompt) => {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        messages: [
          {
            role: "system",
            content:
              "You are a precise technical writer. Always return valid JSON only. codeSnippet must contain at least 5 lines of runnable code.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const text = data.message?.content;
    if (!text) {
      throw new Error("Ollama returned an empty response.");
    }
    return text;
  };

  const entry = await withValidationRetries(callOllama, prompt);
  return { provider: "ollama", model, entry };
}

async function isOllamaAvailable() {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function generateEntry(workItem) {
  const prompt = buildPrompt(workItem);
  const provider = (process.env.LLM_PROVIDER || "auto").toLowerCase();

  const runWithFallback = async (fn, label) => {
    try {
      return await fn();
    } catch (error) {
      console.warn(`${label} failed: ${error.message}`);
      console.warn("Using deterministic fallback entry...");
      return {
        provider: "fallback",
        model: "template",
        entry: buildFallbackEntry(workItem),
      };
    }
  };

  if (provider === "ollama") {
    return runWithFallback(() => generateWithOllama(prompt), "Ollama");
  }

  if (provider === "gemini") {
    return runWithFallback(() => tryGeminiProviders(prompt), "Gemini");
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await tryGeminiProviders(prompt);
    } catch (error) {
      if (await isOllamaAvailable()) {
        console.warn("Gemini unavailable. Falling back to local Ollama...");
        return runWithFallback(() => generateWithOllama(prompt), "Ollama");
      }
      return runWithFallback(async () => {
        throw error;
      }, "Gemini");
    }
  }

  if (await isOllamaAvailable()) {
    console.log("GEMINI_API_KEY not set. Using local Ollama...");
    return runWithFallback(() => generateWithOllama(prompt), "Ollama");
  }

  return {
    provider: "fallback",
    model: "template",
    entry: buildFallbackEntry(workItem),
  };
}
