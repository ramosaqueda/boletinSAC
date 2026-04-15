# CLAUDE.md — Portal SAC/ECOH

Guía de contexto para el agente de desarrollo. Lee este archivo completo antes de escribir cualquier código o responder preguntas sobre el proyecto.

---

## 1. Descripción del proyecto

**Portal de gestión de boletines de criminalidad SAC/ECOH** para la Fiscalía de Chile, Región de Coquimbo, SAC.

El sistema reemplaza un proceso manual en PowerPoint por un portal web que permite ingresar, organizar, visualizar y exportar los reportes semanales de delitos de interés (tráfico de drogas, porte de armas, robos, violaciones de morada). El boletín final se exporta en formato `.pptx` y `.pdf` manteniendo el diseño institucional.

**Usuarios principales:** analistas ECOH, fiscales y supervisores de la unidad.

---

## 2. Fases del proyecto

| Fase | Estado | Descripción |
|------|--------|-------------|
| **1 — Ingreso manual** | 🟡 En desarrollo | Portal web con formulario estructurado, visualización editorial de casos, gestión de fotos y notas |
| **2 — Automatización** | 🔜 Pendiente | Web scraping de prensa local, matching automático por RUC / geolocalización / keyword |
| **3 — Inteligencia** | 🔜 Pendiente | Análisis de red asociativa, alertas de reincidencia, integración SAF / SRCeI |
| **4 — Reportería** | 🔜 Pendiente | Generación automática de boletín `.pptx` y `.pdf` desde los datos |

---

## 3. Stack tecnológico

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Fastify (preferido sobre Express por rendimiento y tipado)
- **ORM:** Drizzle ORM con driver `postgres` (no Prisma — Drizzle es más liviano y compatible con PostgreSQL nativo)
- **Base de datos:** PostgreSQL 16
- **Autenticación:** JWT con refresh tokens; roles: `analista`, `fiscal`, `supervisor`, `administrador`
- **Almacenamiento de archivos:** MinIO (compatible S3) para fotografías y documentos exportados
- **Validación:** Zod (compartido entre frontend y backend)
- **Testing:** Vitest + Supertest

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Estilos:** Tailwind CSS con paleta institucional personalizada
- **Componentes:** Shadcn/ui base, componentes propios encima
- **Estado global:** Zustand (ligero, sin boilerplate de Redux)
- **Fetching:** TanStack Query (React Query v5)
- **Formularios:** React Hook Form + Zod
- **Exportación pptx:** librería `pptxgenjs` en el backend (no en el navegador)

### Infraestructura
- **Contenedores:** Docker Compose para desarrollo local
- **Servicios locales:** PostgreSQL, MinIO, Redis (caché de sesiones)
- **CI/CD:** GitHub Actions
- **Despliegue:** VPS institucional o Railway (por definir)

---

## 4. Paleta de colores institucional

```css
/* Siempre usar estas variables, nunca hardcodear hex en componentes */
--azul:       #1C3F81;   /* Color principal Fiscalía de Chile */
--azul-hover: #152f61;
--azul-claro: #e8edf6;
--azul-medio: #c2cfe0;
--rojo:       #B80D0E;   /* Acento institucional */
--rojo-hover: #9a0b0c;
--rojo-claro: #fdf0f0;
--blanco:     #ffffff;
--gris-bg:    #f4f6f9;
--texto:      #1a2740;
--texto-suave:#4a5a78;
```

**Logo:** `https://www.fiscaliadechile.cl/themes/fiscalia_theme/logo_fiscalia.svg`
Usar siempre con `filter: brightness(0) invert(1)` sobre fondos azules.

---

## 5. Estructura de carpetas

```
ecoh-portal/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, recuperar contraseña
│   │   │   ├── (portal)/       # Rutas protegidas
│   │   │   │   ├── dashboard/
│   │   │   │   ├── boletin/[id]/
│   │   │   │   ├── casos/
│   │   │   │   ├── caso/[id]/
│   │   │   │   ├── ingreso/    # Formulario nuevo caso
│   │   │   │   └── configuracion/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             # Componentes base (shadcn)
│   │   │   ├── caso/           # CasoCard, CasoDetalle, CasoForm
│   │   │   ├── imputado/       # ImputadoCard, ImputadoStats
│   │   │   ├── boletin/        # BoletinHeader, StatsBar
│   │   │   └── layout/         # Topbar, Sidebar, Toast
│   │   └── lib/
│   │       ├── api.ts          # Cliente API tipado
│   │       └── schemas.ts      # Schemas Zod compartidos
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── boletines.ts
│       │   │   ├── casos.ts
│       │   │   ├── imputados.ts
│       │   │   ├── incautaciones.ts
│       │   │   ├── fotos.ts
│       │   │   └── auth.ts
│       │   ├── db/
│       │   │   ├── schema.ts   # Drizzle schema (refleja schema_ecoh_v2.sql)
│       │   │   └── index.ts    # Pool de conexiones
│       │   ├── services/       # Lógica de negocio
│       │   └── plugins/        # JWT, multipart, cors
│       └── tests/
├── packages/
│   └── shared/                 # Tipos y schemas Zod compartidos web/api
├── infra/
│   ├── docker-compose.yml      # Postgres + MinIO + Redis
│   └── nginx/
├── sql/
│   └── schema_ecoh_v2.sql         # Schema PostgreSQL completo (fuente de verdad)
└── docs/
    ├── CLAUDE.md               # Este archivo
    ├── modelo_datos_ecoh.docx  # Documentación campos BD
    └── portal_ecoh.html        # Prototipo HTML de referencia visual
```

