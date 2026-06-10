# Productos Tendencia

Sistema operativo web para gestionar una comunidad de productos tendencia, preventas, senas y reventa mayorista.

## Arquitectura

- `apps/web`: Next.js 14, TypeScript, Tailwind, componentes estilo Shadcn/UI.
- `apps/api`: NestJS, JWT, roles y Prisma.
- Base de datos: PostgreSQL.

## Puesta en marcha

1. Instalar dependencias:

```bash
npm install
```

2. Crear `apps/api/.env` desde `apps/api/.env.example`.

Tambien existe `.env.example` en la raiz con todas las variables necesarias para entorno local y produccion.

3. Migrar y cargar datos iniciales:

```bash
npm run db:migrate
npm run db:seed
```

4. Levantar API y frontend:

```bash
npm run dev:api
npm run dev:web
```

API: definida por `NEXT_PUBLIC_API_URL` y por la URL publica del backend en produccion.

Web: definida por el entorno de Next.js o por la URL publica de Vercel.

Usuario inicial:

- Definir `SEED_ADMIN_EMAIL`.
- Definir `SEED_ADMIN_PASSWORD`.

Login API:

```bash
POST https://tu-api-publica.example/api/auth/login
{
  "email": "SEED_ADMIN_EMAIL",
  "password": "SEED_ADMIN_PASSWORD"
}
```

Usar el `accessToken` como `Authorization: Bearer <token>` para los endpoints protegidos.

## Modulos cubiertos

- Dashboard con caja, capital comprometido, capital libre, pedidos en riesgo y ganancia cobrada.
- Caja disponible, capital comprometido, exposicion neta y ganancia cobrada.
- Proveedores con comparacion por precio, MOQ, demora, reclamos, cumplimiento, `reliabilityScore` y recomendacion por conveniencia.
- Riesgo de proveedor por entregas a tiempo, demoras, fallas y reclamos.
- Productos con catalogo maestro, precios, stock, modalidad y multimedia.
- Alertas de productos que no deben recomprarse.
- Consultas reales por producto, origen y estado: abierta, perdida, reserva sin sena, reserva con sena o convertida a pedido.
- Trazabilidad formal desde consulta hasta pedido asociado mediante `Inquiry.orderId`.
- Pedidos con estados, sena, cobrado, costo real, saldo pendiente, ganancia teorica y ganancia cobrada.
- Clientes con historial, ranking y VIP.
- Comunidad con conversion comunidad a cliente.
- Contenido con calendario semanal.
- Metricas de ventas, conversion y rentabilidad.

## Endpoints principales

- `GET /api/dashboard`
- `GET /api/providers`
- `GET /api/providers/compare/:productId` compara proveedor barato vs proveedor conveniente con score de cumplimiento.
- `GET /api/products`
- `GET /api/inquiries`
- `GET /api/orders?status=SENADO`
- `GET /api/customers/ranking`
- `GET /api/community/growth`
- `GET /api/content`
- `GET /api/metrics`
- `GET /api/finance/cash`
- `POST /api/finance/cash`

Si la API o PostgreSQL no estan conectados, la web queda en modo preview sin datos reales.
Ese estado no sirve para operar ni para validar compras.

## Regla operativa central

Un producto solo deberia recomprarse si cumple estas condiciones:

- Tiene consultas reales y senas suficientes.
- Deja margen sano despues del costo real del proveedor.
- Convierte pedidos entregados, no solo reservas.
- El proveedor usado cumple tiempos y no acumula fallas o reclamos.
- No deja caja negativa despues de comprometer capital.

## Cierre operativo del MVP

