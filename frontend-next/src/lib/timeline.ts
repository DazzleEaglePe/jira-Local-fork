import { addDays, differenceInCalendarDays, format, startOfDay } from "date-fns"

import type { Task } from "@/lib/api/generated/types.gen"
import { parseTaskDate } from "@/lib/tasks"

// Same default window as the Vue gantt: 15 days back, 55 ahead.
export const DAYS_BEFORE = 15
export const DAYS_AFTER = 55

export type TimelineRange = { from: Date; to: Date }

export function defaultRange(today = new Date()): TimelineRange {
  const day = startOfDay(today)
  return { from: addDays(day, -DAYS_BEFORE), to: addDays(day, DAYS_AFTER) }
}

export function shiftRange(range: TimelineRange, days: number): TimelineRange {
  return { from: addDays(range.from, days), to: addDays(range.to, days) }
}

/** Every day in the range, both ends included. */
export function rangeDays(range: TimelineRange): Date[] {
  const total = differenceInCalendarDays(range.to, range.from) + 1
  return Array.from({ length: Math.max(total, 0) }, (_, index) => addDays(range.from, index))
}

/** Vikunja filter used by the Vue gantt: any of the task's dates touches the range. */
export function rangeFilter({ from, to }: TimelineRange): string {
  const a = format(from, "yyyy-MM-dd")
  const b = format(to, "yyyy-MM-dd")
  return (
    `((start_date >= "${a}" && start_date <= "${b}") || ` +
    `(end_date >= "${a}" && end_date <= "${b}") || ` +
    `(due_date >= "${a}" && due_date <= "${b}") || ` +
    `(start_date <= "${a}" && end_date >= "${b}"))`
  )
}

export type TaskSpan = { start: Date; end: Date }

/** Start/end of a task's bar; falls back to the due date for one-day tasks. */
export function taskSpan(task: Pick<Task, "start_date" | "end_date" | "due_date">): TaskSpan | null {
  const start = parseTaskDate(task.start_date) ?? parseTaskDate(task.end_date) ?? parseTaskDate(task.due_date)
  const end = parseTaskDate(task.end_date) ?? parseTaskDate(task.due_date) ?? start
  if (!start || !end) return null
  return start <= end ? { start: startOfDay(start), end: startOfDay(end) } : { start: startOfDay(end), end: startOfDay(start) }
}

/**
 * Bar position in day columns, clipped to the range. `clippedStart`/`clippedEnd` tell
 * whether the task continues beyond the visible window.
 */
export function barGeometry(span: TaskSpan, range: TimelineRange) {
  const last = differenceInCalendarDays(range.to, range.from)
  const rawStart = differenceInCalendarDays(span.start, range.from)
  const rawEnd = differenceInCalendarDays(span.end, range.from)
  if (rawEnd < 0 || rawStart > last) return null
  const startDay = Math.max(rawStart, 0)
  const endDay = Math.min(rawEnd, last)
  return { startDay, days: endDay - startDay + 1, clippedStart: rawStart < 0, clippedEnd: rawEnd > last }
}
