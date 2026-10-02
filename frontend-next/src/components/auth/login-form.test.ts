import { describe, expect, it } from "vitest"

import { safeRedirect } from "./login-form"

describe("safeRedirect", () => {
  it("should keep same-app paths", () => {
    expect(safeRedirect("/projects/2")).toBe("/projects/2")
  })

  it("should fall back to the dashboard for missing or external targets", () => {
    expect(safeRedirect(null)).toBe("/dashboard")
    expect(safeRedirect("https://evil.example")).toBe("/dashboard")
    expect(safeRedirect("//evil.example")).toBe("/dashboard")
  })
})
