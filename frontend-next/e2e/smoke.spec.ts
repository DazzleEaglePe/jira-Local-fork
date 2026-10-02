import { expect, test, type Page } from "@playwright/test"

const user = process.env.E2E_USER ?? ""
const password = process.env.E2E_PASSWORD ?? ""

async function login(page: Page) {
  await page.goto("/login")
  await page.getByLabel("Usuario o correo").fill(user)
  await page.getByLabel("Contraseña", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Continuar" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

test("should send anonymous visitors to the login with a return path", async ({ page }) => {
  await page.goto("/labels")
  await expect(page).toHaveURL(/\/login\?redirect=%2Flabels$/)
})

test.describe("signed in", () => {
  test.skip(!user || !password, "Set E2E_USER and E2E_PASSWORD to run the signed-in smoke tests")

  test("should show a Spanish error for a wrong password", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Usuario o correo").fill(user)
    await page.getByLabel("Contraseña", { exact: true }).fill(`${password}-incorrecta`)
    await page.getByRole("button", { name: "Continuar" }).click()
    await expect(page.getByText("Usuario o contraseña incorrectos.")).toBeVisible()
  })

  test("should walk through the main screens", async ({ page }) => {
    await login(page)
    await expect(page.getByRole("heading", { name: "Para ti" })).toBeVisible()

    // Command palette → first project
    await page.keyboard.press("Control+k")
    const palette = page.getByRole("dialog")
    await expect(palette.getByPlaceholder(/Buscar/)).toBeVisible()
    await palette.getByRole("option", { name: "Todos los proyectos" }).click()
    await expect(page).toHaveURL(/\/projects$/)

    const firstProject = page.locator(`main a[href^="/projects/"]`).first()
    await firstProject.click()
    await expect(page).toHaveURL(/\/projects\/\d+\/views\/\d+$/)
    const views = page.getByRole("navigation", { name: "Vistas del proyecto" })
    await expect(views).toBeVisible()

    for (const name of ["Lista", "Tabla", "Cronograma"]) {
      const tab = views.getByRole("link", { name })
      if ((await tab.count()) === 0) continue
      await tab.click()
      await expect(tab).toHaveAttribute("aria-current", "page")
    }

    await page.getByRole("button", { name: /^Notificaciones/ }).click()
    await expect(page.getByRole("heading", { name: "Notificaciones" })).toBeVisible()
    await page.keyboard.press("Escape")

    await page.goto("/settings")
    await expect(page.getByRole("heading", { name: "Ajustes personales" })).toBeVisible()
    await expect(page.getByLabel("Nombre visible")).toBeVisible()
  })
})
