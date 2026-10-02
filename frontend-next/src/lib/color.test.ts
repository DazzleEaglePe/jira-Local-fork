import { describe, expect, it } from "vitest"

import { readableTextColor, toHex } from "./color"

describe("toHex", () => {
  it("should normalize Vikunja colors", () => {
    expect(toHex("e30613")).toBe("#e30613")
    expect(toHex("#1868DB")).toBe("#1868DB")
    expect(toHex("")).toBeUndefined()
    expect(toHex("nope")).toBeUndefined()
  })
})

describe("readableTextColor", () => {
  it("should pick black on light and white on dark backgrounds", () => {
    expect(readableTextColor("#fbc828")).toBe("#000000")
    expect(readableTextColor("#1868db")).toBe("#ffffff")
    expect(readableTextColor("#e30613")).toBe("#ffffff")
  })
})
