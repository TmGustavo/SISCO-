# Casos de prueba iniciales

| Caso | Pasos | Resultado esperado |
| --- | --- | --- |
| Rutas administrativas | Abrir cada ruta `/admin/*` | Se muestra el módulo correspondiente sin errores. |
| Turismo | Abrir `/turismo` y seleccionar solicitar | Se muestra catálogo y navega a `/solicitar`. |
| Conductor | Abrir `/conductor` | Se muestra el portal base con datos simulados. |
| Reservas | Abrir `/mis-reservas` | Se muestra el resumen simulado del cliente. |
| PWA | Generar producción | Se crean manifest y service worker. |
| Datos simulados | Navegar sin variables de entorno | No se realiza conexión a Supabase. |
