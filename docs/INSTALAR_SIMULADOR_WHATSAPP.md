# Kaluz Digital: simulador WhatsApp → Gemini V2 → PWA del dueño

**Modo hackathon:** integración local demostrable. **WhatsApp no está conectado. Supabase no está conectado.**
Gemini sí responde mediante la API oficial usando la clave privada de tu propia computadora.

## 0. Antes de empezar

- Debes estar en el repositorio actualizado, rama `feature/agente-ia`.
- Debe existir y funcionar el archivo `supabase/functions/_shared/kaluz-agent.mjs` (Gemini V2).
- Debes tener `.env.gemini.local` con `GEMINI_API_KEY=...`, y estar ignorado por Git.
- Node.js 22 o posterior.
- No copies la clave privada al código de React ni a GitHub.
- Usa personas, vehículos y datos **ficticios**. Los datos de ejemplo del repositorio no deben tratarse como registros reales de Kaluz.

## 1. Instalar el ZIP

Copia **las carpetas `src`, `scripts` y `docs`** del ZIP en la raíz de `SISCO-`, junto a `package.json`.
Los archivos añadidos son nuevos: `WhatsAppDemoPage.tsx`, `waDemoTypes.ts`, `waDemoMapper.ts`, `kaluz-wa-demo-api.mjs`, `instalar-wa-demo.mjs` y esta guía. No sobrescriben tu IA V2 ni el panel del compañero.

## 2. Conectar la página al router (solo una vez)

Abre la terminal de VS Code **dentro de `SISCO-`** y ejecuta:

```powershell
node scripts/instalar-wa-demo.mjs
```

El script modifica `src/app/routes/index.tsx` para agregar **un import y una ruta**. Conserva todas las demás páginas.
Si ya estaba instalada, no duplica las líneas.

Si lo prefieres manualmente, en `src/app/routes/index.tsx` añade:

```tsx
import { WhatsAppDemoPage } from '../../features/ai/WhatsAppDemoPage'
```

Y dentro de `const routes = [` antes de la ruta `'*'`:

```tsx
{ path: 'demo-whatsapp', element: <WhatsAppDemoPage /> },
```

## 3. Terminal 1: servidor local seguro que usa Gemini V2

```powershell
node --env-file=.env.gemini.local scripts/kaluz-wa-demo-api.mjs
```

Se espera: `SIMULADOR API: http://127.0.0.1:8789/api/salud`.

**No cierres esta terminal.** El servidor usa `GEMINI_API_KEY` como variable de entorno, no la envía al navegador. Solo escucha en `127.0.0.1`; no es una API de producción.

## 4. Terminal 2: PWA React

```powershell
npm run dev
```

Si aún no instalaste dependencias, primero ejecuta `npm install`.
Abre la URL de Vite **en la misma computadora**. Por ejemplo:

`http://localhost:5173/demo-whatsapp`

Si Vite usa 5174 u otro puerto, usa el que te muestre.

## 5. Demo recomendada para el jurado (dos minutos)

1. Ve a `/demo-whatsapp`. Verás el banner **Simulador de WhatsApp**.
2. Pulsa **Soy conductor** → **Afiliar mi vehículo**.
3. Responde en dos mensajes separados, con datos FICTICIOS:
   - `Quiero afiliar un Toyota Yaris de 4 asientos. Trabajo en Huancayo y El Tambo por las mañanas.`
   - `Mi nombre para esta prueba es Carlos Demo y estoy disponible de lunes a sábado. ¿Qué requisitos debo presentar?`
4. Verifica que el panel derecho reconoce nombre, vehículo, zonas y disponibilidad. Cuando no falten campos mínimos, haz clic en **Guardar borrador de demo**.
5. Pulsa **Abrir panel del dueño**. Abre `/admin/solicitudes` desde **el mismo origen y navegador**. La nueva solicitud aparece con estado **pendiente** y el detalle indica que proviene de la IA.
6. Desde ese panel, usa **Revisar / Observar / Aprobar** para demostrar la decisión humana. Para un flujo real, esos cambios deben quedar auditados en la base de datos y sujetos a autorización.
7. Regresa al simulador, pulsa el botón de **Nueva conversación** para limpiar la memoria antes de hacer la demostración con otro usuario.

