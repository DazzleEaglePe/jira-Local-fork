import { format, isBefore, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"

import type { Task } from "@/lib/api/generated/types.gen"

export const PRIORITIES = {
  UNSET: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
  DO_NOW: 5,
} as const

export const PRIORITY_LABELS: Record<number, string> = {
  [PRIORITIES.LOW]: "Baja",
  [PRIORITIES.MEDIUM]: "Media",
  [PRIORITIES.HIGH]: "Alta",
  [PRIORITIES.URGENT]: "Urgente",
  [PRIORITIES.DO_NOW]: "¡Hacer ahora!",
}

/** Same rule as the Vue app: project identifier ("CI-12") or "#index". */
export function getTaskIdentifier(task: Pick<Task, "identifier" | "index">): string {
  return task.identifier && task.identifier !== `-${task.index}` ? task.identifier : `#${task.index ?? 0}`
}

/**
 * Vikunja sends "0001-01-01T00:00:00Z" for empty dates; treat anything before
 * year 1970 as unset.
 */
export function parseTaskDate(value?: string | null): Date | null {
  if (!value) return null
  const date = parseISO(value)
  if (!isValid(date) || date.getFullYear() < 1970) return null
  return date
}

export function formatTaskDate(value?: string | null): string | null {
  const date = parseTaskDate(value)
  return date ? format(date, "d MMM yyyy", { locale: es }) : null
}

export function isTaskOverdue(task: Pick<Task, "done" | "due_date">, now = new Date()): boolean {
  const due = parseTaskDate(task.due_date)
  return !task.done && due !== null && isBefore(due, now)
}
