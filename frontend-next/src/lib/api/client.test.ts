import { describe, expect, it } from "vitest"

import { getErrorMessage } from "./client"

describe("getErrorMessage", () => {
  it("should translate known Vikunja error codes", () => {
    const error = { title: "Forbidden", status: 403, detail: "Wrong username or password.", code: 1011 }

    expect(getErrorMessage(error)).toBe("Usuario o contraseña incorrectos.")
  })

  it("should fall back to the problem detail for unknown codes", () => {
    expect(getErrorMessage({ code: 9999, detail: "Algo pasó" })).toBe("Algo pasó")
  })

  it("should use the fallback for non-problem values", () => {
    expect(getErrorMessage(undefined, "Sin conexión")).toBe("Sin conexión")
  })
})
