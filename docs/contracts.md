# Contratos de integración

Durante la etapa actual, el frontend usa datos simulados y no realiza llamadas a Supabase.

| Función prevista | Entrada esperada | Responsabilidad |
| --- | --- | --- |
| `create-application` | Datos de afiliado o conductor | Validar y registrar una postulación. |
| `create-service-request` | Origen, destino, fecha y contacto | Registrar solicitud o reserva. |
| `ai-extract` | Documento autorizado | Extraer datos mediante API protegida. |
| `wa-webhook` | Evento de proveedor | Validar y procesar webhook. |

Las funciones usarán autenticación, validación y secretos de entorno cuando sean aprobadas. Ninguna clave de servicio se expone al navegador.