- La demanda validada se calcula con senas, pedidos entregados y ganancia cobrada. Las consultas crudas se muestran como interes, pero no validan una compra por si solas.
- La ganancia teorica (`estimatedProfit`) no es caja real. Sirve para proyectar margen, pero no para decidir disponibilidad de capital.
- La ganancia cobrada (`realizedProfit`) sale de `amountPaid - supplierCost`. Si el cobro es parcial, puede ser negativa aunque la ganancia teorica sea positiva.
- El proveedor recomendado por `/api/providers/compare/:productId` prioriza conveniencia operativa: precio, MOQ, demora, reclamos, fallas, `reliabilityScore` y `finalScore`. No se elige automaticamente al proveedor mas barato.

## Checklist de aceptacion del MVP

- [ ] El dashboard muestra arriba caja disponible, capital comprometido, capital libre, ganancia cobrada y cantidad de pedidos en riesgo.
- [ ] La ganancia teorica siempre aparece marcada como teorica y nunca como caja real.
- [ ] La ganancia cobrada sale de `amountPaid - supplierCost`, no de ventas prometidas.
- [ ] Los pedidos muestran proveedor usado, costo real, dinero cobrado, saldo pendiente, ganancia teorica y ganancia cobrada.
- [ ] Las consultas distinguen `ABIERTA`, `PERDIDA`, `RESERVA_SIN_SENA`, `RESERVA_CON_SENA` y `CONVERTIDA_PEDIDO`.
- [ ] Las consultas convertidas muestran el pedido asociado mediante `Inquiry.orderId`.
- [ ] Los productos permiten bloquear recompra con `doNotReorder` y `reorderBlockReason`.
- [ ] Los proveedores permiten evaluar cumplimiento con entregas a tiempo, demoras, fallas y reclamos.
- [ ] La comparacion de proveedores no elige automaticamente el mas barato si tiene mal cumplimiento; devuelve `recommended`, `reliabilityScore` y `finalScore`.
- [ ] `GET /api/providers/compare/:productId`, `GET /api/customers/ranking` y `GET /api/community/growth` responden rutas especificas y no caen en `:id`.
- [ ] Si la API no responde, la app muestra preview sin datos reales y no se considera operativa.
- [ ] Las seeds cargan operaciones simuladas con criterio realista: consulta perdida, reserva sin sena, reserva con sena, pedido entregado y caja inicial.
- [ ] Con Node/npm funcionando, `npm install`, `npm run db:migrate`, `npm run db:seed`, `npm run dev:api` y `npm run dev:web` corren sin errores.

## Pendientes tecnicos antes de produccion

- [ ] Instalar Node/npm funcional en el entorno.
- [ ] Si aparece `node.exe Acceso denegado`, seguir `TROUBLESHOOTING_NODE.md`.
- [ ] Correr `npm install`.
- [ ] Configurar PostgreSQL real.
- [ ] Revisar variables `apps/api/.env` y `.env.example`.
- [ ] En local, correr migraciones Prisma con `npm run db:migrate`.
- [ ] En produccion, usar `npm run db:deploy`.
- [ ] Correr seed con `npm run db:seed` si hace falta usuario inicial.
- [ ] Probar endpoints principales: health, dashboard, providers compare, products, inquiries, orders, metrics y finance.
- [ ] Probar navegacion web completa.

## Despliegue online

Guia completa: ver `DEPLOYMENT.md`.

Resumen de produccion:

- Frontend: Vercel, root `apps/web`, variable `NEXT_PUBLIC_API_URL`.
- Backend: Railway o Render, comandos `npm run build -w apps/api` y `npm run start -w apps/api`.
- Base: PostgreSQL online con `DATABASE_URL`.
- Prisma: `npm run db:generate` y `npm run db:deploy`.
- Seguridad: `JWT_SECRET` fuerte, `CORS_ORIGIN` limitado al dominio del frontend y `.env` fuera de git.

## No escalar todavia si...

- No hay senas reales.
- No hay caja libre suficiente despues de compromisos.
- El proveedor tiene reclamos, demoras o entregas fallidas.
- El producto tiene muchas consultas pero pocas reservas con sena.
- La ganancia todavia es teorica y no cobrada.
- Hay pedidos en riesgo abiertos.
