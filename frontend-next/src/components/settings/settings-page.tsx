"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api/client"
import { userChangePassword, userUpdateSettings } from "@/lib/api/generated/sdk.gen"
import type { UserInfoBody } from "@/lib/api/generated/types.gen"
import { useSession } from "@/lib/auth/session-store"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { isRealProject, projectTitle } from "@/lib/projects"
import { useProjects } from "@/lib/queries/projects"
import { passwordSchema, settingsBody, type PasswordValues } from "@/lib/user-settings"

const WEEK_DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

const profileSchema = z.object({
  name: z.string().trim().max(250, "Máximo 250 caracteres"),
  default_project_id: z.number(),
  week_start: z.number().int().min(0).max(6),
})
type ProfileValues = z.infer<typeof profileSchema>

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-danger-foreground">{message}</p> : null
}

function ProfileCard({ user }: { user: UserInfoBody }) {
  const refreshUser = useSession((state) => state.refreshUser)
  const projects = useProjects()
  const options = (projects.data ?? []).filter((project) => isRealProject(project) && !project.is_archived)
  const settings = user.settings

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: settings?.name ?? user.name ?? "",
      default_project_id: settings?.default_project_id ?? 0,
      week_start: settings?.week_start ?? 1,
    },
  })
  const save = useMutation({
    mutationFn: (values: ProfileValues) => userUpdateSettings({ body: settingsBody(settings, values) }),
    onSuccess: async () => {
      await refreshUser()
      toast.success("Ajustes guardados")
    },
    onError: (error) => toast.error(getErrorMessage(error, "No se pudieron guardar los ajustes")),
  })
  const { errors, isDirty } = form.formState

  return (
    <Card>
      <form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="flex flex-col gap-6">
        <CardHeader>
          <CardTitle>Perfil y preferencias</CardTitle>
          <CardDescription>Así te verán tus compañeros en tareas, comentarios y equipos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="settings-name">Nombre visible</Label>
            <Input id="settings-name" placeholder={user.username} {...form.register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="grid gap-1.5">
            <Label>Usuario</Label>
            <Input value={user.username ?? ""} disabled />
          </div>
          <div className="grid gap-1.5">
            <Label>Correo</Label>
            <Input value={user.email ?? ""} disabled />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="settings-project">Proyecto predeterminado</Label>
            <Controller
              control={form.control}
              name="default_project_id"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                  <SelectTrigger id="settings-project" className="w-full">
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ninguno</SelectItem>
                    {options.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {projectTitle(project)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="settings-week">La semana empieza el</Label>
            <Controller
              control={form.control}
              name="week_start"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                  <SelectTrigger id="settings-week" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEK_DAYS.map((day, index) => (
                      <SelectItem key={day} value={String(index)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="ghost" disabled={!isDirty} onClick={() => form.reset()}>
            Descartar
          </Button>
          <Button type="submit" disabled={!isDirty || save.isPending}>
            Guardar
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function PasswordCard() {
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { old_password: "", new_password: "", confirm: "" },
  })
  const change = useMutation({
    mutationFn: ({ old_password, new_password }: PasswordValues) =>
      userChangePassword({ body: { old_password, new_password } }),
    onSuccess: () => {
      form.reset()
      toast.success("Contraseña actualizada")
    },
    onError: (error) => toast.error(getErrorMessage(error, "No se pudo cambiar la contraseña")),
  })
  const { errors } = form.formState

  return (
    <Card>
      <form onSubmit={form.handleSubmit((values) => change.mutate(values))} className="flex flex-col gap-6">
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
          <CardDescription>Usa entre 8 y 72 caracteres.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="old-password">Contraseña actual</Label>
            <Input id="old-password" type="password" autoComplete="current-password" {...form.register("old_password")} />
            <FieldError message={errors.old_password?.message} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <Input id="new-password" type="password" autoComplete="new-password" {...form.register("new_password")} />
            <FieldError message={errors.new_password?.message} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" {...form.register("confirm")} />
            <FieldError message={errors.confirm?.message} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={change.isPending}>
            Cambiar contraseña
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export function SettingsPage() {
  useDocumentTitle("Ajustes")
  const user = useSession((state) => state.user)

  return (
    <div className="flex flex-col pb-10">
      <PageHeader title="Ajustes personales">
        <p className="text-muted-foreground">Gestiona tu perfil, preferencias y contraseña.</p>
      </PageHeader>
      <div className="flex max-w-3xl flex-col gap-6 px-6">
        {user ? (
          <>
            <ProfileCard user={user} />
            {user.is_local_user ? (
              <PasswordCard />
            ) : (
              <p className="text-sm text-muted-foreground">
                Tu cuenta se gestiona con un proveedor externo; cambia la contraseña allí.
              </p>
            )}
          </>
        ) : (
          <Skeleton className="h-64" />
        )}
      </div>
    </div>
  )
}
