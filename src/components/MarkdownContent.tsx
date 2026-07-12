"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { isValidElement, type ReactNode } from "react";
import { slugifyHeading, type TocItem } from "@/lib/toc";
import { CopyCodeBlock } from "./CopyCodeBlock";

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return "";
}

function createMarkdownComponents(toc: TocItem[]): Components {
  let headingIndex = 0;

  function nextHeadingId(level: 2 | 3, children: ReactNode): string {
    const item = toc[headingIndex];
    if (item?.level === level) {
      headingIndex++;
      return item.id;
    }
    return slugifyHeading(getNodeText(children));
  }

  return {
    h2({ children }) {
      const id = nextHeadingId(2, children);
      return (
        <h2 id={id} className="scroll-mt-24">
          {children}
        </h2>
      );
    },
    h3({ children }) {
      const id = nextHeadingId(3, children);
      return (
        <h3 id={id} className="scroll-mt-24">
          {children}
        </h3>
      );
    },
    pre({ children }) {
      return <CopyCodeBlock>{children}</CopyCodeBlock>;
    },
  };
}

export function MarkdownContent({
  content,
  toc = [],
}: {
  content: string;
  toc?: TocItem[];
}) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-pre:bg-zinc-950 prose-pre:text-zinc-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={createMarkdownComponents(toc)}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
