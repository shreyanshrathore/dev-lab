"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { CopyCodeBlock } from "./CopyCodeBlock";

const markdownComponents: Components = {
  pre({ children }) {
    return <CopyCodeBlock>{children}</CopyCodeBlock>;
  },
};

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-pre:bg-zinc-950 prose-pre:text-zinc-100">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
