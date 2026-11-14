# AgroVision — plan técnico ejecutable

Generado con asistencia de IA (Codex, OpenAI), revisado por el equipo

## Objetivo y definición de terminado

Construir una web de apoyo a decisiones para toda República Dominicana; San Juan conserva el caso de demostración más rico. Compara la rotación actual con dos o tres escenarios usando cuatro pilares: agua y suelo, clima, plagas según reglas IDIAF (sin predicción) y mercado con precios semanales del Ministerio de Agricultura (MA, 2017–2026). El sistema calcula y presenta evidencia; no es un chatbot ni sustituye al agricultor o técnico. La IA de imágenes clasifica observaciones satelitales; la IA generativa solo explica métricas ya calculadas y serializadas como JSON.

La demo terminada debe arrancar localmente y estar desplegada en Vercel, funcionar con datos precalculados sin conexión al proveedor de datos, tener interfaz en español, iniciar en el mapa nacional y permitir seleccionar cualquier provincia o punto terrestre de RD; mostrar el Valle de San Juan y 2–3 fincas demo, y explicar las fuentes, escala, período, confianza y limitaciones de cada métrica. Las alternativas son escenarios ilustrativos, no prescripciones.

**Corte interno:** domingo 15 de noviembre de 2026, 6:00 PM AST. Congelar nuevas funciones, verificar URL desplegada y grabar evidencia antes del corte. Deadline interno, no afirmar que sea el deadline oficial del evento. Revisar en el portal el límite vigente del video: los documentos consultados no lo verifican. Preparar primero una pieza de 30 segundos y extender solo si el portal lo permite.

## Decisiones técnicas

- **Next.js App Router + React + TypeScript + Node.js.** Una aplicación y rutas servidoras reducen integración y simplifican Vercel.
- **Tailwind CSS + shadcn/ui.** Permiten componer rápido paneles, formularios, tabs y estados accesibles sin crear un sistema de componentes desde cero.
- **MapLibre GL JS.** Mapa abierto, estilos propios y capas raster; usar NASA GIBS WMTS para contexto nacional y línea de tiempo. No depender de tokens comerciales. Comprobar la plantilla WMTS, proyección, disponibilidad, atribución y uso de cada capa elegida antes de fijarla. Usar deck.gl solo si se necesita una superposición de parcelas/series densa; para 2–3 polígonos demo, MapLibre basta.
- **Datos precalculados en `web/public/data/`.** JSON/GeoJSON versionado y cacheable para garantizar la ruta de demo aunque fallen red, servicios externos o funciones serverless. No solicitar NASA por cada cambio de UI.
- **Pipeline Python en `scripts/`.** Limpieza, análisis geoespacial, generación de series y clasificación. El runtime web lee sus artefactos; no se necesita API FastAPI para el MVP. Node/route handlers sirven explicación y utilidades de aplicación.
- **ML clásico.** Baseline RandomForest; evaluar LightGBM si las dependencias y muestras lo permiten. Características temporales de NDVI/índices Sentinel-2/HLS; clases de demo: suelo/campo pelado, cultivo, señal compatible con riego y secano. No llamar “riego observado” sin validación: expresar clase y confianza. Entrenamiento/validación por bloques espaciales para evitar fuga entre píxeles vecinos; guardar período, sensor, features, método, métricas y matriz de confusión. Sin muestras fiables, servir una capa prototipo claramente etiquetada o posponer el modelo productivo.
- **SAM es opcional.** Solo incorporarlo para delinear polígonos si una persona lo valida con imágenes; no bloquea el flujo y no se presenta como verdad catastral.
- **Scoring en TypeScript.** Determinista, inspeccionable, puntuación 0–5 por pilar, explicación métrica por métrica, con fuente/escala/confianza. Mantener reglas y umbrales explícitos y versionados; datos ausentes generan `null`/“insufficient data”, nunca imputación silenciosa.
- **Explicación generativa.** Vercel AI Gateway + AI SDK desde una ruta servidor. Enviar exclusivamente JSON de métricas/escenarios ya calculados, sin geometrías precisas, nombres personales ni credenciales. Restringir salida a explicación breve de la comparación, hechos recibidos y límites; validar esquema de salida, límites de tamaño y timeout. La app sigue funcionando si la generación falla.

