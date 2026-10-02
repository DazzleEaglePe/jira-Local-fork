import { beforeEach, describe, expect, it, vi } from "vitest"

import { authLogin, authLogout, authRefreshToken, userShow } from "@/lib/api/generated/sdk.gen"
import { JUST_LOGGED_OUT_KEY, useSession } from "./session-store"
import { clearToken, getToken } from "./token"

vi.mock("@/lib/api/generated/sdk.gen", () => ({
  authLogin: vi.fn(),
  authLogout: vi.fn(),
  authRefreshToken: vi.fn(),
  userShow: vi.fn(),
}))

const user = { id: 1, username: "prueba", name: "Usuario Prueba" }

describe("useSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearToken()
    sessionStorage.removeItem(JUST_LOGGED_OUT_KEY)
    useSession.setState({ status: "checking", user: null })
  })

  it("should authenticate and store the token on successful login", async () => {
    vi.mocked(authLogin).mockResolvedValue({ data: { token: "jwt-token" } } as never)
    vi.mocked(userShow).mockResolvedValue({ data: user } as never)

    await useSession.getState().login({ username: "prueba", password: "secreto", remember: true })

    expect(authLogin).toHaveBeenCalledWith({
      body: { username: "prueba", password: "secreto", long_token: true },
    })
    expect(getToken()).toBe("jwt-token")
    expect(useSession.getState()).toMatchObject({ status: "authenticated", user })
  })

  it("should propagate the API error and stay unauthenticated on bad credentials", async () => {
    vi.mocked(authLogin).mockRejectedValue({ detail: "Wrong username or password." })

    await expect(
      useSession.getState().login({ username: "prueba", password: "mala", remember: false })
    ).rejects.toEqual({ detail: "Wrong username or password." })

    expect(getToken()).toBeNull()
    expect(useSession.getState().status).toBe("checking")
  })

  it("should not restore the session from the refresh cookie right after logout", async () => {
    useSession.setState({ status: "authenticated", user })
    vi.mocked(authLogout).mockResolvedValue({ data: {} } as never)
    await useSession.getState().logout()

    useSession.setState({ status: "checking" })
    await useSession.getState().bootstrap()

    expect(authRefreshToken).not.toHaveBeenCalled()
    expect(useSession.getState().status).toBe("anonymous")
  })

  it("should clear the session on logout even if the API call fails", async () => {
    useSession.setState({ status: "authenticated", user })
    vi.mocked(authLogout).mockRejectedValue(new Error("offline"))

    await useSession.getState().logout()

    expect(useSession.getState()).toMatchObject({ status: "anonymous", user: null })
  })
})
