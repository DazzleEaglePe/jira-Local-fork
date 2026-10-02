"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"

// Register once; components import gsap/useGSAP from here.
gsap.registerPlugin(useGSAP)

/** Media query used to skip animations for users who ask for less motion. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)"

export { gsap, useGSAP }
