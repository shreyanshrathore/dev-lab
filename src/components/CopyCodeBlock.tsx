"use client";

import { isValidElement, useState, type ReactNode } from "react";

function getCodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getCodeText).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getCodeText(node.props.children);
  }
  return "";
}

export function CopyCodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = getCodeText(children).replace(/\n$/, "");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
        className="absolute right-3 top-3 z-10 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 opacity-100 transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre>{children}</pre>
    </div>
  );
}
