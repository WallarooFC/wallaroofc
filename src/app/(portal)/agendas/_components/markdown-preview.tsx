"use client";

import Markdown from "react-markdown";

export function MarkdownPreview({ source }: { source: string | null | undefined }) {
  if (!source || !source.trim()) {
    return <p className="text-sm italic text-wfc-grey">Nothing here yet.</p>;
  }
  return (
    <div className="prose prose-sm max-w-none text-wfc-charcoal">
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 className="font-serif text-2xl font-semibold text-wfc-blue-deep">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-4 font-serif text-lg font-semibold text-wfc-blue-deep">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 font-serif text-base font-semibold text-wfc-blue-deep">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-2 text-sm leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-5 text-sm">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5 text-sm">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-wfc-blue-deep underline hover:text-wfc-red"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded-sm bg-wfc-cream px-1 font-mono text-[12px] text-wfc-blue-deep">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-wfc-line pl-3 text-sm italic text-wfc-grey">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-wfc-line" />,
        }}
      >
        {source}
      </Markdown>
    </div>
  );
}
