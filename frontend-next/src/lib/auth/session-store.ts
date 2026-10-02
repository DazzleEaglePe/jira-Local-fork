"use client"

import { create } from "zustand"

import { configureApiClient, refreshSession } from "@/lib/api/client"
import { authLogin, authLogout, userShow } from "@/lib/api/generated/sdk.gen"
import type { UserInfoBody } from "@/lib/api/generated/types.gen"
import { clearToken, getToken, isTokenExpired, writeToken } from "./token"

export type SessionStatus = "checking" | "authenticated" | "anonymous"

export type LoginInput = {
  username: string
  password: string
  /** "Mantener sesión iniciada": long-lived token */
  remember: boolean
}

type SessionState = {
  status: SessionStatus
  user: UserInfoBody | null
  /** Restores the session from storage (or the refresh cookie) on app load. */
  bootstrap: () => Promise<void>
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  /** Re-reads the account after the user changed their own settings. */
  refreshUser: () => Promise<void>
  /** Called when the API reports the session can't be recovered. */
  expire: () => void
}

// Same flag as the Vue app: after an explicit logout, don't silently restore the
// session from the refresh cookie (the backend may still accept it).
export const JUST_LOGGED_OUT_KEY = "justLoggedOut"

function justLoggedOut(): boolean {
  try {
    return sessionStorage.getItem(JUST_LOGGED_OUT_KEY) !== null
  } catch {
    return false
  }
}

function setJustLoggedOut(value: boolean) {
  try {
    if (value) sessionStorage.setItem(JUST_LOGGED_OUT_KEY, "true")
    else sessionStorage.removeItem(JUST_LOGGED_OUT_KEY)
  } catch {
    // ignore
  }
}

async function loadUser(): Promise<UserInfoBody> {
  const { data } = await userShow()
  return data
}

export const useSession = create<SessionState>((set, get) => ({
  status: "checking",
  user: null,

  bootstrap: async () => {
    configureApiClient()
    if (get().status === "authenticated") return

    let token = getToken()
    if (isTokenExpired(token)) {
      token = justLoggedOut() ? null : await refreshSession()
    }
    if (!token) {
      set({ status: "anonymous", user: null })
      return
    }

    try {
      set({ status: "authenticated", user: await loadUser() })
    } catch {
      clearToken()
      set({ status: "anonymous", user: null })
    }
  },

  login: async ({ username, password, remember }) => {
    configureApiClient()
    const { data } = await authLogin({ body: { username, password, long_token: remember } })
    if (!data.token) throw new Error("La respuesta de inicio de sesión no incluye un token")
    writeToken(data.token)
    setJustLoggedOut(false)
    set({ status: "authenticated", user: await loadUser() })
  },

  logout: async () => {
    try {
      await authLogout()
    } catch {
      // the local session is cleared regardless
    }
    clearToken()
    setJustLoggedOut(true)
    set({ status: "anonymous", user: null })
  },

  refreshUser: async () => {
    set({ user: await loadUser() })
  },

  expire: () => {
    clearToken()
    set({ status: "anonymous", user: null })
  },
}))
