"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/api/client"
import { useCreateProject } from "@/lib/queries/projects"
import { useUi } from "@/lib/ui-store"
import { cn } from "@/lib/utils"

// Atlassian accent palette (bold backgrounds) + Caja Ica red
export const PROJECT_COLORS = ["e30613", "1868db", "5b7f24", "964ac0", "fbc828", "c9372c", "2898bd", "6b6e76"]

const schema = z.object({
  title: z.string().trim().min(1, "El proyecto necesita un nombre").max(250, "Máximo 250 caracteres"),
  color: z.string(),
})

type Values = z.infer<typeof schema>

export function CreateProjectDialog() {
  const router = useRouter()
  const open = useUi((state) => state.createProjectOpen)
  const setOpen = useUi((state) => state.setCreateProjectOpen)
  const createProject = useCreateProject()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: "", color: PROJECT_COLORS[1] } })
  const { errors } = form.formState

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) form.reset()
  }

  async function onSubmit(values: Values) {
    try {
      const project = await createProject.mutateAsync({ title: values.title, hex_color: values.color })
      toast.success(`Proyecto "${project.title}" creado`)
      onOpenChange(false)
      if (project.id) router.push(`/projects/${project.id}`)
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear el proyecto"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Crear proyecto</DialogTitle>
            <DialogDescription>Los campos marcados con * son obligatorios.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="project-title">Nombre *</Label>
            <Input id="project-title" autoFocus aria-invalid={Boolean(errors.title)} {...form.register("title")} />
            {errors.title && <p className="text-xs text-danger-foreground">{errors.title.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label id="project-color-label">Color</Label>
            <Controller
              name="color"
              control={form.control}
              render={({ field }) => (
                <div role="radiogroup" aria-labelledby="project-color-label" className="flex flex-wrap gap-2">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={field.value === color}
                      aria-label={`#${color}`}
                      onClick={() => field.onChange(color)}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-md text-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring",
                        field.value === color && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: `#${color}` }}
                    >
                      {field.value === color && <Check className="size-4" />}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending && <Spinner />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
