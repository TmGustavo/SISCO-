// Ajuste acotado del prompt del agente: no modifica modelos, esquema JSON ni los archivos del compañero.
import { readFileSync, writeFileSync } from 'node:fs'
const archivo = 'supabase/functions/_shared/kaluz-agent.mjs'
const texto = readFileSync(archivo, 'utf8')
const viejo = '- Si piden requisitos, distingue «habilitación del conductor», «tarjeta de circulación» y «precalificación». Si no se sabe qué trámite, pregunta cuál necesita.'
const nuevo = '- Cuando pregunten por requisitos, usa palabras sencillas y explica lo necesario según lo que quieran hacer. Mantén internamente las diferencias entre precalificación, habilitación del conductor y tarjeta de circulación, pero NO exijas al usuario conocer esos términos. Si no se sabe el caso, pregunta: «¿Quieres comenzar a trabajar como conductor, registrar tu vehículo o terminar un trámite que ya iniciaste?». Luego explica qué significa el procedimiento correspondiente. No des tres listas completas salvo que el usuario pida compararlas.'
if (texto.includes(nuevo)) {
  console.log('El lenguaje sencillo ya estaba activado. No modifiqué nada.')
} else if (texto.includes(viejo)) {
  writeFileSync(archivo, texto.replace(viejo, nuevo), 'utf8')
  console.log('Listo: Gemini explicará los requisitos en lenguaje sencillo.')
} else {
  console.error('No encontré la instrucción original esperada. No modifiqué el agente; revisémoslo manualmente.')
  process.exitCode = 1
}