---

## 6. Modelo de datos — tablas principales

```
boletin        → caso (1:N)
caso           → lugar        (1:1)
caso           → imputado     (1:N)
caso           → victima      (1:N)
caso           → incautacion  (1:N)
caso           → vehiculo     (1:N)
caso           → fotografia   (1:N)
caso           → noticia      (1:N)
caso           → fiscal       (N:1)
boletin        → usuario      (N:1, analista)
```

**Archivo de referencia:** `sql/schema_ecoh_v2.sql`
Contiene el DDL completo, tipos enumerados, índices, triggers y vistas.

**Vistas clave:**
- `v_resumen_boletin` — KPIs por boletín (total casos, imputados, gramos droga)
- `v_caso_detalle` — Listado enriquecido de casos con conteos
- `v_alertas_reincidencia` — Imputados con `alerta_reincidencia = true`

---

## 7. Convenciones de código

### Nombrado
- **Tablas BD:** snake_case singular (`caso`, `imputado`, no `casos`, `imputados`)
- **Columnas BD:** snake_case (`num_causas_previas`)
- **Componentes React:** PascalCase (`CasoCard.tsx`)
- **Funciones / variables JS:** camelCase (`getCasoPorId`)
- **Rutas API:** kebab-case (`/api/boletines/:id/casos`)
- **Tipos TypeScript:** PascalCase con sufijo según contexto (`CasoRow`, `CasoInsert`, `CasoResponse`)

### API REST
```
GET    /api/boletines                  → Lista de boletines
POST   /api/boletines                  → Crear boletín
GET    /api/boletines/:id              → Detalle con resumen
GET    /api/boletines/:id/casos        → Casos del boletín
POST   /api/casos                      → Crear caso
GET    /api/casos/:id                  → Detalle completo
PATCH  /api/casos/:id                  → Actualizar campos
POST   /api/casos/:id/fotos            → Subir fotografía (multipart)
POST   /api/casos/:id/noticias         → Vincular noticia
GET    /api/imputados?doc=:rut         → Buscar imputado por documento
GET    /api/fiscales                   → Catálogo de fiscales
```

Todos los endpoints protegidos con JWT. Respuestas siempre en formato:
```json
{ "data": { ... }, "meta": { "total": 0, "page": 1 } }
{ "error": { "code": "NOT_FOUND", "message": "..." } }
```

### Validación
Usar Zod en el package `shared`. El schema del formulario de ingreso debe espejear exactamente los campos de la tabla `caso` + entidades relacionadas. Nunca validar solo en el frontend.

---

## 8. Reglas de negocio críticas

1. **RUC:** formato obligatorio `^\d{7,10}-[\dKk]$`. Validar en Zod y en constraint PostgreSQL.
2. **Alerta reincidencia:** se activa automáticamente por trigger cuando `num_causas_previas >= 10`. No calcular en el frontend.
3. **Número de caso:** correlativo dentro del boletín. No es global — puede repetirse entre boletines distintos.
4. **Un boletín solo puede publicarse** si tiene al menos 1 caso en estado distinto de borrador.
5. **Fotografías:** almacenar en MinIO, guardar solo la URL en `fotografia.archivo_url`. Nunca guardar base64 en la BD.
6. **Imputado sin RUT confirmado:** usar `tipo_documento = 'sin_documento'` y registrar la observación en `identidades_mult`.
7. **Casos sin imputado identificado** (ej: caso 9 del boletín de ejemplo): dejar tabla `imputado` vacía para ese `id_caso`.

---

## 9. Referencia visual

El archivo `docs/portal_ecoh.html` es el prototipo aprobado por el cliente. Cualquier decisión de diseño de UI debe consultarse con ese archivo primero. Los componentes deben reproducir fielmente:

- Header azul `#1C3F81` con logo Fiscalía y franja `#B80D0E`
- Tipografía: `IBM Plex Sans` (UI) + `Source Serif 4` (relatos / titulares)
- Cards de caso expandibles con estructura: cabecera → relato → incautación → fotos → aside (imputado + diligencias + notas)
- Badges de estado con colores semánticos (rojo = prisión preventiva, naranja = arraigo, verde = libre)
- Números en rojo (`#B80D0E`) en stats de imputado cuando superan umbral

---

## 10. Comandos útiles