**Alternativa cliente:** **Soy cliente** → **Reservar turismo**. Ejemplo: `Soy Lucía Demo; quiero viajar con 4 personas al Convento de Ocopa el 2026-10-20` (fecha ficticia para el ejemplo). Guarda el borrador y comprueba que aparece como `turismo`.

## 6. Qué hace y qué NO hace

| Parte | Estado de esta entrega |
| --- | --- |
| Interfaz similar a WhatsApp | Simulada en la web; NO utiliza Meta ni envía mensajes reales |
| Comprensión y memoria | Gemini V2 real; conserva el contexto mientras el componente esté abierto |
| Requisitos de afiliación | Provienen del módulo Gemini V2 existente; sujetos a verificación con la empresa |
| Ficha estructurada | Real, basada en respuesta de Gemini y adaptador tipado |
| Guardar solicitud | REAL para el navegador **local** (`localStorage`) |
| Panel de administración | Reutiliza `/admin/solicitudes` existente del compañero |
| Sincronización entre celular/PC | NO; requiere backend compartido como Supabase |
| WhatsApp Cloud API real | NO, bloqueado por estado de cuenta y verificación empresarial |
| GPS e IA documental | Fuera del alcance de esta integración |
| Taxi | Se puede conversar, pero NO se guarda: el panel aún no tiene la categoría `taxi` |

No se recopilan DNI, números de documentos, teléfonos ni archivos en la conversación de demostración. No usar con información personal real.

## 7. Solucionar errores habituales

- `ERR_CONNECTION_REFUSED`: inicia Terminal 1 y comprueba `http://127.0.0.1:8789/api/salud`.
- `Gemini no respondió`: lee el error de la terminal de Node; comprueba modelo, cuota y clave.
- `No se encuentra el archivo .env.gemini.local`: crea el archivo real en la raíz sin compartirlo.
- Página 404: ejecuta `node scripts/instalar-wa-demo.mjs`, reinicia Vite y abre `/demo-whatsapp`.
- No aparece en `/admin/solicitudes`: guarda con el botón y usa **el mismo navegador y URL base** (`localhost` y `127.0.0.1` NO comparten `localStorage`). Si el panel ya estaba abierto en la misma pestaña, navega de nuevo; si estaba abierto en otra, recarga.
- `npm run build` falla: copia el error de TypeScript sin revelar secretos y revísalo.
- Si tu causa modificó de nuevo `src/features/solicitudes/model.ts` o el router, comprueba integridad antes de integrar.

## 8. Guardar avances sin incluir la clave privada

```powershell
git status
git diff -- src/app/routes/index.tsx
git add src/features/ai/WhatsAppDemoPage.tsx src/features/ai/waDemoTypes.ts src/features/ai/waDemoMapper.ts scripts/kaluz-wa-demo-api.mjs scripts/instalar-wa-demo.mjs docs/INSTALAR_SIMULADOR_WHATSAPP.md src/app/routes/index.tsx
git diff --cached --name-only
git commit -m "feat: simulador conversacional WhatsApp con Gemini y solicitudes locales"
```

No ejecutes `git add .` hasta comprobar que `.env.gemini.local` está ignorado.

## 9. Evolución futura (cuando haya autorización)

Reemplazar el simulador de mensajes por **Meta WhatsApp Cloud API → webhook**. Reusar `analizarMensaje` detrás de un servidor autorizado. Guardar historial y solicitudes en Supabase/PostgreSQL con autenticación, controles de acceso, auditoría, protección de datos, revisión humana, antifraude y límites de uso. Modificar el panel para leer de Supabase. No afirmar integración de producción hasta que realmente se despliegue y pruebe.
