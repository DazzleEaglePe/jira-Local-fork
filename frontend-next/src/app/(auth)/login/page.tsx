import { Suspense } from "react"

import { LoginForm } from "@/components/auth/login-form"

export const metadata = { title: "Iniciar sesión" }

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6">
      {/* LoginForm reads ?redirect= via useSearchParams, which needs a Suspense boundary to build */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
