import { describe, expect, it } from "vitest"

import { notificationHref, notificationText, toNotificationRows } from "./notifications"

const task = { id: 7, index: 3, identifier: "WEB-3", title: "Login" }

describe("notificationText", () => {
  it("should address the current user when they are the assignee", () => {
    const n = { name: "task.assigned", notification: { task, assignee: { id: 1, username: "ana" } } }
    expect(notificationText(n, { id: 1 })).toBe("te asignó WEB-3")
    expect(notificationText(n, { id: 2 })).toBe("asignó WEB-3 a ana")
  })

  it("should describe comments and team additions", () => {
    expect(notificationText({ name: "task.comment", notification: { task } })).toBe("comentó en WEB-3")
    const added = {
      name: "team.member.added",
      notification: { team: { id: 4, name: "TI" }, member: { id: 9, name: "Luis" } },
    }
    expect(notificationText(added, { id: 9 })).toBe("te agregó al equipo TI")
    expect(notificationText(added, { id: 1 })).toBe("agregó a Luis al equipo TI")
  })

  it("should return an empty string for unknown names", () => {
    expect(notificationText({ name: "something.else", notification: {} })).toBe("")
  })
})

describe("notificationHref", () => {
  it("should link task notifications to the task and skip invalid targets", () => {
    expect(notificationHref({ name: "task.mentioned", notification: { task } })).toBe("/tasks/7")
    expect(notificationHref({ name: "task.comment", notification: { task: { id: 0 } } })).toBeNull()
    expect(notificationHref({ name: "task.deleted", notification: { task } })).toBeNull()
  })
})

describe("toNotificationRows", () => {
  it("should dedupe by id, drop invalid rows and derive the read flag", () => {
    const rows = toNotificationRows([
      {
        id: 1,
        name: "task.comment",
        read_at: "0001-01-01T00:00:00Z",
        notification: { task, doer: { id: 5, username: "eva" } },
      },
      { id: 1, name: "task.comment", read_at: "0001-01-01T00:00:00Z", notification: { task } },
      { id: 2, name: "task.created", read_at: "2026-09-01T10:00:00Z", notification: { task } },
      { id: 0, name: "task.created" },
    ])
    expect(rows.map((row) => [row.id, row.read])).toEqual([
      [1, false],
      [2, true],
    ])
  })

  it("should expose the doer name", () => {
    const [row] = toNotificationRows([
      { id: 3, name: "task.comment", notification: { task, doer: { id: 5, username: "eva" } } },
    ])
    expect(row.doerName).toBe("eva")
  })
})
