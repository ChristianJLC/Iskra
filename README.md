<div align="center">

# Iskra

**Organiza tu día, alcanza tus metas y mantén el control de tu vida.**

App de organización personal todo en uno: nutrición, ejercicio, estudio, tareas y finanzas en un solo panel.

[![Ver demo](https://img.shields.io/badge/Ver_demo-iskra--iota.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://iskra-iota.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## Vista previa

<!-- Guarda tus capturas en /docs y descomenta las líneas -->
<!-- ![Dashboard](./docs/dashboard.png) -->
<!-- ![Modo oscuro](./docs/dark-mode.png) -->

## ¿Qué es Iskra?

*Iskra* significa "chispa". La idea es simple: en lugar de usar una app para cada cosa, tienes todo tu día en un solo lugar, con un resumen que te muestra cómo vas.

## Módulos

| Módulo | Para qué sirve |
|--------|----------------|
| **Resumen** | Vista general de tu día y tu progreso |
| **Nutrición** | Registro de comidas y racha nutricional |
| **Ejercicio** | Seguimiento de entrenamientos |
| **Estudio** | Planificación de sesiones de estudio |
| **Organización** | Gestión de tareas del día a día |
| **Finanzas** | Control de ingresos y gastos |

## Características

- Registro e inicio de sesión con sesión segura (JWT en cookie).
- Rutas del dashboard protegidas.
- Tema claro y oscuro.
- Diseño responsive para móvil y escritorio.
- Datos persistentes en PostgreSQL (Neon) mediante Prisma.
- Mutaciones con Server Actions de Next.js.

## Tecnologías

| Capa | Herramientas |
|------|--------------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend | Server Actions, autenticación con JWT |
| Base de datos | PostgreSQL (Neon), Prisma ORM |
| Despliegue | Vercel |

## Estructura

```
src/
├── app/
│   ├── (auth)/        # Registro e inicio de sesión
│   └── (dashboard)/   # Layout protegido: Resumen, Nutrición, Ejercicio, Estudio, Organización, Finanzas
├── actions/           # Server Actions de cada módulo (mutaciones de datos)
└── lib/               # Sesión (JWT en cookie), data access layer (dal.ts), Prisma, utilidades
prisma/
└── schema.prisma      # Modelo de datos
```

## Configuración local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/ChristianJLC/Iskra.git
   cd Iskra
   ```

2. Copia `.env.example` a `.env` y completa las variables:
   - `DATABASE_URL`: cadena de conexión de PostgreSQL. Para desarrollo local sin depender de Neon, puedes usar una base temporal con `npx prisma dev`.
   - `SESSION_SECRET`: genera una con `openssl rand -base64 32`.

3. Instala dependencias (esto ejecuta `prisma generate` automáticamente):

   ```bash
   npm install
   ```

4. Aplica las migraciones:

   ```bash
   npx prisma migrate dev
   ```

5. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Base de datos en producción (Neon)

1. Crea un proyecto en [Neon](https://neon.tech) y copia la cadena de conexión (usa la versión *pooled* para runtime).
2. Configura `DATABASE_URL` con esa cadena en las variables de entorno de Vercel (o en tu `.env` local para probar contra Neon).
3. Aplica las migraciones:

   ```bash
   npx prisma migrate deploy
   ```

## Despliegue en Vercel

1. Conecta el repositorio en Vercel.
2. Define las variables de entorno `DATABASE_URL` y `SESSION_SECRET`.
3. Vercel ejecutará `npm run build`, que corre `prisma generate` antes de compilar Next.js.

## Autor

**Christian Lazaro** — Estudiante de Ingeniería de Sistemas (UTP)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/christianjlc10)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/ChristianJLC)
[![Portafolio](https://img.shields.io/badge/Portafolio-e11d48?style=flat-square&logo=vercel&logoColor=white)](https://christianlc.vercel.app)
