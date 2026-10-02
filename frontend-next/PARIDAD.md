# Checklist de paridad Vue → Next

Estado de cada módulo del frontend Vue (76 rutas) en la app Next. Se actualiza al cerrar cada sprint.

Leyenda: ✅ migrado · 🟡 parcial · ⬜ pendiente · ➖ fuera de alcance (queda en Vue o se descarta)

## Autenticación (Sprint 2)

| Función | Estado | Notas |
|---|---|---|
| Login usuario/contraseña | ✅ | "Mantener sesión iniciada" = token largo |
| Restaurar sesión (cookie de refresh) | ✅ | vía `/api/v1/user/token/refresh` |
| Renovar token ante 401 y reintentar | ✅ | |
| Logout | ✅ | bandera `justLoggedOut` como en Vue |
| Registro de cuenta | ⬜ | |
| Recuperar contraseña | ⬜ | |
| TOTP (2FA) en login | ⬜ | mensaje de error ya traducido |
| OpenID / LDAP | ➖ | no se usa en Caja Ica |

## Shell (Sprint 3)

| Función | Estado | Notas |
|---|---|---|
| Barra superior estilo Jira (buscador + Crear) | ✅ | |
| Barra lateral con árbol de proyectos | ✅ | favoritos, recientes, filtros guardados |
| Paleta `Ctrl K` | 🟡 | navegación y proyectos; búsqueda de tareas en sprint 6 |
| Tema claro/oscuro/sistema | ✅ | tokens Atlassian 2025 |
| "Para ti" (resumen) | ✅ | proyectos recientes + trabajo pendiente |
| Directorio de proyectos | ✅ | |
| Crear proyecto | ✅ | nombre + color |
| Notificaciones | ⬜ | sprint 7 |

## Proyectos y tareas

| Función | Estado | Sprint |
|---|---|---|
| Vista Kanban (columnas, mover tareas) | ✅ | 4 · dnd-kit, mouse y teclado (←/→ entre columnas, ↑/↓ dentro) |
| Crear tarea en columna | ✅ | 4 · Enter crea, Esc cancela, sigue abierto para crear varias |
| "Mostrar más" en columnas con más de 25 tareas | ✅ | 4 |
| Límite WIP visible / columna Hecho ✓ | ✅ | 4 |
| Buscar en el tablero | ✅ | 4 · filtro local por título (arrastre desactivado mientras filtras) |
| Crear / renombrar / eliminar columnas | ⬜ | 6 |
| Filtros avanzados del tablero (responsable, etiqueta) | ⬜ | 6 |
| Detalle de tarea (modal + página) | ⬜ | 5 |
| Editar título, descripción, prioridad, fechas | ⬜ | 5 |
| Etiquetas y responsables | ⬜ | 5 |
| Comentarios | ⬜ | 5 |
| Vista Lista / Tabla | ⬜ | 6 |
| Vista Gantt | ⬜ | 7 |
| Ajustes de proyecto (editar, archivar, compartir) | ⬜ | 7 |
| Etiquetas, equipos | ⬜ | 6 |
| Filtros guardados (crear/editar) | ⬜ | 7 |
| Ajustes de usuario | ⬜ | 7 |
| Migradores (Trello, Todoist…) | ➖ | quedan en Vue |
| Panel de administración | ➖ | queda en Vue |
