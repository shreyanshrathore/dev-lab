# Dev Lab — Honest Auto-Committer

A self-growing developer knowledge base that produces **real, useful commits** instead of dummy timestamp bumps. Each scheduled run generates a practical dev note with a runnable snippet, validates the build, and pushes only if everything passes.

Live site route: `/dev`

## What it does

- Picks the next topic from `content/backlog.json`
- Once per week, may pick a small site improvement from `content/roadmap.json`
- Uses Google Gemini to write a concise MDX entry
- Updates `content/manifest.json`
- Runs `tsc` + `next build` before any commit
- Commits via GitHub Actions on a cron schedule (~3x/day)

## Project structure

```text
dev-lab/
├── content/
│   ├── backlog.json          # rotating curriculum of topics
│   ├── roadmap.json          # occasional site feature tasks
│   ├── manifest.json         # index of published entries
│   └── entries/*.mdx         # generated knowledge entries
├── scripts/
│   ├── generate.mjs          # AI generation pipeline
│   └── validate.mjs          # schema + build validation
├── src/app/dev/              # knowledge base UI
└── .github/workflows/dev-lab.yml
```

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000/dev](http://localhost:3000/dev).

## Run the pipeline locally

`npm run pipeline` now:

1. Picks the next **roadmap code task** from `content/roadmap.json`
2. Runs **Cursor** to make real changes in `src/`
3. Validates the build (`tsc` + `next build`)
4. **Commits** the changes to your current git branch

### Setup

```bash
export CURSOR_API_KEY="cursor_..."   # https://cursor.com/dashboard/integrations
npm run pipeline
```

Optional:

```bash
export CURSOR_MODEL=composer-2.5
export PIPELINE_PUSH=1             # also push to origin after commit
```

### MDX-only mode (old behavior)

To generate blog entries instead of code changes:

```bash
npm run pipeline:content
```

### Troubleshooting Gemini 429 / quota errors

If you see `429 Too Many Requests` or `limit: 0`:

- Your free-tier daily quota for that model is exhausted.
- Use `LLM_PROVIDER=ollama` locally instead.
- Or wait until quota resets (usually next day).
- Or switch model: `export GEMINI_MODEL=gemini-2.0-flash-lite`
- Check usage at https://ai.dev/rate-limit

This writes a new entry under `content/entries/` and updates the manifest.

## GitHub Actions setup

1. Push this repo to GitHub.
2. Add repository secret:

   - `GEMINI_API_KEY` — your Gemini API key

3. Ensure Actions can write to the repo:

   - Settings → Actions → General → Workflow permissions → **Read and write permissions**

4. The workflow runs at:

   - 08:30 IST
   - 14:30 IST
   - 20:30 IST

   You can also trigger it manually from the Actions tab.

## Portfolio integration

### Option A — standalone deploy (recommended)

1. Deploy `dev-lab` to Vercel.
2. Point `shreyansh-rathore.in/dev` to the deployed app via redirect or subdomain.

### Option B — merge into portfolio repo

Copy the `content/`, `scripts/`, and `src/app/dev/` pieces into your portfolio Next.js app and reuse the same workflow.

## Content model

Each entry MDX file includes frontmatter:

- `title`
- `slug`
- `date`
- `tags`
- `summary`
- `difficulty`
- `language`

Body sections:

- Why this matters
- The pattern
- Practical tip
- Gotcha
- Runnable code block

## Safety guarantees

- No commit happens if validation fails
- Duplicate slugs are rejected
- Every manifest entry must have a real MDX file with a code block
- Roadmap/content backlog items are marked `done` only after successful generation

## Troubleshooting

### `CURSOR_API_KEY is required for Cursor provider`

Get a key from https://cursor.com/dashboard/integrations and run with `LLM_PROVIDER=cursor`.

Note: Cursor runs locally against this repo on your Mac. GitHub Actions still uses Gemini (Cursor local agent is not available on CI runners).

### `429 Too Many Requests` from Gemini

Your free-tier quota is exhausted for that model. Locally, run:

```bash
export LLM_PROVIDER=ollama
npm run pipeline
```

For GitHub Actions, wait for quota reset or use a different Gemini model via `GEMINI_MODEL`.

### Build fails after generation

Run `npm run validate` locally to see whether the issue is schema-related or a Next.js build error.

### No pending backlog items

Add more objects to `content/backlog.json`.

## License

MIT