## Experiencia de usuario

1. **National map:** mapa de República Dominicana, centrado inicialmente en RD ([-70.2, 18.8], zoom 7.3); capas NASA GIBS con toggles (NDVI, lluvia IMERG, SMAP humedad y temperatura) y línea de tiempo. Mostrar leyenda, fecha, producto, resolución y atribución. Las capas solo se habilitan si hay cobertura compatible; alternativa estática/local ante fallo de red.
2. **Valle:** al acercar, mostrar límites aproximados de la zona piloto y 2–3 parcelas/fincas demo GeoJSON. Indicar “demo parcel / approximate boundary”; no almacenar parcelas reales sensibles.
3. **Parcel panel:** historial NDVI con fechas y faltantes visibles, clase ML y confianza si existe, necesidad relativa de agua por rotación, selectores para cultivo previo y condición de riego/secano/no confirmado, y prioridad del usuario (agua, suelo, clima o mercado).
4. **Compare:** rotación actual + tres rotaciones candidatas comparadas en las cuatro tarjetas de pilares. Cada score 0–5 incluye razones, métricas, fuente, fecha/período, unidad, escala espacial, confianza/estado, datos faltantes y riesgo a revisar con técnico. La prioridad cambia orden/resumen de escenarios, no oculta evidencia ni altera los datos fuente.
5. **Explain with AI:** botón opcional “Hablemos de tu parcela” en español, con divulgación visible de texto generado por IA. En ausencia de API key, error o red, mostrar explicación determinista basada en plantillas y las mismas métricas.
6. **Offline/demo:** todos los datos del caso, límites y gráficos incluidos localmente; no poner la ruta principal detrás de NASA GIBS, Gateway ni descargas.

### Casos de rotación

Crear catálogo revisado por equipo a partir de material IDIAF y fuentes locales. Una línea base arroz–habichuela está documentada como ejemplo de contexto, pero validar pertinencia para cada finca demo. Seleccionar dos o tres secuencias candidatas con agrónomo/equipo, incorporando cultivos donde mercado tenga estacionalidad útil (por ejemplo guandul, batata, maíz u hortalizas), evitando secuencias con plagas compartidas documentadas. No inventar validación de cultivo, fechas óptimas ni rentabilidad. Marcar cada escenario como “illustrative, requires local review”.

## Arquitectura y estructura de carpetas

```text
/
├── web/
│   ├── app/
│   │   ├── api/explain/route.ts       # AI Gateway; solo métricas serializadas
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── map/                       # MapLibre, GIBS, controles y timeline
│   │   ├── parcel/                    # panel e historial NDVI
│   │   ├── comparison/                # cuatro pilares y escenarios
│   │   └── ui/                        # shadcn/ui
│   ├── lib/
│   │   ├── scoring/                   # reglas TS, scores y razones
│   │   ├── schemas/                   # validación compartida
│   │   ├── data.ts                    # carga de JSON precalculado
│   │   └── ai.ts                      # prompt acotado/esquema de salida
│   ├── public/data/
│   │   ├── manifest.json
│   │   ├── demo-parcels.geojson
│   │   ├── climate-series.json
│   │   ├── ndvi-series.json
│   │   ├── soil-water.json
│   │   ├── prices-weekly.json
│   │   ├── crop-catalog.json
│   │   ├── rotation-scenarios.json
│   │   └── classifications.geojson
│   ├── package.json
│   └── ... config Next/TS/Tailwind
├── scripts/
│   ├── README.md                      # reproducir ingestión y artefactos
│   ├── ingest/                        # fuentes descargadas manualmente/API
│   ├── clean_prices.py
│   ├── build_climate_series.py
│   ├── build_ndvi_features.py
│   ├── train_landcover.py             # RF; LightGBM opcional
│   ├── validate_landcover.py
│   └── export_web_data.py
├── data/                              # intermediarios; no secretos
│   ├── raw/                           # ignorado por git salvo muestras pequeñas
│   ├── processed/
│   └── model/
├── docs/
│   ├── DATA_SOURCES.md
│   ├── METHODOLOGY.md
│   └── AI_USAGE.md
└── README.md
```

