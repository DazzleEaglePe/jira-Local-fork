"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlert, Eye, EyeOff } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-store"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

const loginSchema = z.object({
  username: z.string().trim().min(1, "Ingresa tu usuario o correo"),
  password: z.string().min(1, "Ingresa tu contraseña"),
  remember: z.boolean(),
})

type LoginValues = z.infer<typeof loginSchema>

/** Only allow same-app paths as post-login targets (no open redirects). */
export function safeRedirect(target: string | null): string {
  if (!target || !target.startsWith("/") || target.startsWith("//")) return "/dashboard"
  return target
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useSession((state) => state.login)
  const status = useSession((state) => state.status)
  const bootstrap = useSession((state) => state.bootstrap)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const redirectTo = safeRedirect(searchParams.get("redirect"))

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", remember: true },
  })
  const { errors, isSubmitting } = form.formState

  // Already signed in (valid token or refresh cookie): skip the form.
  useEffect(() => {
    void bootstrap()
  }, [bootstrap])
  useEffect(() => {
    if (status === "authenticated") router.replace(redirectTo)
  }, [status, router, redirectTo])

  useGSAP(() => {
    gsap.matchMedia().add(MOTION_OK, () => {
      gsap.from("[data-animate]", { y: 16, opacity: 0, duration: 0.45, stagger: 0.07, ease: "power3.out" })
    })
  }, { scope: root })

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    try {
      await login(values)
    } catch (error) {
      setServerError(getErrorMessage(error, "No se pudo iniciar sesión. Revisa tus datos."))
    }
  }

  return (
    <div ref={root} className="w-full max-w-[400px]">
      <div data-animate className="rounded-lg bg-card p-10 shadow-overlay">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
          <img src="/cajaica.svg" alt="Caja Ica" width={176} height={35} />
          <h1 className="text-base font-semibold">Inicia sesión para continuar</h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-danger-foreground"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {serverError}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="username">Usuario o correo</Label>
            <Input
              id="username"
              autoComplete="username"
              autoFocus
              aria-invalid={Boolean(errors.username)}
              {...form.register("username")}
            />
            {errors.username && <p className="text-xs text-danger-foreground">{errors.username.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pr-10"
                aria-invalid={Boolean(errors.password)}
                {...form.register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            {errors.password && <p className="text-xs text-danger-foreground">{errors.password.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="remember"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="remember"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label htmlFor="remember" className="font-normal">
              Mantener sesión iniciada
            </Label>
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            Continuar
          </Button>
        </form>
      </div>
      <p data-animate className="mt-6 text-center text-xs text-muted-foreground">
        Jira-Local · Caja Ica
      </p>
    </div>
  )
}
