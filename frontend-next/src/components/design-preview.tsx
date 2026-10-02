"use client"

import { useRef } from "react"
import { ChevronsUp, Equal, Plus, SquareCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

// Sprint 1 showcase: design tokens + shadcn components + GSAP entrance.
export function DesignPreview() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.matchMedia().add(MOTION_OK, () => {
      gsap.from("[data-animate]", { y: 12, opacity: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" })
    })
  }, { scope: root })

  return (
    <main ref={root} className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header data-animate className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
        <img src="/cajaica.svg" alt="Caja Ica" width={160} height={32} />
        <Button>
          <Plus /> Crear
        </Button>
      </header>
      <h1 data-animate className="text-2xl font-semibold">Fundaciones listas</h1>
      <section data-animate className="rounded-lg bg-muted p-2">
        <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">Por hacer 1</p>
        <article className="rounded-md bg-card p-3 shadow-raised">
          <p>Migrar el frontend a Next.js</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">FRONTEND</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <SquareCheck className="size-4 text-information" /> JL-1
            </span>
            <span className="flex items-center gap-1">
              <ChevronsUp className="size-4 text-destructive" />
              <Equal className="size-4 text-warning" />
            </span>
          </div>
        </article>
      </section>
    </main>
  )
}
