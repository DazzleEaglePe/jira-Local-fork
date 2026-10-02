import type { ProjectView } from "@/lib/api/generated/types.gen"

export type ViewKind = NonNullable<ProjectView["view_kind"]>

export const VIEW_LABELS: Record<ViewKind, string> = {
  list: "Lista",
  gantt: "Cronograma",
  table: "Tabla",
  kanban: "Tablero",
}

/** Views sorted by position; Vikunja's default English titles are translated. */
export function sortedViews(views?: ProjectView[] | null): ProjectView[] {
  return [...(views ?? [])].filter((view) => typeof view.id === "number").sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
}

export function viewLabel(view: ProjectView): string {
  const defaults: Record<string, ViewKind> = { List: "list", Gantt: "gantt", Table: "table", Kanban: "kanban" }
  const kind = view.title ? defaults[view.title] : undefined
  return kind ? VIEW_LABELS[kind] : view.title || (view.view_kind ? VIEW_LABELS[view.view_kind] : "Vista")
}

/** Jira opens a project on its board: prefer the kanban view, else the first one. */
export function defaultView(views?: ProjectView[] | null): ProjectView | undefined {
  const sorted = sortedViews(views)
  return sorted.find((view) => view.view_kind === "kanban") ?? sorted[0]
}
