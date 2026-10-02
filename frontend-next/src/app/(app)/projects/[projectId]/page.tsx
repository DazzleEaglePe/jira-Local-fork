"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"
import { useProject } from "@/lib/queries/projects"
import { defaultView } from "@/lib/views"

/** /projects/:id opens the project's board (or its first view), like Jira. */
export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const { data: project, isError } = useProject(Number(projectId))
  const view = defaultView(project?.views)

  useEffect(() => {
    if (view?.id) router.replace(`/projects/${projectId}/views/${view.id}`)
  }, [view?.id, projectId, router])

  if (isError) {
    return <p className="p-6 text-danger-foreground">No se encontró el proyecto o no tienes acceso.</p>
  }

  return (
    <div className="flex flex-1 items-center justify-center p-10 text-muted-foreground">
      <Spinner className="size-6" />
      <span className="sr-only">Abriendo proyecto…</span>
    </div>
  )
}
