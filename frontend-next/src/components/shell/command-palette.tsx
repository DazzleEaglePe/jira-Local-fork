"use client"

import { useDeferredValue, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CircleUser, FolderPlus, Orbit, Tag, Users } from "lucide-react"

import { TaskKey } from "@/components/task/task-key"
import { useTaskSearch } from "@/lib/queries/tasks"
import { getTaskIdentifier } from "@/lib/tasks"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { isRealProject, projectColor, projectTitle } from "@/lib/projects"
import { useProjects } from "@/lib/queries/projects"
import { useUi } from "@/lib/ui-store"

/** Ctrl/Cmd + K palette: jump to pages and projects, run quick actions. */
export function CommandPalette() {
  const router = useRouter()
  const open = useUi((state) => state.commandOpen)
  const setOpen = useUi((state) => state.setCommandOpen)
  const setCreateProjectOpen = useUi((state) => state.setCreateProjectOpen)
  const { data: projects } = useProjects()
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const tasks = useTaskSearch(open ? deferredSearch : "")

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(!useUi.getState().commandOpen)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [setOpen])

  function run(action: () => void) {
    setOpen(false)
    setSearch("")
    action()
  }

  const activeProjects = (projects ?? []).filter((project) => isRealProject(project) && !project.is_archived)

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Buscar" description="Busca proyectos y acciones">
      <CommandInput placeholder="Buscar tareas, proyectos o acciones…" value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>{tasks.isFetching ? "Buscando…" : "Sin resultados."}</CommandEmpty>
        {(tasks.data?.length ?? 0) > 0 && (
          <CommandGroup heading="Tareas">
            {tasks.data!.map((task) => (
              <CommandItem
                key={task.id}
                // include the query so cmdk's local filter keeps server matches
                value={`${deferredSearch} ${getTaskIdentifier(task)} ${task.title} task-${task.id}`}
                onSelect={() => run(() => router.push(`/tasks/${task.id}`))}
              >
                <TaskKey task={task} className="w-14 shrink-0" />
                <span className="truncate">{task.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Ir a">
          <CommandItem onSelect={() => run(() => router.push("/dashboard"))}>
            <CircleUser /> Para ti
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/projects"))}>
            <Orbit /> Todos los proyectos
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/labels"))}>
            <Tag /> Etiquetas
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/teams"))}>
            <Users /> Equipos
          </CommandItem>
        </CommandGroup>
        {activeProjects.length > 0 && (
          <CommandGroup heading="Proyectos">
            {activeProjects.map((project) => (
              <CommandItem
                key={project.id}
                value={`${projectTitle(project)} ${project.identifier ?? ""} ${project.id}`}
                onSelect={() => run(() => router.push(`/projects/${project.id}`))}
              >
                <span
                  aria-hidden
                  className="size-3.5 rounded-sm bg-muted-foreground/30"
                  style={{ backgroundColor: projectColor(project.hex_color) }}
                />
                {projectTitle(project)}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="Acciones">
          <CommandItem onSelect={() => run(() => setCreateProjectOpen(true))}>
            <FolderPlus /> Crear proyecto
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