Si el repositorio ya tiene convenciones, conservarlas y mapear esta estructura en vez de duplicar directorios. `web/public/data/` sí es el destino contractual de los datos servidos offline. Los artefactos grandes se reducen a recortes/series del piloto; no subir HDF/GeoTIFF crudos.

## Contratos de datos

Todos los archivos JSON llevan `schemaVersion`, `generatedAt`, `caseId` y metadatos de procedencia. Las fechas son ISO-8601 UTC; unidades SI salvo precios con moneda y unidad originales. Coordenadas GeoJSON WGS84. Usar Zod en TypeScript para validar entrada y salida en tiempo de carga/desarrollo.

```ts
type Provenance = {
  sourceId: string; sourceName: string; url?: string;
  observedAt?: string; periodStart?: string; periodEnd?: string;
  resolution?: { value: number; unit: "m" | "km" | "degree"; note?: string };
  scale: "parcel" | "pixel" | "regional" | "national";
  method: "satellite_observation" | "reanalysis" | "derived_model" |
          "published_rule" | "market_series" | "user_input";
  citation: string; license?: string;
};
type Metric = {
  id: string; label: string; value: number | string | null;
  unit?: string; confidence: number | null; quality: "observed" | "estimated" |
    "preliminary" | "missing";
  provenance: Provenance; limitation: string;
};
type PillarResult = {
  pillar: "water_soil" | "climate" | "pests" | "market";
  score: number | null; scoreScale: { min: 0; max: 5; direction: string };
  summary: string; metrics: Metric[]; rulesApplied: string[];
  missingData: string[]; reviewRisks: string[];
};
type RotationScenario = {
  id: string; label: string; status: "baseline" | "illustrative";
  crops: { cropId: string; seasonLabel: string }[];
  sourceIds: string[]; pillars: PillarResult[];
};
```

Artefactos específicos:

- `manifest.json`: versión, ámbito, fecha de build, lista de archivos, fuentes, checksums opcionales y modo `demo`.
- `demo-parcels.geojson`: polígonos aproximados y `properties` con `parcelId`, nombre demo, municipio/comunidad si se verificó, estado de riego y `demo: true`.
- `climate-series.json`: POWER temperatura/ET0 y GPM IMERG lluvia agregada; cada serie declara cobertura, unidad, resolución y lagunas. POWER no se presenta como parcela y su precipitación tropical se excluye del score principal; IMERG es grilla cercana a 10 km.
- `ndvi-series.json`: NDVI por fecha/parcela o pixel agregado, sensor, cobertura nubosa/faltantes y resolución (HLS/Landsat 30 m según producto). No mezclar sensores sin anotar armonización.
- `soil-water.json`: necesidad de agua estimada por cultivo/ciclo con referencia FAO-56, coeficientes/versionado y supuestos; SMAP como contexto regional (9–36 km), no dato parcelario. Pendiente SRTM y suelo contextual solo si hay cobertura verificable.
- `prices-weekly.json`: producto normalizado, semana, mercado, precio, unidad original y normalizada, fuente, tipo wholesale/retail y estado de limpieza. Resumir estacionalidad por mes/temporada desde 2017–2026. Aclarar Santo Domingo; no equivale a precio al productor. Si el mapeo de unidades no es confiable, marcar preliminar o excluir score.
- `crop-catalog.json`: ID, cultivos, ciclo/ventana (con fuente), Kc/requerimiento de agua si verificado, fijación de N/cobertura solo con sustento, plagas/enfermedades compartidas y citas IDIAF; campos desconocidos quedan `null`.
- `rotation-scenarios.json`: combinaciones y resultados 0–5 por pilar, método/versión de reglas, explicaciones y limitaciones.
- `classifications.geojson` o raster tiled: clase `bare_soil`, `crop`, `irrigation_signal`, `rainfed_signal`, etiqueta de confianza/probabilidad, período, método y estado de validación. Para dataset grande usar GeoJSON solo para polígonos simplificados de demo.

### Semántica del score

