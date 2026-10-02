"use client"

import { useDeferredValue, useState } from "react"
import { Plus, Trash2, UserMinus, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shell/page-header"
import { initials } from "@/components/shell/user-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import type { Team } from "@/lib/api/generated/types.gen"
import { getErrorMessage } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-store"
import { useCreateTeam, useDeleteTeam, useTeam, useTeamMember, useTeams, useUserSearch } from "@/lib/queries/labels-teams"

function CreateTeamDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const create = useCreateTeam()

  async function submit() {
    if (!name.trim()) return
    try {
      await create.mutateAsync({ name: name.trim(), description })
      toast.success("Equipo creado")
      setName("")
      setDescription("")
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear el equipo"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>Crear equipo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="team-name">Nombre *</Label>
            <Input id="team-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="team-description">Descripción</Label>
            <Input id="team-description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TeamSheet({ teamId, onClose }: { teamId: number | null; onClose: () => void }) {
  const me = useSession((state) => state.user)
  const team = useTeam(teamId ?? 0)
  const { add, remove } = useTeamMember(teamId ?? 0)
  const deleteTeam = useDeleteTeam()
  const [query, setQuery] = useState("")
  const users = useUserSearch(useDeferredValue(query))
  const members = team.data?.members ?? []
  const iAmAdmin = members.some((member) => member.id === me?.id && member.admin)

  const run = (promise: Promise<unknown>, ok: string) =>
    promise.then(() => toast.success(ok)).catch((error) => toast.error(getErrorMessage(error)))

  return (
    <Sheet open={teamId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{team.data?.name ?? "Equipo"}</SheetTitle>
          <SheetDescription>{team.data?.description || `${members.length} miembros`}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
          {iAmAdmin && (
            <Command shouldFilter={false} className="rounded-md border">
              <CommandInput placeholder="Agregar persona (usuario o correo)" value={query} onValueChange={setQuery} />
              {query.trim().length >= 2 && (
                <CommandList>
                  <CommandEmpty>Sin resultados.</CommandEmpty>
                  <CommandGroup>
                    {(users.data ?? [])
                      .filter((user) => !members.some((member) => member.id === user.id))
                      .map((user) => (
                        <CommandItem
                          key={user.id}
                          value={String(user.id)}
                          onSelect={() => {
                            setQuery("")
                            void run(add.mutateAsync(user.username as string), `${user.username} agregado`)
                          }}
                        >
                          <UserPlus /> {user.name || user.username}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              )}
            </Command>
          )}

          <ul className="flex flex-col gap-2">
            {members.map((member) => {
              const name = member.name || member.username || "?"
              return (
                <li key={member.id} className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-discovery text-[11px] font-semibold text-white">{initials(name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  {member.admin && <Badge variant="secondary">Admin</Badge>}
                  {iAmAdmin && member.id !== me?.id && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Quitar a ${name}`}
                      onClick={() => void run(remove.mutateAsync(member.username as string), `${name} quitado`)}
                    >
                      <UserMinus />
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>

          {iAmAdmin && (
            <Button
              variant="outline"
              className="mt-4 text-danger-foreground"
              onClick={() =>
                void run(deleteTeam.mutateAsync(teamId as number), "Equipo eliminado").then(onClose)
              }
            >
              <Trash2 /> Eliminar equipo
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function TeamCard({ team, onOpen }: { team: Team; onOpen: () => void }) {
  const members = team.members ?? []
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-left shadow-raised transition-colors hover:bg-accent"
    >
      <span className="font-semibold">{team.name}</span>
      {team.description && <span className="line-clamp-2 text-sm text-muted-foreground">{team.description}</span>}
      <span className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex -space-x-1.5">
          {members.slice(0, 4).map((member) => (
            <Avatar key={member.id} className="size-6 border-2 border-card">
              <AvatarFallback className="bg-discovery text-[10px] font-semibold text-white">
                {initials(member.name || member.username || "?")}
              </AvatarFallback>
            </Avatar>
          ))}
        </span>
        {members.length} {members.length === 1 ? "miembro" : "miembros"}
      </span>
    </button>
  )
}

export function TeamsPage() {
  const teams = useTeams()
  const [creating, setCreating] = useState(false)
  const [openTeam, setOpenTeam] = useState<number | null>(null)

  return (
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Equipos"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Crear equipo
          </Button>
        }
      >
        <p className="text-muted-foreground">Agrupa personas para compartir proyectos.</p>
      </PageHeader>
      <div className="px-6">
        {teams.isPending ? (
          <Skeleton className="h-32" />
        ) : (teams.data?.length ?? 0) === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>Todavía no perteneces a ningún equipo</EmptyTitle>
              <EmptyDescription>Crea uno para compartir proyectos con tu área.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.data!.map((team) => (
              <TeamCard key={team.id} team={team} onOpen={() => setOpenTeam(team.id ?? null)} />
            ))}
          </div>
        )}
      </div>
      <CreateTeamDialog open={creating} onOpenChange={setCreating} />
      <TeamSheet teamId={openTeam} onClose={() => setOpenTeam(null)} />
    </div>
  )
}
