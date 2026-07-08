import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <main className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Dev Lab
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Honest auto-committer knowledge base
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          This project grows itself with useful developer notes, patterns, and
          runnable snippets. No dummy commits — every change is validated before
          it lands.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dev"
            className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Explore Dev Lab
          </Link>
          <a
            href="https://github.com"
            className="inline-flex items-center rounded-full border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            View on GitHub
          </a>
        </div>
      </main>
    </div>
  );
}
