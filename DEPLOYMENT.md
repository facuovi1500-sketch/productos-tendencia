# Despliegue online

Guia para publicar Productos Tendencia con frontend en Vercel, backend NestJS en Railway o Render y PostgreSQL online.

## Estructura auditada

- Frontend: `apps/web`, Next.js 14. Usa `NEXT_PUBLIC_API_URL`; si no esta configurada, queda en preview sin datos reales.
- Backend: `apps/api`, NestJS. Usa `PORT`, `CORS_ORIGIN`, `JWT_SECRET` y Prisma.
- Prisma: `apps/api/prisma/schema.prisma`, migraciones en `apps/api/prisma/migrations`.
- Base de datos: PostgreSQL via `DATABASE_URL`.
- Monorepo: npm workspaces en la raiz.

## Variables requeridas

Backend:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require&schema=public"
JWT_SECRET="usar-un-secreto-largo-y-random-de-32-caracteres-o-mas"
CORS_ORIGIN="https://tu-app.vercel.app"
NODE_ENV="production"
PORT=4000
```

Frontend:

```bash
NEXT_PUBLIC_API_URL="https://tu-api.up.railway.app/api"
NODE_ENV="production"
```

Local:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/productos_tendencia?schema=public"
JWT_SECRET="dev-secret-local-change-me"
CORS_ORIGIN="https://your-web-origin.example"
NEXT_PUBLIC_API_URL="https://your-api-origin.example/api"
NODE_ENV="development"
PORT=4000
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="replace-with-a-temporary-strong-password"
```

## Base de datos PostgreSQL online

Opcion recomendada: Neon, Supabase, Railway o Render PostgreSQL.

Pasos:

1. Crear un proyecto PostgreSQL.
2. Copiar el connection string.
3. Confirmar que incluya SSL si el proveedor lo requiere, por ejemplo `sslmode=require`.
4. Guardarlo como `DATABASE_URL` en el servicio backend.
5. No pegar `DATABASE_URL` en archivos versionados.

## Prisma en produccion

Comandos desde la raiz del repo:

```bash
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
```

Uso recomendado:

- `npm run db:generate`: genera Prisma Client.
- `npm run db:deploy`: aplica migraciones existentes en produccion.
- `npm run db:seed`: carga usuario admin y datos iniciales si la base esta vacia o si queres datos de prueba.

No usar `prisma migrate dev` en produccion.

## Backend en Railway

Crear un servicio desde el repo y configurar:

- Root directory: raiz del repo.
- Build command:

```bash
npm install && npm run build -w apps/api
```

- Start command:

```bash
npm run start -w apps/api
```

Variables:

```bash
DATABASE_URL="..."
JWT_SECRET="..."
CORS_ORIGIN="https://tu-app.vercel.app"
NODE_ENV="production"
```

Despues del primer deploy, ejecutar migraciones:

```bash
npm run db:deploy
```

Si corresponde, seed:

```bash
npm run db:seed
```

## Backend en Render

Crear un Web Service desde el repo y configurar:

- Root directory: raiz del repo.
- Environment: Node.
- Build command:

```bash
npm install && npm run build -w apps/api
```

- Start command:

```bash
npm run start -w apps/api
```

Variables:

```bash
DATABASE_URL="..."
JWT_SECRET="..."
CORS_ORIGIN="https://tu-app.vercel.app"
NODE_ENV="production"
```

Render define `PORT` automaticamente. El backend ya usa `process.env.PORT`.

## Frontend en Vercel

Crear proyecto desde el repo y configurar:

- Framework: Next.js.
- Root directory: `apps/web`.
- Build command: `npm run build`.
- Output: Next.js default.

Variable:

```bash
NEXT_PUBLIC_API_URL="https://tu-api.railway.app/api"
```

Cuando tengas el dominio final de Vercel, volver al backend y configurar:

```bash
CORS_ORIGIN="https://tu-app.vercel.app"
```

Si usas dominio propio, reemplazarlo por el dominio propio.

## Seguridad minima

- No subir `.env`, `.env.local`, `.env.production` ni URLs con credenciales.
- Usar `JWT_SECRET` largo, random y distinto al local.
- Limitar `CORS_ORIGIN` al dominio real del frontend.
- No usar `dev-secret` en produccion.
- No publicar capturas o logs con `DATABASE_URL`.
- Rotar `JWT_SECRET` si fue compartido por error.

## Pruebas post deploy

1. Abrir `https://tu-api.../api/health`.
2. Confirmar respuesta de health check.
3. Abrir frontend en Vercel.
4. Iniciar sesion con el usuario admin del seed.
5. Confirmar que el banner diga: `API conectada: datos reales de la base configurada.`
6. Abrir Dashboard y validar caja, capital comprometido, ganancia cobrada y pedidos en riesgo.
7. Crear un cliente de prueba.
8. Crear una consulta con ese cliente.
9. Crear o editar un pedido y verificar ganancia teorica vs ganancia cobrada.
10. Revisar que el backend no acepte origenes fuera de `CORS_ORIGIN`.

## Checklist final

- [ ] Base PostgreSQL online creada.
- [ ] `DATABASE_URL` cargada en backend.
- [ ] `JWT_SECRET` fuerte cargado en backend.
- [ ] `CORS_ORIGIN` apunta al dominio Vercel.
- [ ] `NEXT_PUBLIC_API_URL` apunta al backend publicado con `/api`.
- [ ] `npm run db:generate` ejecutado.
- [ ] `npm run db:deploy` ejecutado.
- [ ] Seed ejecutado si hace falta usuario inicial.
- [ ] `GET /api/health` responde online.
- [ ] Login online funciona.
- [ ] Dashboard online usa API real.
- [ ] Entorno local sigue funcionando con variables locales propias.
