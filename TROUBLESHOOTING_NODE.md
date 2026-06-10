# Troubleshooting Node/npm en Windows

Guia corta para resolver `node.exe Acceso denegado` antes de validar tecnicamente el MVP.

## 1. Verificar si Node esta instalado

Abrir PowerShell y ejecutar:

```powershell
node -v
npm -v
```

Resultado esperado:

- `node -v` devuelve una version, por ejemplo `v20.x.x`.
- `npm -v` devuelve una version.

Si aparece `Acceso denegado`, seguir con los pasos siguientes.

## 2. Verificar que ejecutable esta tomando Windows

```powershell
where node
where npm
```

Revisar que la ruta apunte a una instalacion real de Node, normalmente:

```text
C:\Program Files\nodejs\node.exe
```

Si aparece una ruta rara, duplicada, vieja o dentro de otra aplicacion, puede haber conflicto de PATH.

## 3. Revisar PATH

En PowerShell:

```powershell
$env:Path -split ';'
```

Confirmar que exista:

```text
C:\Program Files\nodejs\
```

Si no esta:

1. Abrir "Editar las variables de entorno del sistema".
2. Entrar a "Variables de entorno".
3. Editar `Path` del usuario o sistema.
4. Agregar `C:\Program Files\nodejs\`.
5. Cerrar y abrir PowerShell de nuevo.

## 4. Revisar permisos del ejecutable

Ubicar `node.exe`, por ejemplo:

```powershell
Get-Item "C:\Program Files\nodejs\node.exe"
```

Luego:

1. Click derecho sobre `node.exe`.
2. Propiedades.
3. Revisar si aparece boton o checkbox de "Desbloquear".
4. Confirmar que el usuario tenga permisos de lectura y ejecucion.

Tambien probar PowerShell como administrador:

```powershell
node -v
npm -v
```

## 5. Revisar antivirus, Windows Defender o Smart App Control

Si Windows bloquea `node.exe`:

- Revisar “Seguridad de Windows”.
- Revisar historial de proteccion.
- Ver si `node.exe` fue bloqueado o puesto en cuarentena.
- Revisar Smart App Control si esta activo.
- Permitir Node solo si la instalacion viene de una fuente confiable.

Fuente recomendada:

```text
https://nodejs.org/
```

Usar version LTS.

## 6. Reinstalar Node LTS si corresponde

Si `node.exe` sigue con `Acceso denegado`:

1. Desinstalar Node desde “Agregar o quitar programas”.
2. Reiniciar Windows.
3. Descargar Node LTS desde `https://nodejs.org/`.
4. Instalar marcando la opcion de agregar Node al PATH.
5. Cerrar y abrir PowerShell.
6. Probar:

```powershell
node -v
npm -v
where node
where npm
```

## 7. Validacion tecnica del MVP

Cuando Node/npm funcionen, ir a la carpeta del proyecto:

```powershell
cd "C:\Users\DAMIA\OneDrive\Documentos\New project\productos-tendencia"
```

Instalar dependencias:

```powershell
npm install
```

Configurar variables:

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

Editar `apps\api\.env` y confirmar:

```text
DATABASE_URL
JWT_SECRET
PORT
CORS_ORIGIN
```

Ejecutar migraciones y seed:

```powershell
npm run db:migrate
npm run db:seed
```

Levantar API:

```powershell
npm run dev:api
```

En otra terminal, levantar web:

```powershell
npm run dev:web
```

## 8. Checklist posterior

- [ ] `node -v` funciona.
- [ ] `npm -v` funciona.
- [ ] `where node` apunta a `C:\Program Files\nodejs\node.exe` o ruta esperada.
- [ ] `npm install` termina sin errores.
- [ ] Prisma migra contra PostgreSQL real.
- [ ] Seed carga datos iniciales.
- [ ] API responde en la URL definida por `NEXT_PUBLIC_API_URL`.
- [ ] Web abre en la URL definida por el entorno de Next.js.
- [ ] Se pueden probar los 8 escenarios de `OPERACION_MVP.md`.
