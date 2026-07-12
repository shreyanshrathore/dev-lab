export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanHeadingText(raw: string): string {
  return raw.replace(/[*_`]/g, "").trim();
}

function uniqueId(base: string, used: Map<string, number>): string {
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

export function extractToc(content: string): TocItem[] {
  const withoutCode = content.replace(/```[\s\S]*?```/g, "");
  const items: TocItem[] = [];
  const usedIds = new Map<string, number>();

  for (const line of withoutCode.split("\n")) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const text = cleanHeadingText(match[2]);
    const baseId = slugifyHeading(text);
    if (!baseId) continue;

    items.push({
      id: uniqueId(baseId, usedIds),
      text,
      level,
    });
  }

  return items;
}
