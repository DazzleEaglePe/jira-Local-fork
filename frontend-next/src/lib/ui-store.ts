"use client"

import { create } from "zustand"

/** Global overlays that can be opened from several places (nav, sidebar, shortcuts). */
type UiState = {
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
  createProjectOpen: boolean
  setCreateProjectOpen: (open: boolean) => void
}

export const useUi = create<UiState>((set) => ({
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  createProjectOpen: false,
  setCreateProjectOpen: (createProjectOpen) => set({ createProjectOpen }),
}))
