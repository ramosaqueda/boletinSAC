# Portal SAC/ECOH — Boletín de Criminalidad

Portal web para la gestión y exportación de boletines semanales de criminalidad de la **Fiscalía de Chile, Región de Coquimbo — SAC/ECOH**.

Reemplaza el proceso manual en PowerPoint con un sistema estructurado de ingreso, visualización y exportación de reportes en `.pptx` y `.pdf`, manteniendo el diseño institucional.

---

## Stack tecnológico

### Monorepo

| Herramienta | Versión | Rol |
|---|---|---|
| [pnpm](https://pnpm.io/) | 9+ | Gestor de paquetes con workspaces |
| [TypeScript](https://www.typescriptlang.org/) | 5.4 | Tipado estático en todo el proyecto |

### Backend — `apps/api`

| Tecnología | Versión | Rol |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20 LTS | Runtime |
| [Fastify](https://fastify.dev/) | 4 | Framework HTTP (alta performance) |
| [Drizzle ORM](https://orm.drizzle.team/) | 0.30 | ORM liviano para PostgreSQL |
| [PostgreSQL](https://www.postgresql.org/) | 16 | Base de datos relacional |
| [Zod](https://zod.dev/) | 3 | Validación de esquemas (compartido con frontend) |
| [JWT](https://github.com/fastify/fastify-jwt) | — | Autenticación con refresh tokens |
| [Vitest](https://vitest.dev/) + Supertest | — | Testing |

### Frontend — `apps/web`

| Tecnología | Versión | Rol |
|---|---|---|
| [Next.js](https://nextjs.org/) | 14 (App Router) | Framework React SSR/SSG |
| [Tailwind CSS](https://tailwindcss.com/) | 3 | Estilos utilitarios |
| [Shadcn/ui](https://ui.shadcn.com/) | — | Componentes base accesibles |
| [Zustand](https://zustand-demo.pmnd.rs/) | 4 | Estado global (sin boilerplate) |
| [TanStack Query](https://tanstack.com/query) | v5 | Fetching y caché de datos del servidor |
| [React Hook Form](https://react-hook-form.com/) + Zod | — | Formularios con validación |

### Infraestructura

| Tecnología | Rol |
|---|---|
| Docker + Docker Compose | Contenedores para desarrollo y producción |
| MinIO | Almacenamiento de archivos (compatible S3) |
| Redis | Caché de sesiones |
| GitHub Actions | CI/CD |

---

## Estructura del proyecto

```
boletinSAC/
├── apps/
│   ├── api/          # Backend Fastify
│   │   └── src/
│   └── web/          # Frontend Next.js
│       ├── app/      # App Router (rutas y páginas)
│       ├── components/
│       └── lib/
├── packages/
│   └── shared/       # Tipos y esquemas Zod compartidos
├── infra/
│   └── docker-compose.yml
├── sql/              # Migraciones SQL
└── pnpm-workspace.yaml
```

---

## Requisitos previos

- [Node.js 20 LTS](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/installation) — `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para levantar PostgreSQL y MinIO localmente)
- [Git](https://git-scm.com/)

---

## Instalación y desarrollo local

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd boletinSAC
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Copia los archivos de ejemplo y completa los valores:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Variables mínimas requeridas en `apps/api/.env`:

```env
PORT=3004
DATABASE_URL=postgres://postgres:password@localhost:5432/boletin
JWT_SECRET=una_clave_secreta_larga
CORS_ORIGIN=http://localhost:3003
API_BASE_URL=http://localhost:3004
```

Variable requerida en `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3004
```

### 4. Levantar la base de datos con Docker

```bash
cd infra
docker compose up -d
```

Esto inicia PostgreSQL, MinIO y Redis en contenedores locales.

### 5. Ejecutar migraciones

```bash
pnpm --filter api db:pull
```

> Si hay scripts SQL en `/sql`, ejecútalos en orden numérico sobre la base de datos.

### 6. Iniciar el servidor de desarrollo

Desde la raíz del monorepo, levanta API y Web en paralelo:

```bash
pnpm dev
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3003 |
| Backend API | http://localhost:3004 |

---

## Despliegue con Docker (producción)

```bash
cd infra
docker compose up --build -d
```

| Servicio | Puerto |
|---|---|
| Frontend | 3003 |
| Backend API | 3004 |

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia API y Web en modo desarrollo (hot-reload) |
| `pnpm build` | Compila packages y apps para producción |
| `pnpm test` | Ejecuta los tests de todas las apps |
| `pnpm lint` | Linting del código |

---

## Convenciones

- **Ramas:** `main` para producción, `develop` para integración, `feat/<nombre>` para nuevas funcionalidades.
- **Variables de entorno:** nunca subir archivos `.env` al repositorio; están en `.gitignore`.
- **Tipado:** todo el código debe tipearse con TypeScript; evitar `any`.
- **Validación:** usar esquemas Zod del paquete `shared` tanto en frontend como en backend.

---

## Licencia

Uso interno  
