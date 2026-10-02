import type { Label, User } from "@/lib/api/generated/types.gen"
import type { BoardBucket, BoardTask } from "@/lib/board"

/** Pseudo assignee id for Jira's "Sin asignar" avatar. */
export const UNASSIGNED = 0

export type BoardFilter = {
  text: string
  assignees: number[]
  labels: number[]
}

export const EMPTY_BOARD_FILTER: BoardFilter = { text: "", assignees: [], labels: [] }

export function isFilterActive(filter: BoardFilter): boolean {
  return filter.text.trim() !== "" || filter.assignees.length > 0 || filter.labels.length > 0
}

export function toggleId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

function matches(task: BoardTask, filter: BoardFilter, needle: string): boolean {
  if (needle && !task.title?.toLowerCase().includes(needle)) return false
  if (filter.assignees.length > 0) {
    const ids = (task.assignees ?? []).map((user) => user.id)
    const hit = filter.assignees.some((id) => (id === UNASSIGNED ? ids.length === 0 : ids.includes(id)))
    if (!hit) return false
  }
  if (filter.labels.length > 0 && !(task.labels ?? []).some((label) => filter.labels.includes(label.id ?? -1))) {
    return false
  }
  return true
}

/**
 * Ids of the tasks that pass the filter, or undefined when nothing is filtered.
 * Like Jira: values within a group are OR-ed, groups are AND-ed.
 */
export function visibleTaskIds(buckets: BoardBucket[], filter: BoardFilter): Set<number> | undefined {
  if (!isFilterActive(filter)) return undefined
  const needle = filter.text.trim().toLowerCase()
  return new Set(
    buckets
      .flatMap((bucket) => bucket.tasks)
      .filter((task) => matches(task, filter, needle))
      .map((task) => task.id),
  )
}

function uniqueById<T extends { id?: number }>(items: T[]): (T & { id: number })[] {
  const byId = new Map<number, T & { id: number }>()
  for (const item of items) if (typeof item.id === "number") byId.set(item.id, item as T & { id: number })
  return [...byId.values()]
}

/** People assigned to loaded tasks, by display name. */
export function boardAssignees(buckets: BoardBucket[]): (User & { id: number })[] {
  const users = uniqueById(buckets.flatMap((bucket) => bucket.tasks.flatMap((task) => task.assignees ?? [])))
  return users.sort((a, b) => (a.name || a.username || "").localeCompare(b.name || b.username || "", "es"))
}

export function boardLabels(buckets: BoardBucket[]): (Label & { id: number })[] {
  const labels = uniqueById(buckets.flatMap((bucket) => bucket.tasks.flatMap((task) => task.labels ?? [])))
  return labels.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "", "es"))
}