Cada función `scoreX(input): PillarResult` es pura, está cubierta por ejemplos de entrada y tabla de umbrales en `METHODOLOGY.md`. Fijar dirección y cortes por métrica antes de mostrar cifras. No inventar escalas universales: donde no exista calibración agronómica, usar rango relativo dentro de los escenarios demo y declararlo. Plagas sin datos IDIAF verificados = score `null`, no “riesgo bajo”. Mercado usa posición estacional relativa de precios mayoristas/minoristas y calidad de limpieza, no ingreso esperado. Exponer los componentes y la confianza por métrica; el agregado del pilar no debe sugerir más precisión que sus datos.

## Fases de implementación con aceptación

### Fase 0 — Asegurar alcance y contrato (sáb. 14 nov., 9:00–10:00)

- [ ] Revisar estructura del repo y crear rama de trabajo.
- [ ] Confirmar zona/comunidad y 2–3 parcelas demo con límites explícitamente aproximados.
- [ ] Elegir 3 rotaciones (línea base + 2 mínimo; ideal 3 alternativas) y marcarlas como escenarios sujetos a revisión local.
- [ ] Acordar los metadatos comunes, cortes de score y claims permitidos.
- [ ] Crear issues/tareas pequeñas con propietario y hora de integración.

**Aceptación:** alcance cabible en una demo de 30 segundos; contrato inicial versionado; ninguna tarea depende de conseguir datos privados o de solicitud gubernamental pendiente.

### Fase 1 — App y mapa operativo (sáb. 14, 10:00–12:00)

- [ ] Crear Next.js App Router con TypeScript, Tailwind y shadcn/ui.
- [ ] Integrar MapLibre con estilo base y vista nacional centrada en RD.
- [ ] Añadir capa GIBS probada y controles de capas + timeline; fallos de red muestran aviso y conservan mapa/caso local.
- [ ] Añadir navegación a Valle de San Juan y cargar GeoJSON de fincas demo.
- [ ] Interfaz, botones y etiquetas de producto en español; fuentes y créditos legibles.

**Aceptación:** `npm run dev` abre aplicación sin errores; toggles/timeline funcionan para al menos una capa habilitada; parcelas demo se seleccionan; capa no disponible queda desactivada con estado claro. Anotar que GIBS requiere conexión y que la ruta offline usa datos locales.

### Fase 2 — Pipeline y datos demo reproducibles (sáb. 14, 12:00–16:00)

- [ ] Preparar datos disponibles para San Juan: clima POWER e IMERG, NDVI/HLS o muestra temporal validada, precios semanales MA 2017–2026 y catálogo agrícola.
- [ ] Limpiar precios: normalizar nombres/unidades con diccionario auditable, conservar original y excluir valores dudosos; generar climatología estacional con muestra y período.
- [ ] Crear scripts Python idempotentes y documentar entrada, comandos, fecha de extracción, fuente y parámetros.
- [ ] Exportar artefactos livianos al `web/public/data/`; cubrir también fallback manual/demo.
- [ ] Validar que cada serie expresa unidad, escala, fuente, fechas, calidad y limitaciones.

**Aceptación:** construir los artefactos desde la muestra versionada con un único comando documentado; UI puede cargarlos sin backend ni red de datasets. Si faltan series, sustituir solo por datos etiquetados como muestra/preliminares; no simular observaciones como reales.

### Fase 3 — Modelo de cobertura y panel de parcela (sáb. 14, 16:00–18:00)

- [ ] Construir features temporales de NDVI Sentinel-2/HLS (mediana, percentiles, amplitud/estacionalidad, faltantes/nubes) por unidades demo.
- [ ] Entrenar baseline RandomForest con etiquetas comprobadas; comparar LightGBM si hay dependencias y tiempo. Particionar train/validation por zona o fecha para reducir fuga espacial.
- [ ] Reportar métricas por clase, matriz de confusión y número/origen de muestras; guardar pipeline y versión.
- [ ] Agregar `bare_soil`, `crop`, `irrigation_signal`, `rainfed_signal`, período y confianza a GeoJSON o tabla de salida.
- [ ] Implementar panel con historial NDVI, necesidad relativa de agua y estatus de clasificación; mostrar faltantes/nubes.
- [ ] Probar SAM solo si delinear una finca demo está bloqueando selección y puede validarse a ojo; saltar de otro modo.

