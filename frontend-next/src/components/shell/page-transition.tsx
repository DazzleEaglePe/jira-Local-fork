"use client"

import { useRef } from "react"
import { usePathname } from "next/navigation"

import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"

/** Subtle fade/slide-in of the page content on every route change. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.fromTo(ref.current, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" })
      })
    },
    { dependencies: [pathname], scope: ref }
  )

  return (
    <div ref={ref} className="flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  )
}
