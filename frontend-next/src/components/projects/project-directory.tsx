"use client"

import { useDeferredValue, useState } from "react"
import Link from "next/link"
import { Plus, Search, Star } from "lucide-react"

import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { Project } from "@/lib/api/generated/types.gen"
import { getProjectAncestors, isRealProject, projectColor, projectTitle } from "@/lib/projects"
import { useProjects } from "@/lib/queries/projects"
import { useUi } from "@/lib/ui-store"

export function filterProjects(projects: readonly Project[], query: string): Project[] {
  const needle = query.trim().toLowerCase()
  return projects
    .filter(isRealProject)
    .filter((project) => !needle || `${projectTitle(project)} ${project.identifier ?? ""}`.toLowerCase().includes(needle))
    .sort((a, b) => Number(a.is_archived) - Number(b.is_archived) || projectTitle(a).localeCompare(projectTitle(b), "es"))
}

export function ProjectDirectory() {
  const { data: projects, isPending } = useProjects()
  const setCreateProjectOpen = useUi((state) => state.setCreateProjectOpen)
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const rows = filterProjects(projects ?? [], deferredQuery)

  return (
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Proyectos"
        actions={
          <Button onClick={() => setCreateProjectOpen(true)}>
            <Plus /> Crear proyecto
          </Button>
        }
      />
      <div className="px-6">
        <div className="relative mb-4 w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar proyectos"
            aria-label="Buscar proyectos"
            className="pl-8"
          />
        </div>

        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-left">
            <thead className="border-b bg-muted text-xs font-semibold text-subtle-foreground">
              <tr>
                <th scope="col" className="w-10 px-3 py-2">
                  <span className="sr-only">Favorito</span>
                </th>
                <th scope="col" className="px-3 py-2">Nombre</th>
                <th scope="col" className="px-3 py-2">Clave</th>
                <th scope="col" className="px-3 py-2">Ubicación</th>
                <th scope="col" className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {isPending
                ? Array.from({ length: 4 }, (_, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td colSpan={5} className="px-3 py-2">
                        <Skeleton className="h-6" />
                      </td>
                    </tr>
                  ))
                : rows.map((project) => {
                    const ancestors = getProjectAncestors(projects ?? [], project.id as number)
                    return (
                      <tr key={project.id} className="border-b transition-colors last:border-0 hover:bg-accent">
                        <td className="px-3 py-2">
                          {project.is_favorite && (
                            <Star className="size-4 fill-warning text-warning" aria-label="Favorito" />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Link href={`/projects/${project.id}`} className="flex items-center gap-2 font-medium hover:underline">
                            <span
                              aria-hidden
                              className="size-5 rounded-sm bg-muted-foreground/30"
                              style={{ backgroundColor: projectColor(project.hex_color) }}
                            />
                            {projectTitle(project)}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{project.identifier || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {ancestors.length ? ancestors.map(projectTitle).join(" / ") : "Raíz"}
                        </td>
                        <td className="px-3 py-2">
                          {project.is_archived ? <Badge variant="secondary">Archivado</Badge> : <Badge variant="outline">Activo</Badge>}
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
          {!isPending && rows.length === 0 && (
            <p className="px-3 py-6 text-center text-muted-foreground">No hay proyectos que coincidan con “{query}”.</p>
          )}
        </div>
      </div>
    </div>
  )
}
