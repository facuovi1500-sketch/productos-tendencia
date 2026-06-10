# Validacion operativa del MVP

Este documento define como usar y validar el MVP de Productos Tendencia como herramienta de decision operativa. El objetivo no es cargar datos por cargar, sino proteger capital y decidir con evidencia.

## 1. Flujo diario de uso

### 1. Cargar consulta

Cada consulta que llegue por WhatsApp, Instagram, TikTok, referido u otro canal debe registrarse como `Inquiry`.

Datos minimos:

- Producto consultado.
- Origen de la consulta.
- Cliente si esta identificado.
- Estado inicial: `ABIERTA`.
- Nota breve si ayuda a entender objecion, precio, urgencia o cantidad.

Regla: si no se cargan consultas perdidas, el ranking de demanda queda inflado y puede llevar a comprar stock sin validacion.

### 2. Marcar si hubo sena

Cuando el cliente reserva:

- Si no envio dinero: cambiar a `RESERVA_SIN_SENA`.
- Si envio dinero: cambiar a `RESERVA_CON_SENA`.

Regla: una reserva sin sena no valida demanda fuerte. Sirve como senal comercial, pero no como decision de compra.

### 3. Convertir a pedido

Cuando una reserva avanza a operacion real:

- Crear `Order`.
- Vincular cliente y producto.
- Asociar la consulta al pedido con `Inquiry.orderId`.
- Definir estado inicial segun avance:
  - `SENADO` si hay sena.
  - `COMPRADO_PROVEEDOR` si ya se compro.
  - `EN_TRANSITO` si el proveedor ya despacho.
  - `ENTREGADO` si el cliente recibio.
- Cambiar la consulta relacionada a `CONVERTIDA_PEDIDO` cuando la venta ya sea un pedido real.

Regla: toda conversion real debe poder rastrearse desde la consulta original hasta el pedido asociado.

### 4. Registrar proveedor

En cada pedido debe quedar claro que proveedor se uso.

Datos minimos:

- `providerId`.
- `supplierCost` real.
- Fecha de compra al proveedor si aplica.
- Nota de riesgo si hay demora, falta de respuesta o reclamo.

Regla: no alcanza con saber el costo promedio del producto; la decision real depende del proveedor usado.

### 5. Registrar dinero cobrado

Separar siempre:

- `amount`: precio total de venta.
- `deposit`: sena inicial.
- `amountPaid`: dinero efectivamente cobrado.
- `pendingBalance`: saldo pendiente.
- `estimatedProfit`: ganancia teorica.
- `realizedProfit`: ganancia cobrada.

Regla: `estimatedProfit` no es caja. Solo `amountPaid` y `realizedProfit` sirven para mirar caja real.

### 6. Actualizar caja

Al final del dia o ante cualquier movimiento relevante, cargar un `CashSnapshot`.

Datos minimos:

- Caja disponible.
- Caja en transito si aplica.
- Nota de contexto.

El dashboard debe responder:

- Caja disponible.
- Capital comprometido.
- Exposicion neta.
- Capital libre despues de compromisos.

### 7. Revisar si el producto se puede recomprar

Antes de recomprar, revisar:

- Consultas reales.
- Senas.
- Pedidos entregados.
- Ganancia cobrada.
- Margen contra costo real.
- Reclamos o demoras del proveedor.
- Si `doNotReorder` esta activo.
- Comparacion de proveedores por precio, MOQ, demora, fallas, reclamos y `reliabilityScore`.

Regla central: un producto solo se recompra si tiene demanda validada, margen sano, proveedor confiable y no compromete caja critica.

### Calculo de demanda validada

La demanda validada no es igual a cantidad de consultas.

Para el MVP, la demanda validada se interpreta con:

- Senas recibidas.
- Pedidos entregados.
- Ganancia cobrada.
- Menor peso para consultas perdidas o reservas sin sena.

Las consultas crudas sirven para detectar interes, objeciones y productos para testear. No justifican comprar stock por si solas.

### Caja y ganancia

