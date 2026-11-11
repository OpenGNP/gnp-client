import { Fragment, type ReactNode } from "react";

// \* style escapes (the editor writes them), [text](url) (http, https or mailto only), ***both***, **bold** / __bold__, _italic_ / *italic*. `_` must not touch a word so snake_case stays plain;
// a closing `**` may not be followed by `*` so `**a *b***` closes the italic first;
// `*italic*` stays on one line and can't start/end on a space, so a stray `(*)` stays literal.
const PATTERN =
  /\\([\\`*_{}[\]()#+\-.!|>~])|\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*(?!\*)|(?<!\w)__(.+?)__(?!\w)|(?<!\w)_(.+?)_(?!\w)|\*([^*\s](?:[^*\n]*?[^*\s])?)\*/g;

const BULLET = /^\s*[-*]\s+(.*)$/;

/** Renders markdown with `- ` bullet lists; text between lists keeps its line breaks (pre-line). */
export function renderMarkdown(text: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let lines: string[] = [];
  let items: string[] = [];
  const flush = () => {
    if (lines.length) blocks.push(<Fragment key={blocks.length}>{renderInlineMarkdown(lines.join("\n"))}</Fragment>);
    if (items.length)
      blocks.push(
        <ul className="my-1 list-disc pl-6" key={blocks.length}>
          {items.map((item, i) => (
            <li key={i}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      );
    lines = [];
    items = [];
  };
  for (const line of text.split("\n")) {
    const bullet = BULLET.exec(line);
    if (bullet ? lines.length : items.length) flush();
    if (bullet) items.push(bullet[1]);
    else lines.push(line);
  }
  flush();
  return blocks;
}

/** Renders the inline subset (links, bold, italic) as React nodes (no HTML injection). */
export function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const [, escaped, linkText, href, both, starBold, underscoreBold, italic, starItalic] = match;
    const bold = starBold ?? underscoreBold;
    nodes.push(
      escaped !== undefined ? (
        escaped
      ) : href !== undefined ? (
        <a
          className="text-[#1e55c5] underline underline-offset-2"
          href={href}
          key={index}
          rel="noopener noreferrer"
          target="_blank"
        >
          {renderInlineMarkdown(linkText)}
        </a>
      ) : both !== undefined ? (
        <strong key={index}>
          <em>{renderInlineMarkdown(both)}</em>
        </strong>
      ) : bold !== undefined ? (
        <strong key={index}>{renderInlineMarkdown(bold)}</strong>
      ) : (
        <em key={index}>{renderInlineMarkdown(italic ?? starItalic)}</em>
      ),
    );
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
