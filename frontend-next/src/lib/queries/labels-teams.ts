"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  labelsDelete,
  labelsUpdate,
  teamsCreate,
  teamsDelete,
  teamsList,
  teamsMembersAdd,
  teamsMembersRemove,
  teamsRead,
  usersSearch,
} from "@/lib/api/generated/sdk.gen"
import type { Label, Team, User } from "@/lib/api/generated/types.gen"
import { boardKeys } from "./board"
import { labelKeys } from "./task-detail"

export function useUpdateLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; title: string; hex_color: string; description?: string }) => {
      const { data } = await labelsUpdate({ path: { id }, body })
      return data as Label
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: labelKeys.all }),
        queryClient.invalidateQueries({ queryKey: boardKeys.all }), // lozenges on cards
      ]),
  })
}

export function useDeleteLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await labelsDelete({ path: { id } })
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: labelKeys.all }),
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
      ]),
  })
}

export const teamKeys = {
  all: ["teams"] as const,
  detail: (id: number) => ["teams", id] as const,
}

export function useTeams() {
  return useQuery({
    queryKey: teamKeys.all,
    queryFn: async () => {
      const { data } = await teamsList({ query: { page: 1, per_page: 200 } })
      return (data.items ?? []) as Team[]
    },
  })
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: async () => {
      const { data } = await teamsRead({ path: { id } })
      return data as Team
    },
    enabled: id > 0,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; description?: string }) => {
      const { data } = await teamsCreate({ body })
      return data as Team
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await teamsDelete({ path: { id } })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useUserSearch(query: string) {
  const q = query.trim()
  return useQuery({
    queryKey: ["users", "search", q],
    queryFn: async () => {
      const { data } = await usersSearch({ query: { q } })
      return (data.items ?? []) as User[]
    },
    enabled: q.length >= 2,
  })
}

export function useTeamMember(teamId: number) {
  const queryClient = useQueryClient()
  const settle = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) }),
      queryClient.invalidateQueries({ queryKey: teamKeys.all }),
    ])
  const add = useMutation({
    mutationFn: async (username: string) => {
      await teamsMembersAdd({ path: { team: teamId }, body: { username } })
    },
    onSettled: settle,
  })
  const remove = useMutation({
    mutationFn: async (username: string) => {
      await teamsMembersRemove({ path: { team: teamId, user: username } })
    },
    onSettled: settle,
  })
  return { add, remove }
}
