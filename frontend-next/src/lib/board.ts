import type { Bucket, Task } from "@/lib/api/generated/types.gen"

export type BoardTask = Task & { id: number; position: number }

export type BoardBucket = {
  id: number
  title: string
  /** Total tasks in the bucket on the server (may exceed tasks.length when paginated). */
  count: number
  /** WIP limit; 0 = no limit */
  limit: number
  position: number
  tasks: BoardTask[]
}

export function normalizeTask(task: Task): BoardTask {
  return { ...task, id: task.id ?? 0, position: task.position ?? 0 }
}

export function normalizeBuckets(buckets: readonly Bucket[]): BoardBucket[] {
  return buckets
    .filter((bucket) => typeof bucket.id === "number")
    .map((bucket) => ({
      id: bucket.id as number,
      title: bucket.title ?? "",
      count: bucket.count ?? 0,
      limit: bucket.limit ?? 0,
      position: bucket.position ?? 0,
      tasks: (bucket.tasks ?? []).map(normalizeTask).sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => a.position - b.position)
}

// Must match the backend's MinPositionSpacing (same helper as the Vue app).
const MIN_POSITION_SPACING = 0.01

/** Position for an item dropped between `before` and `after` (null = list edge). */
export function calculateItemPosition(before: number | null = null, after: number | null = null): number {
  if (before !== null && after !== null && before === after) return after + MIN_POSITION_SPACING
  if (before === null) return after === null ? 0 : after / 2
  if (after === null) return before + 2 ** 16
  return before + (after - before) / 2
}

export function findTaskLocation(buckets: readonly BoardBucket[], taskId: number) {
  for (const bucket of buckets) {
    const index = bucket.tasks.findIndex((task) => task.id === taskId)
    if (index >= 0) return { bucketId: bucket.id, index }
  }
  return null
}

/**
 * Moves a task to `toBucketId` at `toIndex` (immutable). Counts are adjusted so
 * column headers stay right while the request is in flight.
 */
export function moveTask(
  buckets: readonly BoardBucket[],
  taskId: number,
  toBucketId: number,
  toIndex: number
): BoardBucket[] {
  const from = findTaskLocation(buckets, taskId)
  if (!from) return [...buckets]
  const task = buckets.find((bucket) => bucket.id === from.bucketId)!.tasks[from.index]

  return buckets.map((bucket) => {
    let tasks = bucket.tasks
    let count = bucket.count
    if (bucket.id === from.bucketId) {
      tasks = tasks.filter((item) => item.id !== taskId)
      if (bucket.id !== toBucketId) count -= 1
    }
    if (bucket.id === toBucketId) {
      const index = Math.max(0, Math.min(toIndex, tasks.length))
      tasks = [...tasks.slice(0, index), task, ...tasks.slice(index)]
      if (bucket.id !== from.bucketId) count += 1
    }
    return tasks === bucket.tasks ? bucket : { ...bucket, tasks, count }
  })
}

/** Neighbour positions of a task at its current place, for calculateItemPosition. */
export function neighbourPositions(bucket: BoardBucket, taskId: number): [number | null, number | null] {
  const index = bucket.tasks.findIndex((task) => task.id === taskId)
  return [bucket.tasks[index - 1]?.position ?? null, bucket.tasks[index + 1]?.position ?? null]
}

/**
 * Final placement of a drop: always moves the task to the drop target, even if the
 * last drag-over left it in an intermediate column (fast drags skip drag-over events).
 */
export function planDrop(buckets: readonly BoardBucket[], taskId: number, toBucketId: number, toIndex: number) {
  const next = moveTask(buckets, taskId, toBucketId, toIndex)
  const bucket = next.find((item) => item.id === toBucketId)
  const [before, after] = bucket ? neighbourPositions(bucket, taskId) : [null, null]
  const position = calculateItemPosition(before, after)
  return {
    position,
    buckets: next.map((item) =>
      item.id === toBucketId
        ? { ...item, tasks: item.tasks.map((task) => (task.id === taskId ? { ...task, position } : task)) }
        : item
    ),
  }
}

export function isOverLimit(bucket: Pick<BoardBucket, "count" | "limit">): boolean {
  return bucket.limit > 0 && bucket.count > bucket.limit
}