**Aceptación:** un clic en finca abre series y resultados locales; modelo distinguible de observación, confidence visible, metodología enlazada. Si no hay etiquetas suficientes, la clasificación queda explícitamente “prototype / preliminary” y no sostiene afirmaciones de cultivo o riego confirmado.

### Fase 4 — Scoring, comparador y reglas IDIAF (sáb. 14, 18:00–22:00)

- [ ] Implementar funciones TypeScript puras de 0–5 para agua/suelo, clima, plagas y mercado.
- [ ] Añadir traza de cada score: datos usados, fórmula/regla, normalización, confianza, fuente, escala, período y faltantes.
- [ ] Parametrizar prioridad del usuario para ordenar escenarios y redactar el resumen sin alterar métricas base.
- [ ] Comparar baseline con 2–3 alternativas ilustrativas y mostrar todos los pilares lado a lado.
- [ ] Aplicar regla de plagas únicamente a relaciones cultivo/plaga confirmadas en IDIAF u otra fuente citada y revisada. Sin predicción de brotes.
- [ ] Añadir avisos contextuales: POWER ~0.5° regional, IMERG ~10 km, SMAP 9–36 km; precios son mercado de Santo Domingo; NDVI nublado tiene huecos.

**Aceptación:** cambiar finca, riego o prioridad actualiza comparación de forma determinista; cada métrica lleva origen y escala; la falta de evidencia no se convierte en score favorable; el panel dice “scenario, discuss with a local technician”.

### Fase 5 — Explicación con Vercel AI Gateway (dom. 15, 9:00–10:30)

- [ ] Añadir `AI_GATEWAY_API_KEY` únicamente a entorno servidor/local ignorado por git y a Vercel Project Environment Variables.
- [ ] Crear route handler Next.js con AI SDK y Vercel AI Gateway; configurar modelo soportado y parámetros acotados, sin exponer key al navegador.
- [ ] Formar request desde el resultado del motor; aceptar solo schema `ExplanationInput` con métricas/escenarios, nunca contenido de usuario libre ni raster/geometría.
- [ ] Pedir explicación en inglés sencilla con evidencia recibida, incertidumbres y riesgos. No autorizar nuevos números ni recomendaciones fuera del JSON.
- [ ] Validar salida estructurada (Zod), truncar longitud, manejar timeout/rate limit; alternativa de plantilla determinista.
- [ ] Mostrar “AI-generated explanation” y fuente de métricas junto a la explicación; agregar atribución OpenAI/model provider en `docs/AI_USAGE.md` y `README.md` con fecha/modelo cuando se conozca.

**Aceptación:** sin key, el comparador sigue operativo y usa fallback; con key de prueba, solo JSON de métricas llega a Gateway; el texto generado no crea cifras nuevas y siempre se identifica como generado por IA. Nunca registrar key ni payload sensible.

### Fase 6 — Calidad, deploy y demo estable (dom. 15, 10:30–16:00)

- [ ] Revisar accesibilidad básica, responsive, inglés consistente, carga inicial y errores visibles.
- [ ] Comprobar que archivos locales y vistas principales abren offline después de precargar el sitio; describir que las capas GIBS remotas requieren red.
- [ ] Revisar citas/fuentes junto a métricas y en `docs/DATA_SOURCES.md`; agregar método, reglas y confianza a `docs/METHODOLOGY.md`.
- [ ] Desplegar en Vercel, cargar `AI_GATEWAY_API_KEY` solo si el flujo AI está listo y revisar logs para secretos.
- [ ] Probar URL pública en navegador nuevo y dispositivo/pantalla móvil; comprobar selección de parcela, escenarios y alternativa sin AI.
- [ ] Grabar demo de 30s con captura local además de la URL; no incluir testimonio o finca identificable sin consentimiento.

**Aceptación:** URL abre; camino central se completa sin errores; comparador offline y fallback de explicación funcionan; errores de capa remota no bloquean; versión de datos y fuentes son visibles; video breve muestra problema, señal NASA, comparación de pilares y límite/uso responsable.

### Fase adicional — Farmer-first visual UX + voice (14 noviembre 2026)

<!-- Asistencia material: Codex/OpenAI, 2026-11-14; revisión por Frainer pendiente. -->

