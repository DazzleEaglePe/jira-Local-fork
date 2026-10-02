# 🚀 Jira-Local — Tablero de Tareas Caja Ica

Plataforma ágil de gestión de proyectos y tareas estilo Jira / Trello / Linear, personalizada para Caja Ica.

Desarrollado y adaptado por **Jacn_159** (Jose Aldahir Casma Nieto).

---

## 🌐 Direcciones de Acceso

- **Servidor Web Principal (Frontend + Backend Proxy):**  
  [http://localhost:5173](http://localhost:5173)

- **Para el equipo en la red local (LAN):**  
  `http://172.20.16.141:5173`

- **Backend API Directo (Vikunja Go Engine):**  
  `http://localhost:3456`

---

## ⚡ Cómo Iniciar el Servidor

1. **Desde esta carpeta:** Ejecuta `iniciar_vikunja.bat`.
2. Se iniciará el backend de base de datos y el servidor web con proxy integrado.
3. Se abrirá automáticamente la plataforma en el navegador.
4. Para detener todos los servicios, ejecuta `detener_vikunja.bat`.

---

## 🛠️ Características Principales

- **Vista Tablero Kanban Pro:** Inspirado en Linear y Trello con separación de tarjetas, estados por columnas, límites WIP y badges informativos.
- **Identidad Corporativa Caja Ica:** Paleta de colores oficial (`#e30613`), modo claro y modo oscuro optimizados, tipografía y logo corporativo.
- **Gestión de Tareas:** Subtareas jerárquicas, etiquetas de colores, estimación, fechas límite, prioridades y asignación de usuarios.
- **Rendimiento Ultraligero:** Sin Docker, persistencia SQLite local y frontend compilado en Vue 3 + Vite.

---

## 📁 Estructura del Proyecto

- `frontend-src/`: Código fuente del cliente web (Vue 3, TypeScript, Pinia, SCSS).
- `server.mjs`: Servidor HTTP Node.js que sirve los estáticos y enruta peticiones hacia la API.
- `iniciar_vikunja.bat` / `detener_vikunja.bat`: Scripts de arranque y apagado en un clic.
- `config.yml.sample`: Plantilla de configuración del servicio.
