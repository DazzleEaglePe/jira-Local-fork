import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { RichTextView, isEmptyHtml } from "./rich-text"

describe("RichTextView", () => {
  it("should strip scripts and event handlers from API HTML", () => {
    const { container } = render(
      <RichTextView html={'<p>Hola</p><script>alert(1)</script><img src="x" onerror="alert(2)">'} />
    )

    expect(container.querySelector("script")).toBeNull()
    expect(container.querySelector("img")?.getAttribute("onerror")).toBeNull()
    expect(container.textContent).toContain("Hola")
  })

  it("should keep basic formatting", () => {
    const { container } = render(<RichTextView html="<p><strong>Importante</strong></p><ul><li>uno</li></ul>" />)

    expect(container.querySelector("strong")?.textContent).toBe("Importante")
    expect(container.querySelectorAll("li")).toHaveLength(1)
  })
})

describe("isEmptyHtml", () => {
  it("should treat empty editor output as empty", () => {
    expect(isEmptyHtml("<p></p>")).toBe(true)
    expect(isEmptyHtml(undefined)).toBe(true)
    expect(isEmptyHtml("<p>texto</p>")).toBe(false)
  })
})