Esta ampliación autorizada por Frainer prevalece sobre las restricciones previas de piloto exclusivo e interfaz inglesa. No se solicita despliegue en este cambio.

- Cobertura nacional: vista inicial [-70.2, 18.8], zoom 7.3; búsqueda y selector de las 31 provincias y Distrito Nacional; clic en tierra dominicana validado contra límites generalizados geoBoundaries/Natural Earth. Los puntos provinciales son referencias visuales calculadas, no ubicaciones de fincas ni promedios provinciales.
- NASA POWER por punto seleccionado, climatología 2016–2025 y GIBS por ventana del mapa. Caché reproducible de los 32 puntos provinciales y vista inicial en `data/cache/power/` y `web/public/data/power/`; memoria/Next cache para consultas nuevas; caché del navegador para puntos visitados. No sustituir falta de datos por valores de San Juan. Las muestras Landsat y parcelas sintéticas de San Juan siguen como ejemplos opcionales.
- UI en español, móvil primero, botones de al menos 48 px, micrófono de 96 px, iconos grandes de cultivos y pilares, cifras legibles, indicador de agua, semáforos con etiquetas además del color. Fuentes y límites en detalles desplegables, sin tablas densas. Desconocido se muestra como «Sin datos», nunca como verde.
- La comparación FAO-56 es una regla genérica de escenarios ilustrativos aplicable como exploración nacional, sin afirmar aptitud local. Plagas, mercado, suelo y aptitud climática siguen desconocidos donde falte evidencia integrada. No confundir un indicador Kc·día con volumen de riego o ahorro.
- Voz opcional, secundaria a las métricas: AI SDK 7 `experimental_useRealtime` y `gateway.experimental_realtime`, modelo `openai/gpt-realtime-mini`. Gateway soporta audio bidireccional nativo: no hace falta encadenar STT/LLM/TTS. VAD del navegador corta reproducción al detectar voz; VAD de sesión delimita turnos. Transcripción, respuesta en español, interrupción y dos herramientas de solo lectura: `get_parcel_metrics`, `compare_rotations`.
- Único secreto: `AI_GATEWAY_API_KEY` en servidor. Ruta `api/voice/setup` entrega token efímero limitado al modelo (60 s para conectar), nunca la clave. La sesión experimental aplica las instrucciones al conectarse; un token efímero no constituye un sandbox de instrucciones frente a un cliente modificado. Presupuestos Gateway y límites por instancia reducen abuso; no son autenticación global.
- Contexto factual limitado a JSON seleccionado y fuentes locales; los tools reconstruyen selección con esquema estricto. No enviar geometrías ni nombres personales. Respuestas breves con incertidumbre; no predicciones de plagas, rendimiento o rentabilidad. Audio generado por IA identificado.
- Si realtime falla pero existe clave: `streamText` vía Gateway, respuesta leída por frases con `speechSynthesis` del navegador. Si falta clave, Gateway tampoco puede generar texto: usar resumen determinista español + `speechSynthesis`. El navegador no ofrece transcripción local garantizada; sin realtime queda entrada escrita. No fingir conexión a IA ni prometer voz natural homogénea en el fallback.
- Verificación: lint, build de producción en `web/`, pruebas de límites de ubicación, ausencia de claves, herramientas, selección de provincias, móvil y recarga offline. Conversación real y barge-in acústico requieren micrófono físico, permiso y cuenta Gateway habilitada; no declarar validación de campo ni latencia medida sin prueba.

