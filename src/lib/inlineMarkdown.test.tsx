import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderInlineMarkdown, renderMarkdown } from "./inlineMarkdown";

const html = (text: string) => render(<p>{renderInlineMarkdown(text)}</p>).container.innerHTML;

describe("renderInlineMarkdown", () => {
  it("renders bold, italic and nesting", () => {
    expect(html("a **b** _c_ *d*")).toBe("<p>a <strong>b</strong> <em>c</em> <em>d</em></p>");
    expect(html("**_x_**")).toBe("<p><strong><em>x</em></strong></p>");
    expect(html("***x***")).toBe("<p><strong><em>x</em></strong></p>");
    expect(html("_**x**_")).toBe("<p><em><strong>x</strong></em></p>");
    expect(html("*__x__*")).toBe("<p><em><strong>x</strong></em></p>");
    expect(html("__x__")).toBe("<p><strong>x</strong></p>");
    expect(html("**a *b***")).toBe("<p><strong>a <em>b</em></strong></p>");
  });

  it("leaves snake_case and html as plain text", () => {
    expect(html("my_var_name")).toBe("<p>my_var_name</p>");
    expect(html("marked with (*) are required.\n\n***x***")).toBe(
      "<p>marked with (*) are required.\n\n<strong><em>x</em></strong></p>",
    );
    expect(html("my\\_var (\\*) \\*\\*not bold\\*\\*")).toBe("<p>my_var (*) **not bold**</p>");
    expect(html("<b>x</b>")).toBe("<p>&lt;b&gt;x&lt;/b&gt;</p>");
  });
});

describe("links and lists", () => {
  it("renders safe links only", () => {
    expect(html("see [**docs**](https://x.io/a_b)")).toBe(
      '<p>see <a class="text-[#1e55c5] underline underline-offset-2" href="https://x.io/a_b" rel="noopener noreferrer" target="_blank"><strong>docs</strong></a></p>',
    );
    expect(html("[x](javascript:alert(1))")).toBe("<p>[x](javascript:alert(1))</p>");
  });

  it("groups bullet lines into a list", () => {
    const out = render(<div>{renderMarkdown("Intro\n- a\n* **b**\nEnd")}</div>).container.innerHTML;
    expect(out).toBe(
      '<div>Intro<ul class="my-1 list-disc pl-6"><li>a</li><li><strong>b</strong></li></ul>End</div>',
    );
  });
});
