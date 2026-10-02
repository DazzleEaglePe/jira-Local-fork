# Modernización UX/UI — estilo Jira (Atlassian)

Rama de integración: `ux-ui/modernizacion-estilo-jira`

## 1. Estrategia de ramas

```
main
 └── ux-ui/modernizacion-estilo-jira          ← rama de integración (esta)
      ├── ux-ui/fundaciones-shadcn             ← fase 0: tooling + tokens
      ├── ux-ui/layout-navegacion              ← fase 1: top nav + sidebar
      ├── ux-ui/tablero-kanban                 ← fase 2
      ├── ux-ui/detalle-tarea                  ← fase 3
      └── ux-ui/listas-filtros                 ← fase 4
```

- Cada sub-rama sale de `ux-ui/modernizacion-estilo-jira` y vuelve a ella vía PR.
- La rama de integración se sincroniza con `main` con frecuencia (merge de `main` → integración) para evitar divergencia con upstream de Vikunja.
- A `main` solo se fusiona cuando una fase está completa y probada.
- Commits: Conventional Commits con scope `ui` (ej. `feat(ui): agregar Button de shadcn-vue`).

## 2. Stack de UI

El frontend es **Vue 3 + Vite + Tailwind v4** (ya instalado), así que se usa **shadcn-vue** (port oficial para Vue de shadcn/ui), no shadcn de React.

| Pieza | Librería | Motivo |
|---|---|---|
| Componentes | `shadcn-vue` (CLI, código copiado al repo) | Control total del código, sin lock-in |
| Primitivas accesibles | `reka-ui` | Base de shadcn-vue; ARIA y teclado resueltos |
| Variantes | `class-variance-authority`, `clsx`, `tailwind-merge` | Patrón estándar de shadcn |
| Iconos | `@lucide/vue` (sucesor de `lucide-vue-next`, deprecado) | Estilo lineal, cercano a Atlassian; reemplazo gradual de FontAwesome |
| Tablas | `@tanstack/vue-table` | Vista lista tipo Jira (ya se usa `@tanstack/vue-query`) |
| Drag & drop | se mantiene `zhyswan-vuedraggable` / `sortablejs` | Ya funciona en el kanban; no reescribir sin necesidad |

### Puntos de atención (resueltos en la fase 0)

1. **Prefijo `tw`**: Tailwind se carga con `prefix(tw)`, así que las clases son `tw:flex`, `tw:bg-primary`. `components.json` declara `"prefix": "tw"` y `cn()` (`src/lib/utils.ts`) usa `extendTailwindMerge({prefix: 'tw'})`.
2. **Bugs del CLI de shadcn-vue con prefijo** (revisar en cada `add`):
   - No prefija las clases escritas entre backticks dentro de `cn(...)`.
   - Prefija literales que no son clases (ej. `side === 'tw:right'`); el typecheck lo detecta.
   - Deja tokens `tw:` vacíos.
3. **Tokens propios `--ui-*`** en `src/styles/tailwind.css`, sin reutilizar `--primary`/`--background`/`--border` de Vikunja y Bulma para no pisarlos. El modo oscuro usa `:root.dark`, el mecanismo que ya existía.
4. **Sin preflight de Tailwind**: Bulma hace el reset. `tailwind.css` incluye un mini-preflight limitado a `[data-slot]` (bordes, botones, enlaces y listas), que solo afecta a los componentes shadcn.
5. **`@layer` es un polyfill**: `postcss-preset-env` convierte las capas en especificidad (`:not(#\#)`). No usar `revert-layer`; las reglas de la capa `base` ya le ganan a Bulma.
6. **Bulma convive**: la migración es incremental, componente por componente.
7. **ESLint**: override para `src/components/ui/**` (nombres de una palabra, `class` sin default), porque es código generado.

## 3. Lenguaje visual estilo Jira (sin copiar marca)

Tomamos los **patrones** del Atlassian Design System, no su marca: no se usan logos, nombres ni la tipografía propietaria de Atlassian. La identidad sigue siendo Caja Ica.

### Tokens

