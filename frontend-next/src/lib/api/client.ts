import { client } from "./generated/client.gen"
import { authRefreshToken } from "./generated/sdk.gen"
import { clearToken, getToken, writeToken } from "@/lib/auth/token"

export const API_BASE_URL = "/api/v2"

// The v2.5 backend scopes the refresh cookie to /api/v1/user/token/refresh,
// so the refresh must go through v1 for the browser to send it.
const REFRESH_BASE_URL = "/api/v1"

type UnauthorizedListener = () => void
const unauthorizedListeners = new Set<UnauthorizedListener>()

/** Notified when the session can't be recovered (refresh failed). */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

let inFlightRefresh: Promise<string | null> | null = null

/**
 * Exchanges the HttpOnly refresh cookie for a new access token.
 * Concurrent callers share a single request (refresh tokens are single-use).
 */
export function refreshSession(): Promise<string | null> {
  inFlightRefresh ??= (async () => {
    try {
      const { data } = await authRefreshToken({ baseUrl: REFRESH_BASE_URL, credentials: "include" })
      if (!data?.token) return null
      writeToken(data.token)
      return data.token
    } catch {
      return null
    } finally {
      inFlightRefresh = null
    }
  })()
  return inFlightRefresh
}

let configured = false

// Untouched copies of authenticated requests: the sent request's body is consumed,
// so a retry after refreshing must start from a clone taken before sending.
const replayableRequests = new WeakMap<Request, Request>()

export function configureApiClient() {
  if (configured) return
  configured = true

  client.setConfig({ baseUrl: API_BASE_URL, credentials: "include", throwOnError: true })

  client.interceptors.request.use((request) => {
    const token = getToken()
    if (!token || request.headers.has("Authorization")) return request
    const headers = new Headers(request.headers)
    headers.set("Authorization", `Bearer ${token}`)
    const authenticated = new Request(request, { headers })
    replayableRequests.set(authenticated, authenticated.clone())
    return authenticated
  })

  // Expired access token: refresh once and replay the request with the new token.
  client.interceptors.response.use(async (response, request) => {
    const replayable = replayableRequests.get(request)
    replayableRequests.delete(request)
    if (response.status !== 401 || !replayable || request.url.includes("/user/token/refresh")) {
      return response
    }

    const newToken = await refreshSession()
    if (!newToken) {
      clearToken()
      unauthorizedListeners.forEach((listener) => listener())
      return response
    }

    const headers = new Headers(replayable.headers)
    headers.set("Authorization", `Bearer ${newToken}`)
    return fetch(new Request(replayable, { headers }))
  })
}

// Spanish messages for Vikunja error codes users commonly hit (problem+json "code").
// Codes verified against the Vue app's i18n "error" table.
const ERROR_MESSAGES: Record<number, string> = {
  1011: "Usuario o contraseña incorrectos.",
  1012: "Tu correo aún no está confirmado.",
  1013: "La nueva contraseña está vacía.",
  1017: "El código de autenticación en dos pasos no es válido.",
  1020: "Esta cuenta está deshabilitada. Revisa tu correo o consulta al administrador.",
  1021: "Esta cuenta se gestiona con un proveedor de autenticación externo.",
}

/** Human-readable message from a Vikunja problem+json error or a thrown Error. */
export function getErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado"): string {
  if (error && typeof error === "object") {
    const problem = error as { code?: unknown; detail?: unknown; title?: unknown; message?: unknown }
    if (typeof problem.code === "number" && ERROR_MESSAGES[problem.code]) {
      return ERROR_MESSAGES[problem.code]
    }
    for (const value of [problem.detail, problem.message, problem.title]) {
      if (typeof value === "string" && value.trim()) return value
    }
  }
  return fallback
}
