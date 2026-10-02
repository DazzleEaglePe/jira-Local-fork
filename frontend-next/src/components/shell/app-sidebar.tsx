"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, CircleUser, Filter, Orbit, Plus, Star, Tag, Users } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { buildProjectTree, isSavedFilter, projectColor, projectTitle, type ProjectNode } from "@/lib/projects"
import { useProjects } from "@/lib/queries/projects"
import { useUi } from "@/lib/ui-store"

// Atlassian "selected" nav state: blue tint, blue text and a start indicator bar.
const NAV_ITEM =
  "relative font-normal text-sidebar-foreground data-[active=true]:bg-selected data-[active=true]:font-medium data-[active=true]:text-selected-foreground data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:left-0 data-[active=true]:before:w-0.5 data-[active=true]:before:rounded-full data-[active=true]:before:bg-selected-foreground"

function ProjectSwatch({ hex }: { hex?: string }) {
  return (
    <span
      aria-hidden
      className="size-4 shrink-0 rounded-sm bg-muted-foreground/30"
      style={{ backgroundColor: projectColor(hex) }}
    />
  )
}

function ProjectItem({ project, pathname }: { project: ProjectNode; pathname: string }) {
  const href = `/projects/${project.id}`
  const isActive = pathname === href || pathname.startsWith(`${href}/`)
  const link = (
    <SidebarMenuButton asChild isActive={isActive} className={NAV_ITEM} tooltip={projectTitle(project)}>
      <Link href={href}>
        <ProjectSwatch hex={project.hex_color} />
        <span className="truncate">{projectTitle(project)}</span>
      </Link>
    </SidebarMenuButton>
  )

  if (project.children.length === 0) {
    return <SidebarMenuItem>{link}</SidebarMenuItem>
  }

  return (
    <Collapsible asChild defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        {link}
        <CollapsibleTrigger asChild>
          <SidebarMenuAction aria-label={`Subproyectos de ${projectTitle(project)}`}>
            <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mr-0 pr-0">
            {project.children.map((child) => (
              <SidebarMenuSubItem key={child.id}>
                <SidebarMenu>
                  <ProjectItem project={child} pathname={pathname} />
                </SidebarMenu>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { data: projects, isPending } = useProjects()
  const setCreateProjectOpen = useUi((state) => state.setCreateProjectOpen)

  const tree = buildProjectTree(projects ?? [])
  const favorites = (projects ?? []).filter((project) => project.is_favorite && (project.id ?? 0) > 0 && !project.is_archived)
  const savedFilters = (projects ?? []).filter(isSavedFilter)

  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" collapsible="offcanvas">
      <SidebarContent className="gap-0 pt-2">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} className={NAV_ITEM}>
                <Link href="/dashboard">
                  <CircleUser /> Para ti
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {favorites.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Star className="mr-2 size-3.5" /> Marcados como favoritos
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favorites.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={{ ...project, id: project.id as number, children: [] }}
                    pathname={pathname}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/projects"} className={NAV_ITEM}>
                <Link href="/projects">
                  <Orbit /> Proyectos
                </Link>
              </SidebarMenuButton>
              <SidebarMenuAction showOnHover aria-label="Crear proyecto" onClick={() => setCreateProjectOpen(true)}>
                <Plus />
              </SidebarMenuAction>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarGroupLabel className="mt-1">Recientes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isPending
                ? Array.from({ length: 4 }, (_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))
                : tree.map((project) => <ProjectItem key={project.id} project={project} pathname={pathname} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/labels"} className={NAV_ITEM}>
                <Link href="/labels">
                  <Tag /> Etiquetas
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/teams"} className={NAV_ITEM}>
                <Link href="/teams">
                  <Users /> Equipos
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {savedFilters.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Filter className="mr-2 size-3.5" /> Filtros
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {savedFilters.map((filter) => (
                  <SidebarMenuItem key={filter.id}>
                    <SidebarMenuButton asChild className={NAV_ITEM}>
                      <Link href={`/projects/${filter.id}`}>
                        <Filter /> <span className="truncate">{filter.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t px-4 py-3 text-xs text-muted-foreground">
        Jira-Local · Caja Ica
      </SidebarFooter>
    </Sidebar>
  )
}
