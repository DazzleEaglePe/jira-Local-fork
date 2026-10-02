import { describe, expect, it } from "vitest"

import {
  calculateItemPosition,
  isOverLimit,
  moveTask,
  neighbourPositions,
  normalizeBuckets,
  planDrop,
  type BoardBucket,
} from "./board"

const task = (id: number, position: number) => ({ id, position, title: `T${id}` })

function board(): BoardBucket[] {
  return normalizeBuckets([
    { id: 2, title: "Doing", position: 2, count: 1, tasks: [task(3, 10)] },
    { id: 1, title: "To-Do", position: 1, count: 2, tasks: [task(2, 20), task(1, 10)] },
  ])
}

describe("normalizeBuckets", () => {
  it("should sort buckets and their tasks by position", () => {
    const result = board()

    expect(result.map((bucket) => bucket.id)).toEqual([1, 2])
    expect(result[0].tasks.map((item) => item.id)).toEqual([1, 2])
  })
})

describe("calculateItemPosition", () => {
  it("should place between neighbours", () => {
    expect(calculateItemPosition(10, 20)).toBe(15)
  })

  it("should handle list edges like the backend expects", () => {
    expect(calculateItemPosition(null, null)).toBe(0)
    expect(calculateItemPosition(null, 10)).toBe(5)
    expect(calculateItemPosition(10, null)).toBe(10 + 65536)
  })

  it("should nudge when both neighbours share a position", () => {
    expect(calculateItemPosition(10, 10)).toBe(10.01)
  })
})

describe("moveTask", () => {
  it("should move a task to another bucket at the given index and fix counts", () => {
    const result = moveTask(board(), 1, 2, 0)

    expect(result[0].tasks.map((item) => item.id)).toEqual([2])
    expect(result[1].tasks.map((item) => item.id)).toEqual([1, 3])
    expect(result.map((bucket) => bucket.count)).toEqual([1, 2])
  })

  it("should reorder inside the same bucket without changing counts", () => {
    const result = moveTask(board(), 1, 1, 1)

    expect(result[0].tasks.map((item) => item.id)).toEqual([2, 1])
    expect(result[0].count).toBe(2)
  })

  it("should not mutate the input", () => {
    const input = board()
    moveTask(input, 1, 2, 0)

    expect(input[0].tasks.map((item) => item.id)).toEqual([1, 2])
  })
})

describe("planDrop", () => {
  it("should land in the drop target even if drag-over left the task elsewhere", () => {
    // task 1 was live-moved into Doing (2) during drag, but dropped on To-Do (1)
    const midDrag = moveTask(board(), 1, 2, 0)
    const { buckets, position } = planDrop(midDrag, 1, 1, 0)

    expect(buckets[0].tasks.map((item) => item.id)).toEqual([1, 2])
    expect(buckets[1].tasks.map((item) => item.id)).toEqual([3])
    expect(position).toBe(10) // before task 2 (position 20) at the top: 20 / 2
    expect(buckets[0].tasks[0].position).toBe(10)
  })

  it("should compute the position between new neighbours", () => {
    const { position } = planDrop(board(), 3, 1, 1) // between 10 and 20

    expect(position).toBe(15)
  })
})

describe("board helpers", () => {
  it("should return neighbour positions", () => {
    const [todo] = board()

    expect(neighbourPositions(todo, 1)).toEqual([null, 20])
    expect(neighbourPositions(todo, 2)).toEqual([10, null])
  })

  it("should flag buckets over their WIP limit", () => {
    expect(isOverLimit({ count: 4, limit: 3 })).toBe(true)
    expect(isOverLimit({ count: 3, limit: 3 })).toBe(false)
    expect(isOverLimit({ count: 9, limit: 0 })).toBe(false)
  })
})
