import { describe, expect, it } from "vitest"

import { initials } from "./user-menu"

describe("initials", () => {
  it("should use first and last name initials", () => {
    expect(initials("Bruno Choquehuanca Velasques")).toBe("BV")
  })

  it("should use the first two letters of a single word", () => {
    expect(initials("prueba")).toBe("PR")
  })

  it("should fall back for empty names", () => {
    expect(initials("  ")).toBe("?")
  })
})
