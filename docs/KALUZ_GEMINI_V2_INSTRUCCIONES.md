# Kaluz Gemini V2 — memoria + requisitos reales

## Archivos incluidos

- `supabase/functions/_shared/kaluz-agent.mjs`: conocimiento, IA, memoria y normalización.
- `scripts/chat-gemini.mjs`: prueba local con memoria en RAM.

### Cómo instalar

1. **Haz copia** de los dos archivos correspondientes en tu repositorio si los modificaste.
2. Copia las carpetas incluidas en el ZIP sobre la raíz del proyecto (junto a package.json). No reemplaces otras partes del repositorio ni el archivo `supabase/functions/ai-extract/index.ts` de tu compañero.
3. Conserva `.env.gemini.local` en el proyecto; no viene en este ZIP ni se debe subir a GitHub.
4. Ejecuta `node --env-file=.env.gemini.local scripts/chat-gemini.mjs`.
5. Escribe `nuevo` para probar otro usuario sin mezclar la información; `salir` para terminar.

### Prueba recomendada

- Turno 1: `Hola, soy conductor nuevo, tengo un Toyota Yaris de 4 pasajeros, trabajo por Huancayo y El Tambo en las mañanas.`
- Turno 2: `Me llamo Carlos Mendoza y estoy disponible de lunes a sábado. ¿Cuáles son los requisitos para afiliarme?`
- Verifica `capacidad_vehiculo: "4"`, `pasajeros: ""`, `disponibilidad_dias: "lunes a sábado"`, `disponibilidad_turno: "mañanas"`, `fecha: ""`. Debe informar requisitos sin pedir copia de DNI por chat.
- Escribe `nuevo` y prueba `Deseo un tour a Ocopa para cuatro personas`. La información del conductor anterior no debe pasar al turista.

### ¿Qué requisitos están incluidos?

**Foto: Habilitación del conductor.** Dos copias de DNI y licencia, dos declaraciones juradas firmadas con huella, solicitud de habilitación.

**Foto: Requisitos para el pago de tarjeta de circulación.** Dos copias de tarjeta de propiedad, DNI vigente del propietario/encargado, licencia, AFOCAT o SOAT de servicio público/taxi vigente, revisión técnica vigente y certificado de gas/GNV vigente; una copia de recibo de agua o luz. Consultar con Kaluz aplicabilidad de gas/GNV y demás condiciones.

**Comunicación del representante.** Para precalificación mencionó licencia, récord de conductor y certificado de antecedentes; no se precisó el tipo de certificado de antecedentes.

Esta base NO verifica legalidad, vigencias, certificados, pagos ni aprobación.

### Cómo conectar posteriormente con Supabase

Tu compañero puede integrar la función `analizarMensaje` en su Edge Function. En el servidor, debe recuperar de manera autenticada la sesión del usuario y suministrar su estado anterior. Ejemplo de llamada (ilustrativo, NO reemplazar el código ya subido):

```js
const resultado = await analizarMensaje({
  mensaje,
  historial,
  estadoPrevio: estadoGuardadoDeEsaSesion,
  apiKey: Deno.env.get('GEMINI_API_KEY')
});
```

**IMPORTANTE:** La memoria del terminal solo dura hasta cerrar el proceso. Para que persista en la PWA, guardar el JSON por conversación en Supabase detrás de autenticación y políticas RLS. Los resultados se deben validar en el backend antes de escribir en tablas reales. No confiar en un `listo_para_registrar` enviado por el cliente. Tampoco poner la clave de Gemini en el frontend.

`listo_para_revision` significa únicamente borrador completo para revisión humana; `listo_para_registrar` permanece false hasta que la documentación y autorización se validen fuera del chat. La API no debe aprobar por sí sola afiliaciones, tarjetas ni reservas.