| Categoría | Criterio Atlassian | Aplicación |
|---|---|---|
| Espaciado | Grilla de 8px (`4, 8, 12, 16, 24, 32, 40`) | Escala de spacing de Tailwind (`tw:p-2` = 8px) |
| Tipografía | Base 14px, cuerpo 400, títulos 500–600 | Inter / system-ui, `text-sm` como base |
| Radio | 3–4px en controles, 8px en cards/modales | `--radius: 0.375rem` |
| Elevación | `surface` → `raised` → `overlay` | 3 niveles de sombra, no más |
| Neutros | Escala gris-azulada (N0–N900) | Mapear a `--grey-*` existentes |
| Acento | Un solo color de acción primaria | Rojo Caja Ica solo para CTA; enlaces/selección en azul neutro para no saturar de rojo |
| Estados | Lozenges: gris (Por hacer), azul (En curso), verde (Hecho) | Componente `StatusLozenge` |

### Patrones de layout

- **Top nav** fija (48–56px): logo, "Para ti / Proyectos / Filtros", botón **Crear** destacado, búsqueda global, notificaciones, avatar.
- **Sidebar izquierda colapsable**: proyecto actual, vistas (Tablero, Lista, Cronograma), atajos. Recordar estado colapsado.
- **Breadcrumbs** sobre el título: `Proyectos / Proyecto X / Tablero`.
- **Barra de filtros** del tablero: búsqueda, avatares de asignados (toggle), filtro por etiqueta, "Agrupar por".
- **Detalle de tarea** en panel lateral o modal de 2 columnas: izquierda descripción/subtareas/actividad; derecha campos (estado, asignado, prioridad, etiquetas, fechas).

## 4. Buenas prácticas UX/UI

- **Edición inline**: título y campos editables con clic, guardar con Enter / blur, cancelar con Esc.
- **Atajos de teclado**: `c` crear, `/` buscar, `?` ayuda de atajos, `Esc` cerrar panel. Mostrar atajo en tooltips.
- **Feedback inmediato**: actualizaciones optimistas (vue-query), toasts breves, skeletons en vez de spinners.
- **Estados vacíos** con acción sugerida ("No hay tareas — Crear tarea").
- **Densidad**: tarjetas de kanban compactas (clave, título 2 líneas máx., avatar, prioridad, etiquetas).
- **Accesibilidad WCAG 2.1 AA**: contraste ≥ 4.5:1, foco visible, navegación completa por teclado, `aria-*` vía reka-ui.
- **Modo oscuro** desde el inicio: cada token con valor claro/oscuro.
- **Consistencia**: ningún componente nuevo fuera de `src/components/ui/`; nada de colores hardcodeados.
- **Responsive**: sidebar como drawer en < 1024px; tablero con scroll horizontal.

## 5. Fases

| Fase | Rama | Entregable |
|---|---|---|
| 0 ✅ | `ux-ui/fundaciones-shadcn` | shadcn-vue (prefijo `tw`), `cn()`, tokens `--ui-*`, 18 componentes base, story en Histoire |
| 1 | `ux-ui/layout-navegacion` | Top nav + sidebar colapsable + breadcrumbs + búsqueda global (Command) |
| 2 | `ux-ui/tablero-kanban` | Columnas y tarjetas estilo Jira, barra de filtros, lozenges de estado |
| 3 | `ux-ui/detalle-tarea` | Panel de detalle 2 columnas, edición inline, actividad |
| 4 | `ux-ui/listas-filtros` | Vista lista con `@tanstack/vue-table`, filtros guardados |
| 5 | — | Retiro de Bulma/FontAwesome no usados, limpieza de SCSS |

## 6. Entorno y comandos

- Node 24 vía nvm (`nvm use 24.21.0`) y pnpm 11 vía `corepack enable`.
- En esta máquina existe la variable de entorno `test=MANUEL`, que silencia la salida del CLI de shadcn-vue (su logger entra en modo test). Ejecutarlo sin ella:

```bash
env -u test npx shadcn-vue@latest add <componente> --yes
```

- Si `npx`/`pnpm dlx` no imprimen nada (shim con ruta con espacios), invocar directamente `node <cache-npx>/node_modules/shadcn-vue/dist/index.js add <componente> --yes`.
- Después de cada `add`: revisar los bugs del CLI con prefijo (sección 2) y correr el typecheck.
- Vitrina visual: `src/components/ui/UiKit.story.vue` (tablero estilo Jira) con `pnpm story:dev`.
- Test preexistente fallando: `ProjectSettingsArchive.test.ts` espera el título `| Vikunja`, pero la marca Caja Ica lo cambió a `| Caja Ica`.

Verificación por fase: `pnpm lint:fix`, `pnpm lint:styles:fix`, `pnpm typecheck`, `pnpm test:unit` y revisión visual en claro/oscuro.
