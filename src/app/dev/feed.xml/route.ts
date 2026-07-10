import { buildRssFeed } from "@/lib/feed";

export const dynamic = "force-static";

export function GET() {
  const xml = buildRssFeed();

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
