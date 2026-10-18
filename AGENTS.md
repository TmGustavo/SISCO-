# Kaluz Digital

- La aplicación Vite vive en la raíz; no crear paquetes ni workspaces adicionales.
- Organizar cada capacidad en `src/features` y rutas en `src/app/routes`.
- Mantener los datos simulados hasta que el equipo apruebe la integración con Supabase.
- Nunca incluir secretos, claves `service_role` ni llamadas de IA desde el navegador.
- Antes de entregar cambios, ejecutar `npm run lint`, `npm run typecheck` y `npm run build`.
