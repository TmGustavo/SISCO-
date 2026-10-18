import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * La integración se mantiene desactivada durante la etapa de datos simulados.
 * El cliente se inicializará después de aprobar las variables y el proyecto.
 */
export const isSupabaseConfigured = false
export const supabase: SupabaseClient | null = null
