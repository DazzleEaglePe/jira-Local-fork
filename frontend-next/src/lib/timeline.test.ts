import { describe, expect, it } from "vitest"

import { barGeometry, defaultRange, rangeDays, rangeFilter, shiftRange, taskSpan } from "./timeline"

const range = { from: new Date(2026, 9, 1), to: new Date(2026, 9, 10) }

describe("defaultRange", () => {
  it("should span 15 days back and 55 ahead of today", () => {
    const { from, to } = defaultRange(new Date(2026, 9, 2, 15, 30))
    expect(from).toEqual(new Date(2026, 8, 17))
    expect(to).toEqual(new Date(2026, 10, 26))
  })

  it("should list every day and shift by whole days", () => {
    expect(rangeDays(range)).toHaveLength(10)
    expect(shiftRange(range, 7).from).toEqual(new Date(2026, 9, 8))
  })
})

describe("rangeFilter", () => {
  it("should build the Vikunja filter with plain dates", () => {
    expect(rangeFilter(range)).toContain('(start_date >= "2026-10-01" && start_date <= "2026-10-10")')
    expect(rangeFilter(range)).toContain('(start_date <= "2026-10-01" && end_date >= "2026-10-10")')
  })
})

describe("taskSpan", () => {
  it("should use start and end dates and ignore the API zero date", () => {
    const span = taskSpan({ start_date: "2026-10-02T10:00:00", end_date: "2026-10-05T00:00:00", due_date: "0001-01-01T00:00:00Z" })
    expect(span).toEqual({ start: new Date(2026, 9, 2), end: new Date(2026, 9, 5) })
  })

  it("should fall back to a one-day bar on the due date", () => {
    expect(taskSpan({ due_date: "2026-10-04T12:00:00" })).toEqual({
      start: new Date(2026, 9, 4),
      end: new Date(2026, 9, 4),
    })
    expect(taskSpan({})).toBeNull()
  })
})

describe("barGeometry", () => {
  it("should place a bar inside the range", () => {
    const span = { start: new Date(2026, 9, 3), end: new Date(2026, 9, 5) }
    expect(barGeometry(span, range)).toEqual({ startDay: 2, days: 3, clippedStart: false, clippedEnd: false })
  })

  it("should clip bars that overflow and drop bars outside", () => {
    const span = { start: new Date(2026, 8, 28), end: new Date(2026, 9, 20) }
    expect(barGeometry(span, range)).toEqual({ startDay: 0, days: 10, clippedStart: true, clippedEnd: true })
    expect(barGeometry({ start: new Date(2026, 10, 1), end: new Date(2026, 10, 2) }, range)).toBeNull()
  })
})
