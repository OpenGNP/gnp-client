import { Editor } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { expect, it } from "vitest";

import { renderMarkdown } from "../../lib/inlineMarkdown";
import { DescriptionEditor } from "./DescriptionEditor";

// What the editor saves must render the same for respondents.
it("editor markdown renders correctly for respondents", () => {
  const saved =
    "**Note:** All fields marked with (*) are required.\n\n***Contact the team.***\n\n- my_var\n- [docs](https://x.io)";
  const editor = new Editor({
    extensions: [StarterKit, Markdown.configure({ markedOptions: { breaks: true } })],
    content: saved,
    contentType: "markdown",
  });
  const html = render(<div>{renderMarkdown(editor.getMarkdown())}</div>).container.innerHTML;
  editor.destroy();
  expect(html).toContain("<strong>Note:</strong> All fields marked with (*) are required.");
  expect(html).toContain("<strong><em>Contact the team.</em></strong>");
  expect(html).toContain("<li>my_var</li>");
  expect(html).toContain('href="https://x.io"');
});

it("survives StrictMode remounts and picks up a description loaded later", async () => {
  const { rerender } = render(
    <StrictMode>
      <DescriptionEditor onChange={() => {}} value="" />
    </StrictMode>,
  );
  rerender(
    <StrictMode>
      <DescriptionEditor onChange={() => {}} value="**Loaded**" />
    </StrictMode>,
  );
  expect((await screen.findByRole("textbox", { name: "Form description" })).innerHTML).toContain(
    "<strong>Loaded</strong>",
  );
});
