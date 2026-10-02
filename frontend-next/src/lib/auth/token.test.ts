import { afterEach, describe, expect, it } from "vitest"

import { clearToken, decodeTokenPayload, getToken, isTokenExpired, writeToken } from "./token"

function makeToken(payload: object) {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`
}

describe("token", () => {
  afterEach(() => clearToken())

  it("should decode the payload of a base64url JWT", () => {
    const token = makeToken({ id: 7, username: "prueba", exp: 2_000_000_000 })

    expect(decodeTokenPayload(token)).toEqual({ id: 7, username: "prueba", exp: 2_000_000_000 })
  })

  it("should return null for malformed tokens", () => {
    expect(decodeTokenPayload("not-a-jwt")).toBeNull()
    expect(decodeTokenPayload(null)).toBeNull()
  })

  it("should treat tokens expiring within the skew as expired", () => {
    const now = 1_000_000_000_000
    const soon = makeToken({ exp: now / 1000 + 10 })
    const later = makeToken({ exp: now / 1000 + 3600 })

    expect(isTokenExpired(soon, now)).toBe(true)
    expect(isTokenExpired(later, now)).toBe(false)
    expect(isTokenExpired(null, now)).toBe(true)
  })

  it("should persist and clear the token", () => {
    writeToken("abc")
    expect(getToken()).toBe("abc")

    clearToken()
    expect(getToken()).toBeNull()
  })
})
