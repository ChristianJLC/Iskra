# Rutinas

App personal para organizar comidas, ejercicio, estudio, tareas y finanzas del día a día. Next.js + Tailwind CSS + Prisma/PostgreSQL, con tema claro/oscuro y diseño responsive.

## Configuración local

1. Copia `.env.example` a `.env` y completa las variables:
   - `DATABASE_URL`: cadena de conexión de PostgreSQL. Para desarrollo local sin depender de Neon, puedes usar una base temporal con `npx prisma dev`.
   - `SESSION_SECRET`: genera una con `openssl rand -base64 32`.
2. Instala dependencias: `npm install` (esto ejecuta `prisma generate` automáticamente).
3. Aplica las migraciones: `npx prisma migrate dev`.
4. Inicia el servidor de desarrollo: `npm run dev`.

## Base de datos en producción (Neon)

1. Crea un proyecto en [Neon](https://neon.tech) y copia la cadena de conexión (usa la versión "pooled" para runtime).
2. Configura `DATABASE_URL` con esa cadena en las variables de entorno de Vercel (o en tu `.env` local para probar contra Neon).
3. Ejecuta `npx prisma migrate deploy` para aplicar las migraciones contra Neon.

## Despliegue en Vercel

1. Sube el proyecto a un repositorio Git y conéctalo en Vercel.
2. Define las variables de entorno `DATABASE_URL` y `SESSION_SECRET` en el proyecto de Vercel.
3. Vercel ejecutará `npm run build`, que corre `prisma generate` antes de compilar Next.js.

## Estructura

- `src/app/(auth)`: registro e inicio de sesión.
- `src/app/(dashboard)`: layout protegido con navegación (Resumen, Nutrición, Ejercicio, Estudio, Organización, Finanzas).
- `src/actions`: Server Actions para cada módulo (mutaciones de datos).
- `src/lib`: sesión (JWT en cookie), data access layer (`dal.ts`), Prisma, utilidades.
- `prisma/schema.prisma`: modelo de datos.
