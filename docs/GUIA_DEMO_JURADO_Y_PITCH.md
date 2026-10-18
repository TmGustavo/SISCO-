# Kaluz Digital — Guía de demo y pitch (MVP)

## Mensaje principal
"Kaluz Digital facilita una transición tecnológica progresiva: las personas se comunican en lenguaje cotidiano y la inteligencia artificial organiza las solicitudes para que la empresa las revise desde una PWA."

## Qué está funcionando en este MVP
- Gemini V2 real: clasificación de intención, preguntas de seguimiento, memoria en la conversación y extracción de un JSON.
- Chat web de demostración con estilo de mensajería y opciones fáciles.
- Crear un borrador con estado pendiente desde el propio chat y mostrarlo en el módulo Solicitudes del panel (mismo navegador y origen).
- Acciones de revisión del panel existentes, sujetas a su propio comportamiento actual.

## Qué NO se ha completado
- Integración autorizada de WhatsApp Cloud API. Twilio Try out WhatsApp no entrega nuestras respuestas generativas libres en este modo de prueba.
- Persistencia central en Supabase: la demostración utiliza localStorage.
- Acceso y sincronización entre dispositivos diferentes; roles y permisos reales del dueño.
- Verificación documental automática, reservas, pagos, localización GPS en vivo.

## Demo de 90 segundos con información ficticia
1. Entra en `/demo-whatsapp` y elige `Soy conductor` → `Tengo un auto y quiero registrarlo`.
2. Escribe `Tengo un Toyota Yaris de 4 asientos. Trabajaría por Huancayo y El Tambo en las mañanas.`
3. Escribe `Mi nombre de prueba es Carlos Demo y puedo trabajar de lunes a sábado. ¿Qué papeles necesito?`
4. Gemini conserva la información, explica los documentos de forma sencilla y la ficha queda lista.
5. Haz clic en `Enviar solicitud para revisión` y luego en `Ver solicitud en el panel del dueño`.
6. En la bandeja de Solicitudes muestra la nueva ficha con estado pendiente. Reitera que NO está aprobada ni hay documentos verificados.
7. Si hay tiempo, reinicia el chat y prueba `Soy cliente` → `Quiero hacer turismo` con nombre ficticio, destino, fecha y número de pasajeros.

## Por qué tiene impacto
Problema: el registro disperso y la atención manual consumen tiempo y dificultan responder oportunamente a potenciales clientes y afiliados.
Solución: la conversación captura información básica y la convierte en borradores estructurados para atención y seguimiento humano.
Impacto comercial esperado, aún no medido: responder mejor solicitudes de afiliación, alquiler y turismo y reducir el abandono de consultas. Medir en piloto: tiempo de primera respuesta, porcentaje de consultas convertidas a solicitud y reservas confirmadas.

## Frase para explicar la simulación sin confundir al jurado
"Nuestro agente usa Gemini en tiempo real. Aquí simulamos la interfaz conversacional que se conectará a WhatsApp, porque el canal empresarial requiere autorización y habilitación. La ficha resultante sí se registra funcionalmente en el panel local de demostración; la sincronización multiusuario será la siguiente etapa con Supabase."

## Para no romper el repositorio del compañero
- Trabaja únicamente en `feature/agente-ia`.
- Modifica archivos del simulador y la línea precisa del prompt, nada del panel administrativo.
- Revisa `git status` y `git diff` antes de subir cambios.
- Nunca subas `.env.gemini.local`, tokens de Twilio o ngrok.
