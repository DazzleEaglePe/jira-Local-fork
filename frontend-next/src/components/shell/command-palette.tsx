"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CircleUser, FolderPlus, Orbit } from "lucide-react"

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
    action()
  }

  const activeProjects = (projects ?? []).filter((project) => isRealProject(project) && !project.is_archived)

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Buscar" description="Busca proyectos y acciones">
      <CommandInput placeholder="Buscar proyectos o acciones…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        <CommandGroup heading="Ir a">
          <CommandItem onSelect={() => run(() => router.push("/dashboard"))}>
            <CircleUser /> Para ti
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/projects"))}>
            <Orbit /> Todos los proyectos
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