**Fuentes consultadas 2026-11-14:** [Gateway audio / AI SDK 7](https://vercel.com/changelog/realtime-voice-speech-and-transcription-now-supported-on-ai-gateway), [guía de voz realtime](https://vercel.com/blog/realtime-voice-agents-on-ai-gateway), [AI SDK Gateway provider](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway), [NASA POWER climatology API](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/), [geoBoundaries API](https://www.geoboundaries.org/api.html). APIs de voz experimentales; versiones exactas en lockfile.

**Aceptación:** cualquier provincia se selecciona y muestra datos propios o ausencia explícita; vista inicial nacional; comparación y resumen local disponibles sin clave; UI española sin desbordamiento móvil; `npm run lint`, `npm test`, `npm run build` y pruebas de navegador pasan. Publicación de código autorizada, sin ejecutar despliegue.

### Fase 7 — Congelar y entregar (dom. 15, 16:00–18:00 interno)

- [ ] No integrar features nuevas después de 16:00 salvo reparación de bloqueo de demo.
- [ ] Verificar nombre, resumen inglés, URL, README breve en inglés, créditos NASA/MA/IDIAF y AI_USAGE.
- [ ] Revisar límite oficial de video en portal; adaptar la pieza de 30s al máximo permitido y subir/guardar evidencia.
- [ ] Confirmar que solo están publicados datos autorizados y demo; validar recibo/confirmación de envío por canal del equipo.
- [ ] Registrar commit final y enlace desplegado en notas de entrega.

**Aceptación:** material de entrega completo antes del corte interno 18:00 AST; responsable confirma URL, video y recibo. Si el límite oficial de video sigue sin verificarse, no afirmar cumplimiento: exportar una versión <=30s y confirmar duración antes de enviar.

## Guion de video: 30 segundos (si el límite lo permite)

- **0–4s:** mapa: “A farmer in San Juan must plan the next crop with less certain water and changing seasons.” Usar narración propia, sin testimonio inventado.
- **4–9s:** activar lluvia/NDVI/temperatura y mover línea de tiempo; indicar que NASA observa a escalas distintas.
- **9–15s:** acercar a una finca demo; enseñar historial NDVI, confianza y necesidad relativa de agua.
- **15–23s:** comparar rotación base y dos alternativas en agua/suelo, clima, plagas IDIAF y mercado MA semanal; resaltar prioridad del usuario.
- **23–27s:** desplegar “Explain results” o fallback, mostrando aviso de IA y evidencia subyacente.
- **27–30s:** cierre: “Evidence to compare options with a local technician; not a prediction or prescription.”

Capturar pantalla 1080p, cursor claro, sin pausas ni datos personales. El README debe decir que los precios reflejan mercados de Santo Domingo, que no son precio recibido por finca y que plagas no se predicen. El límite de duración oficial de 2026 no está confirmado en las fuentes; verificarlo en el portal antes de exportar versión final.

## Variables de entorno y secretos

```dotenv
# web/.env.example (solo placeholder; archivo real en .gitignore)
AI_GATEWAY_API_KEY=
```

- Usar `AI_GATEWAY_API_KEY` solo en proceso servidor y configuración de entorno de Vercel; nunca `NEXT_PUBLIC_...`.
- `.env.local` no se versiona. No imprimir env en logs, capturas, prompts o diagnósticos.
- Si no se configura key, ocultar o deshabilitar el botón con explicación y usar el fallback. `AI_GATEWAY_API_KEY` es la única variable obligatoria para AI; el mapa GIBS debe operar con configuración pública documentada, no secreto si el servicio no lo exige.

## Commits y coordinación

Commits en inglés, Conventional Commits: `feat: add San Juan parcel comparison`, `fix: preserve offline scenario loading`, `docs: document metric provenance`. Integrar por módulos: UI/mapa, pipeline/datos, reglas/contenido y deploy/video. Cada PR/commit de funcionalidad incluye cómo reproducirlo, fuentes que cambian y captura si afecta UI. Evitar commits gigantes de integración al final.

## Citas de IA y datos

- Encabezado de este documento: declarar asistencia IA y revisión del equipo.
- Mantener `AI_USAGE.md` con herramienta/modelo/fecha si conocidos, secciones generadas, revisión humana y uso concreto. Registrar Vercel AI Gateway/AI SDK y el proveedor/modelo de explicación cuando quede fijado. En la interfaz, rotular texto generado; no atribuir conclusiones al modelo sin evidencia.
- Junto a cada dato incluir fuente, fecha/período, unidad, escala y método. Citar NASA POWER, GPM IMERG, NASA GIBS, Landsat/HLS, SMAP, SRTM, MA precios, FAO-56 y referencias IDIAF pertinentes. Mantener las advertencias de resolución en vista y metodología.
- IA de imágenes y explicación son productos diferentes: el clasificador produce clases/probabilidades a partir de features; el LLM parafrasea JSON de métricas. Ninguno predice brotes, rendimiento o ingresos.

## Riesgos y mitigaciones

| Riesgo | Acción concreta |
|---|---|
| GIBS WMTS o capa no cubre tiempo/producto elegido | Probar temprano un endpoint/producto; verificar CRS/tiles; usar fallback local y no bloquear la demo. |
| Fuentes granulares mezcladas con escala de parcela | Mostrar resolución y escala en cada tarjeta; conservar el mismo valor/región en agregación; no llamarlo medición de finca. |
| Nubes o huecos en HLS/NDVI | Exponer máscaras/fechas faltantes, resumir con cobertura y no rellenar sin etiqueta. |
| Muestras escasas o etiquetas discutibles | Baseline visible como preliminar o retirar clase; no reclamar exactitud; SAM no sustituye revisión. |
| Unidades/precios inconsistentes | Preservar valor/unidad original, usar tabla de equivalencias revisada, excluir registros irresolubles; precio no es de finca. |
| Reglas de plagas incompletas | Score desconocido; incluir solo relaciones IDIAF citadas; pedir revisión local. |
| LLM lento, caro o indisponible | Timeout/token limit, botón opcional, cache/fallback determinista; request solo JSON pequeño. |
| Datos o API no disponibles | Artefactos precalculados y paquete de caso en `public/data`; operación principal no requiere fetch externo. |
| Sobrealcance antes del corte | Priorizar el caso San Juan, tres escenarios, cuatro pilares y deploy; quitar SAM, nuevas fuentes y analítica no esencial. |
| Alegaciones de impacto sin evaluación | Comunicar potencial y limitaciones; no prometer ahorro, rendimiento, mejora de suelo ni impacto medido. |

## Recortes si falta tiempo

Orden de recorte, manteniendo el flujo de extremo a extremo:

1. Quitar deck.gl, SAM, login, sensores, proyección climática, gráficas extra y capas GIBS no estables.
2. Reducir el modelo a baseline RandomForest o una capa prototipo etiquetada si no hay etiquetas; enseñar NDVI y confianza antes que una clasificación dudosa.
3. Mantener para la demo una serie climática y una serie NDVI pequeña, con atribución; no descargar nuevos datasets durante integración.
4. Si precios no están suficientemente limpios, mostrar serie marcada `preliminary` y no puntuar mercado o puntuar `null`; nunca inventar normalización.
5. Si reglas IDIAF son incompletas, mostrar lista de relaciones verificadas y “insufficient evidence”; plagas continúa como pilar visible sin predicción.
6. Si Gateway falla, usar explicación plantilla; no recortar el scoring ni las tarjetas de evidencia.
7. Mantener 2 fincas demo en vez de 3, pero conservar línea base y al menos dos rotaciones alternativas para cumplir la comparación requerida por el reto.

## Lista final de aceptación

- [ ] Next.js App Router, React, TypeScript, Node, Tailwind, shadcn/ui y Vercel como stack de entrega.
- [ ] Mapa nacional MapLibre con capas GIBS habilitadas, toggles y timeline; aproximación local funcional si falla el proveedor.
- [ ] Valle de San Juan con 2–3 parcelas demo y límites de naturaleza demostrativa.
- [ ] Panel con NDVI histórico, necesidad de agua, selector de prioridad y comparación de 3 o 4 secuencias.
- [ ] Cuatro scores 0–5 o `null`, cada métrica con fuente/escala/confianza/calidad/fecha.
- [ ] Plagas solo mediante relaciones IDIAF verificadas, explícitamente sin predicción.
- [ ] Mercado basado en precios MA semanales 2017–2026, explicando mercado de Santo Domingo y limpieza/preliminaridad.
- [ ] Scripts Python reproducibles y JSON/GeoJSON precalculados en `web/public/data/`.
- [ ] Clasificador NDVI/Sentinel-2/HLS con validación o etiqueta de prototipo; SAM solo si aporta.
- [ ] AI SDK vía Vercel AI Gateway recibe JSON de métricas únicamente; env `AI_GATEWAY_API_KEY` servidor; divulgación y fallback.
- [ ] UI en español, commits Conventional Commits en inglés y `AI_USAGE.md` con revisión humana.
- [ ] Demo local sin red de datos externos, deploy Vercel validado y guion/video adaptado al límite oficial verificado.
