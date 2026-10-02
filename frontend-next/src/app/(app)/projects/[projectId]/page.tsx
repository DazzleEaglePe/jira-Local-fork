"use client"

import { useParams } from "next/navigation"

import { PageHeader } from "@/components/shell/page-header"
import { projectColor, projectTitle } from "@/lib/projects"
import { useProject } from "@/lib/queries/projects"

// Sprint 3 placeholder: the board/list views replace this in sprint 4.
export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data: project } = useProject(Number(projectId))

  return (
    <PageHeader
      crumbs={[{ label: "Proyectos", href: "/projects" }]}
      title={project ? projectTitle(project) : "Cargando…"}
      leading={
        <span
          aria-hidden
          className="size-6 rounded-md bg-muted-foreground/30"
          style={{ backgroundColor: projectColor(project?.hex_color) }}
        />
      }
    />
  )
}
