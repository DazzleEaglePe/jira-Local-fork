import { describe, expect, it } from "vitest"

import { buildProjectTree, getProjectAncestors, projectColor, projectTitle } from "./projects"

const projects = [
  { id: -1, title: "Favorites" },
  { id: -2, title: "Filtro guardado" },
  { id: 1, title: "Inbox", position: 2, parent_project_id: 0 },
  { id: 2, title: "Modernización", position: 1, parent_project_id: 0 },
  { id: 3, title: "Navbar", position: 1, parent_project_id: 2 },
  { id: 4, title: "Archivado", position: 3, parent_project_id: 0, is_archived: true },
  { id: 5, title: "Huérfano", position: 4, parent_project_id: 99 },
]

describe("buildProjectTree", () => {
  it("should keep only real non-archived projects, nested and sorted by position", () => {
    const tree = buildProjectTree(projects)

    expect(tree.map((node) => node.title)).toEqual(["Modernización", "Inbox", "Huérfano"])
    expect(tree[0].children.map((node) => node.title)).toEqual(["Navbar"])
  })
})

describe("getProjectAncestors", () => {
  it("should return parents root first", () => {
    expect(getProjectAncestors(projects, 3).map((project) => project.id)).toEqual([2])
    expect(getProjectAncestors(projects, 2)).toEqual([])
  })

  it("should not loop on cyclic parents", () => {
    const cyclic = [
      { id: 10, parent_project_id: 11 },
      { id: 11, parent_project_id: 10 },
    ]
    expect(getProjectAncestors(cyclic, 10).map((project) => project.id)).toEqual([11])
  })
})

describe("project helpers", () => {
  it("should normalize hex colors", () => {
    expect(projectColor("e30613")).toBe("#e30613")
    expect(projectColor("#1868db")).toBe("#1868db")
    expect(projectColor("")).toBeUndefined()
  })

  it("should translate pseudo and inbox titles", () => {
    expect(projectTitle({ id: -1, title: "Favorites" })).toBe("Favoritos")
    expect(projectTitle({ id: 1, title: "Inbox" })).toBe("Bandeja de entrada")
    expect(projectTitle({ id: 2, title: "Modernización" })).toBe("Modernización")
  })
})