`estimatedProfit` es ganancia teorica. No es caja y no debe usarse para decidir capital disponible.

`realizedProfit` es ganancia cobrada y se calcula como:

```text
realizedProfit = amountPaid - supplierCost
```

Si un pedido esta cobrado parcialmente, `realizedProfit` puede ser negativo aunque `estimatedProfit` sea positivo. Eso significa que todavia hay capital expuesto.

### Proveedor recomendado

El proveedor recomendado no es necesariamente el mas barato.

La comparacion de proveedores debe priorizar conveniencia operativa:

- Precio.
- MOQ.
- Demora estimada.
- Entregas tarde.
- Entregas fallidas.
- Reclamos.
- `reliabilityScore`.
- `finalScore`.

Un proveedor barato con mal cumplimiento puede ser mas riesgoso que uno algo mas caro pero confiable.

## 2. Reglas de decision

### Cuando comprar

Comprar al proveedor solo si se cumple al menos una condicion fuerte:

- Hay sena suficiente para cubrir una parte relevante del costo.
- Hay ventas previas entregadas con ganancia cobrada.
- La demanda se repite en varios clientes reales.
- El proveedor tiene cumplimiento aceptable.
- El proveedor recomendado por `/api/providers/compare/:productId` no es solo el mas barato, sino el de mejor conveniencia operativa.
- La caja libre sigue positiva despues de comprometer capital.

### Cuando no comprar

No comprar si ocurre cualquiera de estos casos:

- Solo hay consultas, pero no hay senas.
- El margen se ve bien teoricamente, pero el costo real deja poca ganancia.
- El proveedor tiene reclamos abiertos, fallas o demoras repetidas.
- El proveedor mas barato tiene mal `reliabilityScore` o `finalScore`.
- El pedido depende de cobrar un saldo incierto.
- La compra deja caja libre negativa o demasiado ajustada.
- El producto esta bloqueado con `doNotReorder`.

### Cuando pedir sena

Pedir sena cuando:

- El producto es por encargo.
- El MOQ del proveedor obliga a inmovilizar capital.
- El producto tiene alta variacion de precio.
- El cliente pide reservar unidad.
- Hay riesgo de que el proveedor cambie stock o precio.

Regla sugerida: la sena deberia cubrir al menos el riesgo operativo minimo: costo de reserva, anticipo al proveedor o parte del costo unitario.

### Cuando bloquear recompra

Marcar `doNotReorder = true` y completar `reorderBlockReason` si:

- Hay muchas consultas y pocas o ninguna sena.
- Hay ventas pero baja ganancia cobrada.
- El proveedor falla o demora demasiado.
- El producto genera reclamos.
- El margen real no compensa el tiempo o riesgo.
- El producto inmoviliza caja.

### Cuando marcar pedido en riesgo

Completar `riskNote` si:

- El proveedor demora mas que el plazo esperado.
- El cliente pago sena pero falta compra al proveedor.
- El pedido esta en transito sin actualizacion.
- Hay saldo pendiente alto.
- El proveedor tiene reclamos, fallas o entregas tardias.
- El cliente pide cambios, devolucion o cancela parcialmente.

### Cuando descartar proveedor

Pasar proveedor a `DESCARTADO` si:

- Acumula fallas de entrega.
- Tiene reclamos repetidos.
- No cumple tiempos.
- Cambia precios despues de reservar.
- Entrega calidad inferior a la prometida.
- El precio bajo no compensa reclamos, demoras o devoluciones.

## 3. Escenarios de prueba manual

### Escenario 1: consulta perdida

1. Crear una consulta para un producto.
2. Marcar estado `PERDIDA`.
3. Agregar nota: precio alto, sin stock, cliente no respondio u otro motivo.
4. Validar que la consulta perdida no se interprete como venta ni sena.

Resultado esperado: ayuda a medir demanda debil o friccion comercial.

### Escenario 2: reserva sin sena

1. Crear una consulta.
2. Cambiar a `RESERVA_SIN_SENA`.
3. No crear pedido todavia.
4. Revisar dashboard.

