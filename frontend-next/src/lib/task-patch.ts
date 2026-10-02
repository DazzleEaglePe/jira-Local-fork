import type { JsonPatchOp, TaskWritable } from "@/lib/api/generated/types.gen"

/** Vikunja's "no date" value (same as the Vue app's API_ZERO_DATE). */
export const API_ZERO_DATE = "0001-01-01T00:00:00Z"

export type TaskChanges = Pick<
  TaskWritable,
  "title" | "description" | "done" | "due_date" | "start_date" | "end_date" | "priority" | "percent_done" | "is_favorite" | "hex_color"
>

/**
 * JSON Patch ops for a partial task update (PATCH /tasks/:id), mirroring the Vue
 * app's taskWriteBody: only provided fields, trimmed title, "" dates → zero date.
 */
export function taskPatchOps(changes: TaskChanges): JsonPatchOp[] {
  const ops: JsonPatchOp[] = []
  for (const [field, raw] of Object.entries(changes)) {
    if (raw === undefined) continue
    let value: unknown = raw
    if (field === "title" && typeof raw === "string") value = raw.trim()
    if ((field === "due_date" || field === "start_date" || field === "end_date") && (raw === "" || raw === null)) {
      value = API_ZERO_DATE
    }
    if (field === "hex_color" && typeof raw === "string") value = raw.replace(/^#/, "")
    ops.push({ op: "add", path: `/${field}`, value })
  }
  return ops
}
