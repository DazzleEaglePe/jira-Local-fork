import { describe, expect, it } from "vitest"

import type { BoardBucket } from "./board"
import { boardAssignees, boardLabels, EMPTY_BOARD_FILTER, toggleId, UNASSIGNED, visibleTaskIds } from "./board-filter"

const ana = { id: 1, username: "ana", name: "Ana" }
const beto = { id: 2, username: "beto", name: "Beto" }
const bug = { id: 10, title: "bug" }
const ux = { id: 11, title: "ux" }

const buckets: BoardBucket[] = [
  {
    id: 1,
    title: "Por hacer",
    count: 3,
    limit: 0,
    position: 1,
    tasks: [
      { id: 1, position: 1, title: "Login roto", assignees: [ana], labels: [bug] },
      { id: 2, position: 2, title: "Nuevo menú", assignees: [beto], labels: [ux] },
      { id: 3, position: 3, title: "Login social", assignees: [], labels: [] },
    ],
  },
  {
    id: 2,
    title: "Hecho",
    count: 1,
    limit: 0,
    position: 2,
    tasks: [{ id: 4, position: 1, title: "Tema oscuro", assignees: [ana, beto], labels: [ux] }],
  },
]

const ids = (set?: Set<number>) => (set ? [...set].sort() : set)

describe("visibleTaskIds", () => {
  it("should return undefined when no filter is active", () => {
    expect(visibleTaskIds(buckets, EMPTY_BOARD_FILTER)).toBeUndefined()
  })

  it("should OR values within a group and AND across groups", () => {
    expect(ids(visibleTaskIds(buckets, { ...EMPTY_BOARD_FILTER, assignees: [1, 2] }))).toEqual([1, 2, 4])
    expect(ids(visibleTaskIds(buckets, { text: "", assignees: [1], labels: [11] }))).toEqual([4])
  })

  it("should match unassigned tasks and text case-insensitively", () => {
    expect(ids(visibleTaskIds(buckets, { ...EMPTY_BOARD_FILTER, assignees: [UNASSIGNED] }))).toEqual([3])
    expect(ids(visibleTaskIds(buckets, { ...EMPTY_BOARD_FILTER, text: " LOGIN " }))).toEqual([1, 3])
  })
})

describe("board options", () => {
  it("should list unique assignees and labels sorted by name", () => {
    expect(boardAssignees(buckets).map((user) => user.id)).toEqual([1, 2])
    expect(boardLabels(buckets).map((label) => label.title)).toEqual(["bug", "ux"])
  })

  it("should toggle ids", () => {
    expect(toggleId([1, 2], 2)).toEqual([1])
    expect(toggleId([1], 2)).toEqual([1, 2])
  })
})