```bash
# Levantar servicios locales
docker compose up -d

# Aplicar schema a la BD local
psql -U ecoh -d ecoh_dev -f sql/schema_ecoh_v2.sql

# Instalar dependencias del monorepo
pnpm install

# Desarrollo frontend
pnpm --filter web dev

# Desarrollo backend
pnpm --filter api dev

# Ejecutar tests
pnpm --filter api test

# Generar tipos Drizzle desde la BD
pnpm --filter api db:pull

# Build de producción
pnpm build
```

---

## 11. Lo que NO hacer

- No usar Prisma (Drizzle es la elección del proyecto)
- No hardcodear colores en componentes — siempre usar variables CSS o clases Tailwind del tema
- No guardar imágenes en base64 ni en columnas de la BD
- No validar solo en el frontend — todo pasa por Zod en `shared`
- No crear endpoints sin autenticación JWT (excepto `/api/auth/login`)
- No usar `any` en TypeScript
- No modificar `sql/schema_ecoh_v2.sql` sin actualizar también el schema Drizzle en `apps/api/src/db/schema.ts`
- No implementar lógica de alertas de reincidencia en el frontend — confiar en el trigger de PostgreSQL

---

## 12. Contacto y contexto institucional

- **Institución:** Fiscalía de Chile — Región de Coquimbo
- **Unidad:** ECOH (Equipo Contra el Crimen Organizado de Alto Impacto) — Provincia del Elqui
- **Analista responsable:** Lissette Mujica Inaiman
- **Boletín de referencia:** Reporte N°9, semana 23–29 mayo 2025 (archivo `docs/portal_ecoh.html`)
- **Datos de ejemplo:** incluidos en `sql/schema_ecoh_v2.sql` (sección final con INSERTs)

---

## 13. Tablas paramétricas (p_*)

Todos los valores de listas controladas viven en tablas con prefijo `p_`. **Nunca usar ENUMs de PostgreSQL** — las tablas paramétricas permiten agregar valores sin migraciones DDL y soportan atributos extra.

### Tablas paramétricas del esquema

| Tabla | Uso |
|-------|-----|
| `p_tipo_delito` | Categorías de delito (incluye `color_hex` para badges) |
| `p_estado_causa` | Estado procesal del caso (incluye `color_hex`) |
| `p_tipo_lugar` | Tipo de lugar del hecho |
| `p_comuna` | Comunas de la provincia (incluye `provincia` y `region`) |
| `p_tipo_documento` | RUT / DNI / Pasaporte / Sin documento |
| `p_sexo` | Masculino / Femenino / No especificado |
| `p_sit_migratoria` | Situación migratoria del imputado |
| `p_calidad_victima` | Persona natural / Empresa / Institución / Funcionario |
| `p_tipo_lesiones` | Sin lesiones / Leves / Graves / Fallecido |
| `p_tipo_especie` | Droga / Arma / Vehículo / Herramientas / Otro |
| `p_subtipo_droga` | Pasta base / Marihuana / Cocaína / Éxtasis… |
| `p_subtipo_arma` | Fuego real / Fogueo / Aire comprimido / Blanca… |
| `p_estado_especie` | Incautado / Recuperado / En búsqueda / Destruido |
| `p_unidad_medida` | Gramos / Kilogramos / Unidades / Envoltorios… |
| `p_tipo_vehiculo` | Automóvil / Camioneta / Furgón / Motocicleta |
| `p_rol_vehiculo` | Usado en huida / Incautado / Robado / Recuperado |
| `p_tipo_foto` | Fotografía SS / Incautación / Lugar / Imputado |
| `p_tipo_match` | Manual / RUC / Geolocalización / Keyword |
| `p_estado_noticia` | Pendiente / Aceptada / Descartada |
| `p_estado_boletin` | Borrador / En revisión / Publicado |
| `p_rol_usuario` | Analista / Fiscal / Supervisor / Administrador |

### Estructura estándar de cada tabla paramétrica

```sql
CREATE TABLE p_xxx (
  id          SERIAL       PRIMARY KEY,
  codigo      VARCHAR(40)  NOT NULL UNIQUE,  -- clave de negocio (ej: 'trafico_drogas')
  nombre      VARCHAR(100) NOT NULL,          -- texto visible en la UI
  descripcion TEXT,                           -- opcional
  color_hex   CHAR(6),                        -- solo en tablas con representación visual
  orden       SMALLINT     NOT NULL DEFAULT 99,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE
);
```

### Cómo agregar un nuevo valor (sin migración DDL)

```sql
INSERT INTO p_tipo_delito (codigo, nombre, color_hex, orden)
VALUES ('estafa', 'Estafa', '444444', 13);
```

### Cómo desactivar un valor sin borrarlo

```sql
UPDATE p_tipo_delito SET activo = FALSE WHERE codigo = 'otro';
```

### En el frontend: cargar listas desde la API

```typescript
// Endpoint estándar para cualquier tabla paramétrica
GET /api/parametros/:tabla
// Ejemplo: GET /api/parametros/tipo_delito
// Respuesta: [{ id, codigo, nombre, color_hex, orden }]
// Solo registros con activo = true, ordenados por orden ASC
```
