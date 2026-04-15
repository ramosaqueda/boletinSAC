# ── Etapa 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copiar manifiestos del workspace primero (aprovecha cache de capas)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Copiar fuentes y compilar
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm --filter api build

# ── Etapa 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Solo dependencias de producción
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod

# Código compilado
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY packages/shared ./packages/shared

ENV NODE_ENV=production
ENV PORT=8003

EXPOSE 8003

CMD ["node", "apps/api/dist/index.js"]
