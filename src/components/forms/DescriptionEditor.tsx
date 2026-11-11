import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Link, List } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FORM_DESCRIPTION_CLASS } from "./FormPaper";

// Only links the respondent renderer (renderMarkdown) will also turn into links.
const SAFE_URL = /^(https?:\/\/|mailto:)/i;

const extensions = [
  // Just what renderMarkdown shows to respondents.
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    orderedList: false,
    strike: false,
    underline: false,
    trailingNode: false,
    link: { openOnClick: false, autolink: true, isAllowedUri: (url) => SAFE_URL.test(url) },
  }),
  // breaks: a single newline in older descriptions stays a line break instead of joining lines.
  Markdown.configure({ markedOptions: { breaks: true } }),
];

/** Google Forms-style rich description; stored as markdown so respondents see it via renderMarkdown. */
export function DescriptionEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const editor = useEditor({
    extensions,
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        "aria-label": "Form description",
        "aria-multiline": "true",
        role: "textbox",
        class: "outline-none [&_p+p]:mt-6 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-[#1e55c5] [&_a]:underline [&_a]:underline-offset-2",
      },
      // ⌘K / Ctrl+K opens the link box, as in Google Forms.
      handleKeyDown: (_view, event) => {
        if (!((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) return false;
        event.preventDefault();
        setLinkOpen(true);
        return true;
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(editor.isEmpty ? "" : editor.getMarkdown()),
  });
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      focused: editor.isFocused,
      empty: editor.isEmpty,
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      link: editor.isActive("link"),
      bulletList: editor.isActive("bulletList"),
    }),
  });

  // The form loads after mount (or gets reset); skip when the change came from typing here.
  // StrictMode destroys and recreates the editor; the effect re-runs with the new instance.
  useEffect(() => {
    if (editor.isDestroyed) return;
    if (editor.isEmpty ? value === "" : editor.getMarkdown() === value) return;
    editor.commands.setContent(value, { contentType: "markdown", emitUpdate: false });
  }, [editor, value]);

  const showToolbar = state.focused || linkOpen;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          FORM_DESCRIPTION_CLASS,
          "relative cursor-text border-0 border-b-2 pb-1 transition-colors duration-150",
          state.focused ? "border-[#1e55c5]" : "border-transparent hover:border-[#d2d8e5]",
        )}
      >
        {state.empty ? (
          <span aria-hidden className="pointer-events-none absolute left-0 top-0">
            Form description
          </span>
        ) : null}
        <EditorContent editor={editor} />
      </div>
      <div className={cn("gap-1", showToolbar ? "flex" : "hidden")}>
        <ToolbarButton active={state.bold} icon={<Bold size={18} />} label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton active={state.italic} icon={<Italic size={18} />} label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} />
        <Popover onOpenChange={setLinkOpen} open={linkOpen}>
          <PopoverAnchor asChild>
            <span>
              <ToolbarButton active={state.link} icon={<Link size={18} />} label="Link" onClick={() => setLinkOpen(true)} />
            </span>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            className="w-72 rounded-[10px] border border-[#e8eaf1] bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
            sideOffset={8}
          >
            <LinkForm editor={editor} onDone={() => setLinkOpen(false)} />
          </PopoverContent>
        </Popover>
        <ToolbarButton
          active={state.bulletList}
          icon={<List size={18} />}
          label="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
      </div>
    </div>
  );
}

function ToolbarButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded text-[#616161] hover:bg-[#f1f3f4]",
            active && "bg-[#e8eefb] text-[#1e55c5]",
          )}
          // Keep the editor's selection while clicking.
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}
          type="button"
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function LinkForm({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const current = editor.getAttributes("link").href as string | undefined;
  const [url, setUrl] = useState(current ?? "");
  const href = SAFE_URL.test(url.trim()) ? url.trim() : `https://${url.trim()}`;

  const apply = () => {
    if (!url.trim()) return;
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !current) {
      chain.insertContent({ type: "text", text: url.trim(), marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      chain.setLink({ href }).run();
    }
    onDone();
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <input
        aria-label="Link URL"
        autoFocus
        className="h-9 rounded-md border border-[#d2d8e5] px-2 text-sm outline-none focus:border-[#1e55c5]"
        onChange={(event) => setUrl(event.target.value)}
        placeholder="Paste or type a link"
        value={url}
      />
      <div className="flex justify-end gap-2">
        {current ? (
          <Button
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              onDone();
            }}
            type="button"
            variant="ghost"
          >
            Remove
          </Button>
        ) : null}
        <Button disabled={!url.trim()} type="submit">
          Apply
        </Button>
      </div>
    </form>
  );
}
