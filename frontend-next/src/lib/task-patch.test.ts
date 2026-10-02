import { describe, expect, it } from "vitest"

import { API_ZERO_DATE, taskPatchOps } from "./task-patch"

describe("taskPatchOps", () => {
  it("should emit one add op per provided field", () => {
    expect(taskPatchOps({ priority: 3, done: true })).toEqual([
      { op: "add", path: "/priority", value: 3 },
      { op: "add", path: "/done", value: true },
    ])
  })

  it("should trim titles and skip undefined fields", () => {
    expect(taskPatchOps({ title: "  Nueva tarea  ", description: undefined })).toEqual([
      { op: "add", path: "/title", value: "Nueva tarea" },
    ])
  })

  it("should send the zero date to clear a date", () => {
    expect(taskPatchOps({ due_date: "" })).toEqual([{ op: "add", path: "/due_date", value: API_ZERO_DATE }])
  })

  it("should strip # from colors like the backend expects", () => {
    expect(taskPatchOps({ hex_color: "#e30613" })).toEqual([{ op: "add", path: "/hex_color", value: "e30613" }])
  })
})
