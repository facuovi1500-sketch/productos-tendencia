# DEPLOY

Estado requerido para considerar el sistema desplegado:

- Web publica en Vercel.
- API publica en Railway, Render o Fly.io.
- PostgreSQL cloud en Neon, Supabase, Railway o Render.
- Prisma apuntando a `DATABASE_URL` de produccion.
- Login y dashboard funcionando contra API real.

Si la API no esta online o no responde autenticacion, el deploy no esta terminado. Vercel queda solo como frontend preview.

## Orden obligatorio

1. Crear PostgreSQL cloud.
2. Desplegar API NestJS.
3. Configurar variables de API.
4. Ejecutar Prisma generate y migrate deploy.
5. Crear usuario admin con seed.
6. Verificar `/api/health` online.
7. Recién entonces configurar Vercel.
8. Confirmar login y dashboard sin `PREVIEW SIN API`.

## Ruta recomendada

Para este MVP, la ruta recomendada es:

- PostgreSQL: Neon.
- API: Railway.
- Frontend: Vercel.

Motivo:

- Neon entrega un `DATABASE_URL` compatible con Prisma.
- Railway permite desplegar Node/NestJS con variables, dominio publico y servicio PostgreSQL alternativo si se quiere simplificar todo en una sola plataforma.
- Vercel queda reservado para Next.js cuando la API ya este probada.

## Arquitectura confirmada

- Frontend: Next.js en Vercel, carpeta `apps/web`.
- Backend: NestJS en Railway o Render, carpeta `apps/api`.
- Base de datos: PostgreSQL cloud.
- ORM: Prisma con `DATABASE_URL`.
- Autenticacion: JWT con `JWT_SECRET`.
- CORS: limitado con `CORS_ORIGIN`.

## Variables obligatorias

Backend:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require&schema=public"
JWT_SECRET="secret-largo-random-minimo-32-caracteres"
CORS_ORIGIN="https://tu-frontend.vercel.app"
NODE_ENV="production"
SEED_ADMIN_EMAIL="admin@tu-dominio.com"
SEED_ADMIN_PASSWORD="password-temporal-fuerte"
```

Frontend:

```bash
NEXT_PUBLIC_API_URL="https://tu-backend-publico.example/api"
NODE_ENV="production"
```

## Verificacion previa obligatoria

Antes de compartir la URL con tu socio:

1. `NEXT_PUBLIC_API_URL` debe apuntar a una API publica, no a una maquina local.
2. `CORS_ORIGIN` debe apuntar al dominio exacto de Vercel.
3. `DATABASE_URL` debe apuntar a PostgreSQL cloud.
4. `JWT_SECRET` debe ser fuerte y distinto al de desarrollo.
5. `SEED_ADMIN_PASSWORD` no debe ser una clave generica.
6. `GET /api/health` debe responder desde internet.
7. Login debe devolver token JWT desde la API publicada.
8. Dashboard debe mostrar el banner de API conectada.
9. El dashboard no debe mostrar registros `PREVIEW SIN API`.

## Base PostgreSQL cloud

Opcion recomendada: Neon.

1. Crear proyecto en Neon.
2. Crear base para `productos_tendencia`.
3. Copiar el connection string para Prisma.
4. Confirmar que tenga SSL si Neon lo indica.
5. Guardar ese valor como `DATABASE_URL` en Railway.
6. No subir el connection string al repo.

## Deploy API antes de Vercel

Opcion recomendada: Railway.

Build command:

```bash
npm install && npm run build -w apps/api
```

Start command:

```bash
npm run start -w apps/api
```

Variables:

```bash
DATABASE_URL
JWT_SECRET
CORS_ORIGIN
NODE_ENV
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
```

Migraciones:

```bash
npm run db:deploy
```

Seed inicial:

```bash
npm run db:seed
```

Verificacion obligatoria:

```bash
GET https://tu-api-publica.example/api/health
```

Si este endpoint no responde online, no configurar Vercel todavia.

## Deploy web

Vercel:

No empezar esta etapa hasta que la API online responda `/api/health`.

- Root directory: `apps/web`.
- Framework: Next.js.
- Build command: `npm run build`.
- Variable requerida: `NEXT_PUBLIC_API_URL`.

Luego volver al backend y confirmar que `CORS_ORIGIN` coincide con el dominio final de Vercel.

## Prueba final

1. Abrir la URL publica de Vercel.
2. Iniciar sesion con `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`.
3. Confirmar banner: `API conectada: datos reales de la base configurada.`
4. Abrir Inicio operativo.
5. Confirmar caja disponible, capital comprometido, ganancia cobrada y pedidos en riesgo desde base real.
6. Crear un cliente de prueba.
7. Crear una consulta asociada a ese cliente.
8. Crear o editar un pedido.
9. Confirmar que el cliente aparece en selectores de Consultas y Pedidos.

## Resultado aceptado

El deploy se considera listo solo si tu socio puede:

- Entrar a una URL publica.
- Iniciar sesion.
- Ver dashboard con API conectada.
- Cargar clientes, consultas, pedidos y caja.
- Ver datos persistidos en PostgreSQL cloud.

Si cualquiera de esos puntos falla, no compartir como produccion.
