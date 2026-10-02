import type { Project } from "@/lib/api/generated/types.gen"

export type ProjectNode = Project & { id: number; children: ProjectNode[] }

/** Vikunja returns pseudo projects with negative ids: -1 = Favorites, < -1 = saved filters. */
export const FAVORITES_PROJECT_ID = -1

export function isRealProject(project: Project): project is Project & { id: number } {
  return typeof project.id === "number" && project.id > 0
}

export function isSavedFilter(project: Project): boolean {
  return typeof project.id === "number" && project.id < FAVORITES_PROJECT_ID
}

const byPosition = (a: Project, b: Project) => (a.position ?? 0) - (b.position ?? 0)

/**
 * Builds the sidebar tree: real, non-archived projects nested under their parent.
 * Projects whose parent isn't visible (archived or not shared) become roots.
 */
export function buildProjectTree(projects: readonly Project[]): ProjectNode[] {
  const visible = projects.filter((project) => isRealProject(project) && !project.is_archived)
  const nodes = new Map<number, ProjectNode>()
  for (const project of visible) {
    nodes.set(project.id as number, { ...project, id: project.id as number, children: [] })
  }

  const roots: ProjectNode[] = []
  for (const node of [...nodes.values()].sort(byPosition)) {
    const parent = node.parent_project_id ? nodes.get(node.parent_project_id) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

/** Ancestors of a project, root first (excluding the project itself). */
export function getProjectAncestors(projects: readonly Project[], projectId: number): Project[] {
  const byId = new Map(projects.filter(isRealProject).map((project) => [project.id, project]))
  const ancestors: Project[] = []
  let current = byId.get(projectId)
  const seen = new Set<number>([projectId])
  while (current?.parent_project_id && !seen.has(current.parent_project_id)) {
    seen.add(current.parent_project_id)
    current = byId.get(current.parent_project_id)
    if (current) ancestors.unshift(current)
  }
  return ancestors
}

/** "#rrggbb" from Vikunja's hex_color ("" | "rrggbb" | "#rrggbb"). */
export function projectColor(hex?: string): string | undefined {
  if (!hex || hex === "#") return undefined
  return hex.startsWith("#") ? hex : `#${hex}`
}

/** The inbox is called "Inbox" by the backend; show it in Spanish. */
export function projectTitle(project: Pick<Project, "id" | "title">): string {
  if (project.id === FAVORITES_PROJECT_ID) return "Favoritos"
  if (project.title === "Inbox") return "Bandeja de entrada"
  return project.title ?? ""
}