Resultado esperado: el sistema muestra interes, pero no lo trata como demanda validada fuerte.

### Escenario 3: reserva con sena

1. Crear una consulta.
2. Cambiar a `RESERVA_CON_SENA`.
3. Crear pedido con `deposit` y `amountPaid`.
4. Estado del pedido: `SENADO`.
5. Asociar el pedido en `Inquiry.orderId`.

Resultado esperado: aumenta demanda validada y capital comprometido si se compra al proveedor.

### Escenario 4: pedido cobrado parcialmente

1. Crear pedido por monto total.
2. Cargar `deposit`.
3. Cargar `amountPaid` menor a `amount`.
4. Revisar `pendingBalance`.

Resultado esperado: el dashboard no confunde venta total con caja cobrada.

### Escenario 5: producto con ganancia teorica pero sin ganancia cobrada

1. Crear pedido con buen margen teorico.
2. Dejar `amountPaid` bajo o igual a la sena.
3. Cargar `supplierCost`.
4. Revisar `estimatedProfit` y `realizedProfit`.

Resultado esperado: la ganancia teorica puede ser positiva, pero la ganancia cobrada puede ser baja o negativa.

### Escenario 6: proveedor barato pero con reclamos

1. Crear proveedor con precio bajo.
2. Subir `claimsCount`, `lateDeliveries` o `failedDeliveries`.
3. Asociarlo a un pedido.
4. Revisar pedido en riesgo y `/api/providers/compare/:productId`.

Resultado esperado: el sistema no recomienda mirar solo precio; muestra riesgo operativo, `reliabilityScore`, `finalScore` y proveedor recomendado por conveniencia.

### Escenario 7: producto con muchas consultas pero pocas senas

1. Crear varias consultas para un producto.
2. Marcar pocas o ninguna como `RESERVA_CON_SENA`.
3. Activar `doNotReorder`.
4. Completar `reorderBlockReason`.

Resultado esperado: aparece como producto a pausar o no recomprar.

### Escenario 8: pedido en riesgo por demora

1. Crear pedido con proveedor.
2. Marcar estado `EN_TRANSITO` o agregar `riskNote`.
3. Aumentar demoras del proveedor si aplica.
4. Revisar dashboard.

Resultado esperado: aparece en pedidos en riesgo.

## 4. Criterios para considerar el MVP aprobado

El MVP se considera aprobado si, con 10 a 20 operaciones reales o simuladas, responde rapido y sin calculos manuales:

- Cuanta caja disponible hay.
- Cuanto capital esta comprometido.
- Cuanto capital libre queda despues de compromisos.
- Cuanta ganancia cobrada existe.
- Que productos conviene pausar o no recomprar.
- Que pedidos estan en riesgo.
- Que proveedor conviene usar considerando precio y cumplimiento.
- Que consultas convertidas tienen pedido asociado.
- Que productos tienen demanda validada por senas o pedidos, no solo consultas.
- Que consultas se perdieron y por que.
- Que ventas son teoricas y cuales ya impactaron en caja.

Si alguna de estas respuestas no aparece clara en dashboard, pedidos, productos, proveedores o metricas, el MVP no esta listo para escalar.

## 5. Pendientes tecnicos antes de produccion

- [ ] Instalar Node/npm funcional en el entorno.
- [ ] Correr `npm install`.
- [ ] Configurar PostgreSQL real.
- [ ] Revisar variables `.env`, especialmente `DATABASE_URL`, `JWT_SECRET`, `PORT` y `CORS_ORIGIN`.
- [ ] Correr migraciones Prisma.
- [ ] Correr seed.
- [ ] Probar endpoints principales.
- [ ] Probar navegacion web.

## 6. No escalar todavia si...

- No hay senas reales.
- No hay caja libre suficiente.
- El proveedor tiene reclamos, demoras o entregas fallidas.
- El producto tiene muchas consultas pero pocas reservas con sena.
- La ganancia todavia es teorica.
- Hay pedidos en riesgo abiertos.
