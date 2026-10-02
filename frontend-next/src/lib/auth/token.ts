// Access token storage. Same localStorage key as the Vue frontend ("token").
const TOKEN_KEY = "token"

// Fallback when localStorage is unavailable
let memoryToken: string | null = null

export type TokenPayload = {
  id?: number
  type?: number
  username?: string
  exp?: number
  long?: boolean
}

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function writeToken(token: string, persist = true) {
  try {
    if (persist) localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // storage unavailable (private mode): the session lasts for this tab only
  }
  memoryToken = token
}

export function clearToken() {
  memoryToken = null
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  return readToken() ?? memoryToken
}

/** Decodes the JWT payload (base64url). Returns null for malformed tokens. */
export function decodeTokenPayload(token: string | null): TokenPayload | null {
  if (!token) return null
  const part = token.split(".")[1]
  if (!part) return null
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    return JSON.parse(atob(padded)) as TokenPayload
  } catch {
    return null
  }
}

/** True when the token is missing, malformed or expires within `skewMs`. */
export function isTokenExpired(token: string | null, nowMs = Date.now(), skewMs = 30_000): boolean {
  const exp = decodeTokenPayload(token)?.exp
  if (!exp) return true
  return exp * 1000 - skewMs <= nowMs
}
