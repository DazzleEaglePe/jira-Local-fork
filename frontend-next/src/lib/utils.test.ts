import { describe, expect, it } from "vitest"

import { cn } from "./utils"

describe("cn", () => {
  it("should merge conflicting tailwind classes keeping the last one", () => {
    expect(cn("px-2 text-sm", "px-4")).toBe("text-sm px-4")
  })

  it("should drop falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c")
  })
})
