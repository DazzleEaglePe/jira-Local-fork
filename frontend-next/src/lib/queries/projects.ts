"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { projectsCreate, projectsList, projectsRead } from "@/lib/api/generated/sdk.gen"
import type { Project, ProjectWritable } from "@/lib/api/generated/types.gen"

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: number) => ["projects", id] as const,
}

/** All projects the user can see (archived included; filtered in the UI). */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async (): Promise<Project[]> => {
      const { data } = await projectsList({ query: { is_archived: true, page: 1, per_page: 1000 } })
      return data.items ?? []
    },
  })
}

export function useProject(projectId: number) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: async () => {
      const { data } = await projectsRead({ path: { id: projectId } })
      return data
    },
    enabled: projectId > 0,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (project: ProjectWritable): Promise<Project> => {
      const { data } = await projectsCreate({ body: project })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}
