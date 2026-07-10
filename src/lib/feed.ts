import { getAllManifestEntries } from "./entries";
import type { ManifestEntry } from "./schema";

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822Date(date: string): string {
  return new Date(`${date}T12:00:00Z`).toUTCString();
}

function buildItem(entry: ManifestEntry, siteUrl: string): string {
  const link = `${siteUrl}/dev/${entry.slug}`;
  const tags = entry.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("");

  return `<item>
<title>${escapeXml(entry.title)}</title>
<link>${link}</link>
<guid isPermaLink="true">${link}</guid>
<pubDate>${toRfc822Date(entry.date)}</pubDate>
<description>${escapeXml(entry.summary)}</description>
${tags}
</item>`;
}

export function buildRssFeed(): string {
  const siteUrl = getSiteUrl();
  const entries = getAllManifestEntries();
  const feedUrl = `${siteUrl}/dev/feed.xml`;
  const lastBuildDate =
    entries.length > 0 ? toRfc822Date(entries[0].date) : new Date().toUTCString();
  const items = entries.map((entry) => buildItem(entry, siteUrl)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Dev Lab</title>
<link>${siteUrl}/dev</link>
<description>Practical developer tips, patterns, and runnable snippets from Dev Lab.</description>
<language>en</language>
<lastBuildDate>${lastBuildDate}</lastBuildDate>
<atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>`;
}
