import { describe, expect, it } from "vitest"

import { formatTaskDate, getTaskIdentifier, isTaskOverdue, parseTaskDate } from "./tasks"

describe("getTaskIdentifier", () => {
  it("should prefer the project identifier", () => {
    expect(getTaskIdentifier({ identifier: "CI-12", index: 12 })).toBe("CI-12")
  })

  it("should fall back to #index when there is no project identifier", () => {
    expect(getTaskIdentifier({ identifier: "-3", index: 3 })).toBe("#3")
    expect(getTaskIdentifier({ index: 4 })).toBe("#4")
  })
})

describe("task dates", () => {
  it("should treat Vikunja's zero date as unset", () => {
    expect(parseTaskDate("0001-01-01T00:00:00Z")).toBeNull()
    expect(formatTaskDate("0001-01-01T00:00:00Z")).toBeNull()
  })

  it("should format dates in Spanish", () => {
    expect(formatTaskDate("2026-10-02T12:00:00Z")).toBe("2 oct 2026")
  })

  it("should flag only undone tasks past their due date", () => {
    const now = new Date("2026-10-02T12:00:00Z")
    expect(isTaskOverdue({ done: false, due_date: "2026-10-01T12:00:00Z" }, now)).toBe(true)
    expect(isTaskOverdue({ done: true, due_date: "2026-10-01T12:00:00Z" }, now)).toBe(false)
    expect(isTaskOverdue({ done: false, due_date: "0001-01-01T00:00:00Z" }, now)).toBe(false)
  })
})
