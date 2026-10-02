import { describe, expect, it } from "vitest"

import { filterProjects } from "./project-directory"

const projects = [
  { id: -1, title: "Favorites" },
  { id: 3, title: "Zeta", is_archived: true },
  { id: 2, title: "Modernización", identifier: "MOD" },
  { id: 1, title: "Inbox" },
]

describe("filterProjects", () => {
  it("should list real projects, active first, alphabetically", () => {
    expect(filterProjects(projects, "").map((project) => project.id)).toEqual([1, 2, 3])
  })

  it("should match by translated title or identifier, case-insensitively", () => {
    expect(filterProjects(projects, "bandeja").map((project) => project.id)).toEqual([1])
    expect(filterProjects(projects, "mod").map((project) => project.id)).toEqual([2])
  })
})
