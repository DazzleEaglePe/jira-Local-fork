import { describe, expect, it } from "vitest"

import { defaultView, sortedViews, viewLabel } from "./views"

const views = [
  { id: 8, title: "Kanban", view_kind: "kanban" as const, position: 400 },
  { id: 5, title: "List", view_kind: "list" as const, position: 100 },
  { id: 9, title: "Sprint actual", view_kind: "kanban" as const, position: 500 },
]

describe("views", () => {
  it("should sort by position", () => {
    expect(sortedViews(views).map((view) => view.id)).toEqual([5, 8, 9])
  })

  it("should translate default titles and keep custom ones", () => {
    expect(viewLabel(views[0])).toBe("Tablero")
    expect(viewLabel(views[1])).toBe("Lista")
    expect(viewLabel(views[2])).toBe("Sprint actual")
  })

  it("should open the first kanban view by default", () => {
    expect(defaultView(views)?.id).toBe(8)
    expect(defaultView([views[1]])?.id).toBe(5)
    expect(defaultView([])).toBeUndefined()
  })
})
