<!-- AI: Codex/OpenAI, 2026-11-14; revisión de Frainer pendiente. -->
# Método de la demo, versión 1

**Actualización 14-11-2026:** la vista principal y la herramienta de comparación de voz usan ahora [pilares derivados y referencias preliminares](12_farmer_pillars.md). Las secciones siguientes conservan el método histórico de `getComparison` y `/api/explain`; no describen los nuevos scores.

El flujo usa observaciones/reanálisis reales y reglas publicadas, con confianza local limitada. No hay un modelo entrenado ni exactitud medida. No se predicen rendimiento, brotes, ingresos ni fechas óptimas.

## Señal Landsat

Seis escenas de 2024, elegidas por menor nubosidad de escena en cada bloque de dos meses, en tres centros de áreas sintéticas. Los valores originales y URLs están en `data/cache/landsat_point_sample.json`. No se asume que menor nubosidad de escena implica un píxel despejado. Se rechazan valores nulos, QA_PIXEL bits 0–5 o 7, saturación red/NIR y oclusión QA_RADSAT bits 3, 4, 11. Aplicar reflectancia = DN × 0.0000275 − 0.2 antes de NDVI = (NIR − red)/(NIR + red); rechazar reflectancias negativas o denominador no positivo. Fuentes USGS y escala en `DATA_SOURCES.md`.

Umbrales **propios, exploratorios y no calibrados**: NDVI <0.2 = baja vegetación; 0.2≤NDVI<0.4 = ambiguo; ≥0.4 = señal de vegetación. No son etiquetas confirmadas de suelo desnudo, cultivo ni riego. Las probabilidades/confianza numérica quedan null porque no hay etiquetas ni validación. El estado de clasificación riego/secano es null. Para entrenar RF con validez se necesitan muestras etiquetadas y validación por zona/fecha; no se entrenó contra etiquetas inventadas o contra los propios umbrales. No se rellenan huecos ni se convierten seis fechas en meses completos de campo pelado.

## Agua y suelo

Único score numérico: **proxy de demanda relativa por coeficientes**, componente parcial del pilar agua/suelo, sin afirmar salud de suelo. Cuatro cultivos con Kc y duraciones de ejemplo FAO-56, tablas 11–12, conservando región/supuestos en `crop-catalog.json`. La integral de la curva lineal por etapas es:

`KcDays = Lini·Kini + Ldev·(Kini+Kmid)/2 + Lmid·Kmid + Llate·(Kmid+Kend)/2`

Se suman ambos cultivos por secuencia. Unidad: Kc·día. No se multiplica por ETo; no se estima mm de agua, percolación de arroz, lluvia efectiva, riego, ahorros ni balance hídrico. Duraciones genéricas de regiones distintas introducen incertidumbre. La comparación de secuencias de duración distinta es ilustrativa; no representa un año agrícola ni permite concluir eficiencia. No recibe un mejor score por declarar riego/secano.

Score relativo = `5·(maxProxy−proxy)/(maxProxy−minProxy)`, redondeado a 1 decimal y acotado [0,5]. Si todos los proxies son iguales, score null. Es un rango relativo entre estos tres escenarios; no escala agronómica universal. 0 = mayor proxy de la muestra; 5 = menor proxy. Confianza **baja**, sin porcentaje inventado. Ver fuentes/época/escala junto a cada score.

Ejemplos de verificación: mínimo →5, máximo →0, punto medio →2.5; rango degenerado →null. El código puro tiene pruebas en `web/lib/scoring.test.ts`.

## Clima, plagas y mercado

POWER proporciona contexto histórico regional por mes, igual para todas las áreas, no una predicción ni tolerancia de cultivos. Se validaron tres días contra la API. PRECTOTCORR se muestra con limitación tropical y no participa en scores. Sin validación de ventanas/tolerancias, el score clima queda null. La muestra GIBS IMERG es visual, no una serie de lluvia.

Plagas queda null: faltan relaciones hospedero/plaga revisadas. Mercado queda null: no hay muestra MA limpia incluida; los precios futuros de Santo Domingo no serían precios en finca. Suelo carece de datos locales y no recibe score por ser desconocido.

La prioridad agua ordena de mayor a menor score del proxy. Las otras prioridades mantienen el orden base y explican por qué no hay ranking; no ocultan evidencia ni convierten faltantes en valores favorables. Seleccionar área cambia NDVI; seleccionar mes cambia contexto regional; riego es una declaración del usuario sin impacto artificial en los datos.

## Explicación opcional y offline

`POST /api/explain` acepta solo prioridad, mes y categoría de riego; rechaza campos extra y más de 2 KB. El servidor reconstruye métricas verificadas y las envía a AI SDK/Vercel AI Gateway, modelo `openai/gpt-4.1-mini`. La salida estructurada Zod solo selecciona IDs de afirmaciones permitidas; se agregan siempre límites, prioridad, revisión humana y definición del proxy. No puede introducir cifras ni texto libre. Se identifica como selección de evidencia asistida por IA. Timeout 10 s, límite 180 tokens, fallback de plantilla al faltar clave/error. Clave solo servidor; nunca geometrías o información personal.

El navegador puede usar la misma plantilla sin servidor ni red. Tras la primera visita online, un service worker guarda HTML, JS/CSS/chunks dinámicos y datos. Se prueba recarga con red completamente deshabilitada. Instalación inicial desde una URL nunca visitada requiere red; localmente `npm start` sirve el caso sin internet. Timeline GIBS online es opcional y conserva la imagen cacheada bajo errores. No hay base de datos ni despliegue realizado en esta tarea.

## Derivado de mercado preparado para integración

Actualización asistida por Codex/OpenAI, 14-11-2026; revisión de Frainer pendiente. La rama de envío aporta ahora precios MA limpios como artefacto independiente en `data/derived/market_prices.json`; ver [método reproducible](../scripts/market/README.md). La afirmación anterior de falta de muestra limpia aplica a la demo web previa: esta contribución no modifica su scoring ni integra el JSON. Los índices preliminares conservan faltantes y no justifican ingresos ni calendario óptimo.
