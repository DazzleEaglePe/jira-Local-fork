import type { DatabaseNotification, Project, Task, Team, User } from "@/lib/api/generated/types.gen"
import { getTaskIdentifier, parseTaskDate } from "@/lib/tasks"

export const NOTIFICATION_NAMES = {
  TASK_COMMENT: "task.comment",
  TASK_ASSIGNED: "task.assigned",
  TASK_DELETED: "task.deleted",
  TASK_CREATED: "task.created",
  TASK_REMINDER: "task.reminder",
  PROJECT_CREATED: "project.created",
  TEAM_MEMBER_ADDED: "team.member.added",
  TASK_MENTIONED: "task.mentioned",
} as const

export type NotificationRow = {
  id: number
  created?: string
  doer?: User
  doerName: string
  text: string
  href: string | null
  read: boolean
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

const displayName = (user?: Pick<User, "name" | "username">) => user?.name || user?.username || ""

const positiveId = (value: unknown) => (typeof value === "number" && value > 0 ? value : null)

/** Spanish text for a notification, mirroring the Vue `notificationText` helper. */
export function notificationText(n: DatabaseNotification, me: Pick<User, "id"> | null = null): string {
  const payload = record(n.notification)
  const task = record(payload.task) as Task
  const project = record(payload.project) as Project
  const assignee = record(payload.assignee) as User
  const member = record(payload.member) as User
  const team = record(payload.team) as Team
  const key = getTaskIdentifier(task)

  switch (n.name) {
    case NOTIFICATION_NAMES.TASK_COMMENT:
      return `comentó en ${key}`
    case NOTIFICATION_NAMES.TASK_ASSIGNED:
      return me?.id === assignee.id ? `te asignó ${key}` : `asignó ${key} a ${displayName(assignee)}`
    case NOTIFICATION_NAMES.TASK_DELETED:
      return `eliminó ${key}`
    case NOTIFICATION_NAMES.TASK_CREATED:
      return `creó ${key}`
    case NOTIFICATION_NAMES.PROJECT_CREATED:
      return `creó el proyecto ${project.title ?? ""}`.trim()
    case NOTIFICATION_NAMES.TEAM_MEMBER_ADDED:
      return me?.id === member.id
        ? `te agregó al equipo ${team.name ?? ""}`.trim()
        : `agregó a ${displayName(member)} al equipo ${team.name ?? ""}`.trim()
    case NOTIFICATION_NAMES.TASK_REMINDER:
      return `Recordatorio: ${key} ${task.title ?? ""} (${project.title ?? ""})`
    case NOTIFICATION_NAMES.TASK_MENTIONED:
      return `te mencionó en ${key}`
  }
  return ""
}

export function notificationHref(n: DatabaseNotification): string | null {
  const payload = record(n.notification)
  const taskNames: string[] = [
    NOTIFICATION_NAMES.TASK_COMMENT,
    NOTIFICATION_NAMES.TASK_ASSIGNED,
    NOTIFICATION_NAMES.TASK_REMINDER,
    NOTIFICATION_NAMES.TASK_MENTIONED,
    NOTIFICATION_NAMES.TASK_CREATED,
  ]
  if (taskNames.includes(n.name ?? "")) {
    const id = positiveId(record(payload.task).id)
    return id ? `/tasks/${id}` : null
  }
  if (n.name === NOTIFICATION_NAMES.PROJECT_CREATED) {
    const id = positiveId(record(payload.project).id)
    return id ? `/projects/${id}` : null
  }
  if (n.name === NOTIFICATION_NAMES.TEAM_MEMBER_ADDED) {
    return positiveId(record(payload.team).id) ? "/teams" : null
  }
  return null
}

/** Rows ready to render; drops unusable entries and the duplicates that shifting pages produce. */
export function toNotificationRows(items: DatabaseNotification[], me: Pick<User, "id"> | null = null): NotificationRow[] {
  const unique = [...new Map(items.map((n) => [n.id, n] as const)).values()]
  return unique.flatMap((n) => {
    if (!n.name || !n.id) return []
    const doerRecord = record(record(n.notification).doer)
    const doer = typeof doerRecord.id === "number" ? (doerRecord as User) : undefined
    return [
      {
        id: n.id,
        created: n.created,
        doer,
        doerName: displayName(doer),
        text: notificationText(n, me),
        href: notificationHref(n),
        read: parseTaskDate(n.read_at) !== null,
      },
    ]
  })
}
