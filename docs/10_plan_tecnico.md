<!-- Asistencia de IA: Codex (OpenAI), 14-11-2026. Revisado por Frainer; ver AI_USAGE.md. -->

# 10. Plan técnico ejecutable

## Objetivo y decisiones

Construir una aplicación web en inglés para explorar, en el Valle de San Juan, una rotación declarada y dos alternativas ilustrativas. La herramienta apoya al productor y al técnico, presenta evidencia y brechas, y no emite una prescripción agronómica.

Stack obligatorio: Next.js App Router + TypeScript, React, Node.js, Tailwind CSS, shadcn/ui, Vercel y Vercel AI Gateway mediante AI SDK para un explicador secundario. El clasificador de imágenes sigue siendo el núcleo de IA; el LLM no clasifica, puntúa ni recomienda.

Decisiones recomendadas:

- **Mapa:** MapLibre GL JS para mapa base/controles y deck.gl para capas raster/vectoriales interactivas. Usar NASA GIBS WMTS únicamente cuando el estilo/producto/fecha estén comprobados; la demo principal usa capas precalculadas locales. GIBS es una opción visual, no dependencia del flujo offline.
- **Datos:** JSON, GeoJSON y COG estáticos bajo `public/data/` versionados para el paquete pequeño de demo. Reservar Vercel Blob para COG/archivos grandes que eleven el tamaño del repositorio o necesiten actualización independiente; documentar que Blob requiere conectividad y conservar un fixture local compacto.
- **Pipeline:** Python en `scripts/` produce datos estáticos reproducibles desde fuentes descargadas/caché. No hay llamadas de proveedor al abrir el mapa.
- **Clasificador:** comparar RandomForest y LightGBM sobre atributos de series temporales NDVI (Landsat/HLS armonizado cuando corresponda). Seleccionar por validación espacial/temporal documentada; sin muestras etiquetadas y prueba suficiente el resultado se marca prototipo/no validado y no alimenta una afirmación categórica. “Riego/secano” es una inferencia de patrón, no disponibilidad actual de agua.
- **Parcelas:** opcionalmente inferir segmentos con SAM, sujeto a licencias, capacidad y evaluación. Sin límites validados, mostrar huellas de demostración anonimizadas como polígonos aproximados, no límites catastrales ni finca identificable.
- **Puntajes:** motor determinista TypeScript, escala 0–5 por pilar, componentes y explicación auditable. Sin datos suficientes, el resultado es `null`/“insufficient data”, nunca cero ni imputación silenciosa.
- **Explicador:** AI SDK + Vercel AI Gateway en route handler Node. Solo recibe el JSON ya calculado y sus fuentes/límites. La salida se trata como texto no confiable, no se ejecuta, y falla con gracia a explicación por plantilla.

## Alcance funcional

- Vista nacional de República Dominicana con mapa de fondo y capas conmutablemente disponibles: NDVI, lluvia IMERG, humedad SMAP y temperatura. Cada capa expone leyenda, fechas, unidad, resolución/escala, atribución, calidad y limitaciones. Indicadores visibles distinguen producto NASA, reanálisis, regla y dato declarado.
- Línea de tiempo que selecciona únicamente fechas/períodos presentes en el manifiesto local. El selector no debe sugerir continuidad donde haya huecos.
- Zoom al Valle de San Juan y visualización de parcelas/clusters detectados, con clase, período analizado, confianza y advertencia de validación.
- Panel en inglés para una parcela seleccionada: historial NDVI, necesidad relativa/estimada de agua con método y supuestos, fuente/fecha/escala/calidad; selector de prioridad (water, soil, climate, pest rotation, market context).
- Comparador de tres rotaciones: baseline declarada por usuario + dos escenarios documentados, cuatro pilares y desglose de puntaje de 0 a 5. Beneficios potenciales, trade-offs, incertidumbres y datos faltantes. Nunca mostrar rentabilidad garantizada, predicción de cosecha/plagas ni fecha óptima universal.
- Dos o tres casos de fincas de demostración con geometrías sintéticas o anonimizadas, identificadas en UI como `Demo field`; ubicación aproximada no enlazable a una persona.
- Tarjeta de plagas solo con reglas/referencias IDIAF revisadas. Mercado usa series de precios mayoristas/minoristas de Santo Domingo como contexto, no como precio en finca; ocultar o marcar preliminar si la limpieza no está aprobada.
- Modo sin conexión: el flujo de demo y las capas/casos precargados abren desde archivos locales. El explicador, mapas base remotos y fuentes externas no son necesarios para mostrar el flujo central.

## Estructura objetivo

```text
app/
  layout.tsx
  page.tsx
  globals.css
  api/explain/route.ts
components/
  map/ (MapView, LayerControls, Timeline, Legend)
  field/ (FieldPanel, NdviHistory, EvidenceCard)
  rotations/ (RotationComparator, PillarScore, PrioritySelector)
  ui/ (shadcn/ui components)
lib/
  schemas/ (Zod contracts)
  data/ (local manifest/loaders)
  scoring/ (four-pillar engine, rules, weights)
  explain/ (prompt, output validation, fallback)
  attribution/ (source registry)
public/data/
  manifest.json
  fields.geojson
  demo/*.json
  rasters/*.json | *.tif (as practical)
scripts/
  ingest/ (NASA and local source adapters)
  features/ (NDVI time series)
  train/ (split, train, evaluate, export)
  build_demo.py
data/cache/ (ignored source cache; never secrets or personal coordinates)
models/ (model card, metrics, class mapping; weights only if license/size permits)
docs/ (source cards, validation notes, demo runbook)
```

Use server components for static data and page framing; client components only for map and interactive controls. Keep scoring in a shared, pure TypeScript module called by server rendering and interaction state. No separate FastAPI service is required for the MVP; Python is an offline build pipeline.

## Contratos de datos

Todos los contratos se validan en ingestión y runtime con Zod (frontend) y JSON Schema equivalente/exportado para los artefactos Python. Fechas ISO-8601 UTC; CRS GeoJSON EPSG:4326; raster incluye CRS y affine transform. Campos de confianza usan `[0,1]`; `null` expresa ausencia. No derivar coordenadas exactas de productores.

### `MetricRecord`

```ts
type EvidenceKind = "observation" | "reanalysis" | "agronomic_rule" | "declared" | "derived_model";
type MetricRecord = {
  id: string;
  value: number | string | null;
  unit: string;
  period: { start: string; end: string; cadence?: string };
  source: { name: string; organization: string; url?: string; version?: string; accessedAt?: string };
  spatial: { scale: string; resolution?: string; geometryId?: string };
  evidenceKind: EvidenceKind;
  quality: { status: "verified" | "preliminary" | "not_validated" | "missing"; confidence?: number; notes: string[] };
  method?: string;
};
```

`accessedAt`/URL/version se incluyen solo si realmente se conocen. Las fichas fuente del repositorio deben justificar período y resolución; no repetir estimaciones del dossier como mediciones de finca.

### `FieldFeature` (GeoJSON Feature)

```json
{
  "type": "Feature",
  "id": "demo-field-01",
  "geometry": { "type": "Polygon", "coordinates": [] },
  "properties": {
    "label": "Demo field 01",
    "geometryKind": "synthetic_demo",
    "centroidApprox": true,
    "classByPeriod": [{ "period": "YYYY-MM", "class": "bare_soil|crop|irrigated_pattern|rainfed_pattern|unknown", "confidence": 0.0, "modelVersion": "" }]
  }
}
```

No liberar un caso con geometría real identificable sin autorización y revisión de privacidad. Campos vacíos de ejemplo son marcadores de esquema, no datos de campo.

### `RotationScenario` y `PillarScore`

```ts
type RotationScenario = {
  id: string; label: string; status: "declared_baseline" | "illustrative";
  crops: Array<{ cropId: string; seasonLabel: string; sourceIds: string[] }>;
  scores: Record<"waterSoil" | "climate" | "pest" | "market", PillarScore>;
  caveats: string[]; missingInputs: string[];
};
type PillarScore = {
  score: number | null; scale: "0-5"; label: string;
  components: Array<{ metricId: string; contribution?: number | null; direction: "favorable" | "caution" | "neutral" | "unknown"; rationale: string }>;
  evidence: MetricRecord[]; confidence: number | null;
  status: "computed" | "preliminary" | "insufficient_data";
};
```

Puntaje numérico, dirección y umbrales solo se configuran tras documentar regla y fuente. No usar colores como semáforo universal sin etiqueta textual. Plagas no es probabilidad de brote; mercado no es rentabilidad.

### `ExplainRequest` / `ExplainResponse`

Request limitada a `scenarioId`, prioridad, métricas tipadas, explicaciones de componentes, citas y límites. No enviar nombres, coordenadas precisas, información personal ni texto libre del usuario. Response JSON validado: `{ summary: string; points: string[]; uncertainties: string[]; sourceIds: string[] }`; rechazar propiedades extra, instrucciones o referencias sin resolver y ofrecer fallback local. El modelo no puede introducir cifras/fuentes que no estén en `sourceIds`.

## Fases y criterios de aceptación

### Fase 0 — Base y control de afirmaciones

- [ ] Crear app Next.js App Router con TypeScript, Tailwind y shadcn/ui; configurar Node runtime y Vercel.
- [ ] Configurar lint/typecheck/build y diseño accesible responsive con todo texto de UI en inglés; docs en español permitidas.
- [ ] Crear registro de fuentes y plantilla `MetricRecord`; mapear afirmaciones existentes a “verificado”, “preliminar”, “pendiente” o “sin verificar”.
- [ ] Configurar caché local `data/cache/` y reglas de exclusión para credenciales, datos fuente redistribuibles no autorizados y ubicaciones personales.

**Aceptación:** `npm run build` produce app desplegable; los componentes base muestran estados loading/empty/error; ninguna métrica aparece sin unidad, período, escala, fuente y estado/calidad.

### Fase 1 — Paquete de datos reproducible

- [ ] Implementar pipeline Python con comandos separados de descarga, transformación y exportación; leer primero desde `data/cache/`.
- [ ] Priorizar fixtures disponibles y aprobados para NDVI Landsat/HLS, IMERG, POWER/temperatura, SMAP y casos de parcela. No bloquear frontend por fuente aún no descargada.
- [ ] Escribir `manifest.json` con ID de capa, atribución/licencia, fuente, timestamps, cobertura, resolución, unidad, archivos, checksum, calidad y huecos temporales.
- [ ] Exportar series/mosaicos compactos aptos para `public/data`; COG grandes pueden ir a Blob con referencia versionada y fixture local alterno.
- [ ] Validar JSON/GeoJSON/raster y producir reporte de fuentes omitidas/errores. No crear datos sintéticos que parezcan observaciones: etiquetarlos explícitamente.

**Aceptación:** un comando documentado reconstruye el paquete desde caché; falla con mensaje accionable si falta una entrada obligatoria; manifest y artefactos pasan validación y conservan atribución.

### Fase 2 — Mapa y navegación espacial

- [ ] Implementar mapa MapLibre + deck.gl, ajuste nacional, búsqueda/navegación al área aproximada de San Juan y selección de parcelas demo.
- [ ] Implementar toggles NDVI, IMERG, SMAP, temperatura, leyendas, fechas disponibles y línea de tiempo; usar GIBS WMTS solo tras verificar endpoint, servicio, estilo, disponibilidad de capa y licencia/atribución.
- [ ] Añadir controles de teclado, labels, estados sin datos y escala de resolución de capa.
- [ ] Asegurar fallbacks offline para fuentes base/capas principales; no sustituir huecos con tiles inventados.

**Aceptación:** capas disponibles coinciden con `manifest.json`; cambio de fecha cambia artefacto mostrado; cada capa comunica escala/período/fuente y se distingue dato remoto de dato local cacheado.

### Fase 3 — Clasificación de cobertura y parcelas

- [ ] Construir tabla temporal por píxel/segmento con NDVI y calidad/nubes de Landsat/HLS; documentar armonización y filtros.
- [ ] Etiquetar muestra con protocolo reproducible y procedencia/licencia; separar entrenamiento y prueba por bloque espacial y período para evitar fuga.
- [ ] Entrenar baseline RandomForest y candidato LightGBM; reportar métricas por clase, matriz de confusión, cobertura y limitaciones. No seleccionar por accuracy agregado solamente.
- [ ] Exportar mapas/clases bare soil, crop, irrigated pattern, rainfed pattern, unknown con confianza y versión de modelo.
- [ ] Evaluar SAM solo como experimento de segmentación de candidatos; aceptación depende de licencia compatible, calidad revisada por persona y ausencia de geometrías sensibles.

**Aceptación:** modelo y reporte son reproducibles; la demo muestra período, resolución, clases, confianza, tasa/calidad de validación y estado preliminar si no hay evidencia suficiente. `unknown` es clase válida; ninguna etiqueta significa certeza de cultivo ni acceso a riego.

### Fase 4 — Puntaje y comparación de rotaciones

- [ ] Definir catálogo pequeño de cultivos/ciclos desde fuentes revisadas; incluir origen de cada dato y estado de aprobación humana.
- [ ] Implementar motor puro TypeScript con cuatro pilares y escala 0–5, reglas versionadas, pesos configurables justificados y desglose por métrica.
- [ ] Agua/suelo: expresar necesidad relativa/estimada vía supuestos FAO-56 y clima disponible; NDVI/suelo desnudo y pendiente con su escala real.
- [ ] Clima: resumir exposición histórica POWER/IMERG por temporada, respetando escala regional y períodos incompletos.
- [ ] Plagas: reglas cualitativas de cultivos/plagas comunes solo con referencias IDIAF verificadas; sin probabilidad ni predicción.
- [ ] Mercado: estacionalidad de precios publicados en Santo Domingo y calidad de limpieza; indicar que no es precio de productor.
- [ ] Implementar prioridad del usuario que modifica orden/ponderación visible sin ocultar ningún pilar ni alterar datos fuente.

**Aceptación:** baseline + dos alternativas producen comparación reproducible; cada resultado tiene componentes, evidencia, origen, unidad, período, escala y confianza/calidad; datos faltantes nunca se convierten en puntuación cero; explicación textual evita garantía o prescripción.

### Fase 5 — Experiencia de UI y casos demo

- [ ] Crear mapa nacional, controles y panel de parcela con historial NDVI y panel de cuatro pilares.
- [ ] Crear selector de prioridad con opciones en inglés y presentación simultánea de las tres rotaciones.
- [ ] Preparar 2–3 casos demo explícitamente sintéticos o anonimizados, cada uno con escenario base/alternativas documentadas y datos cacheados.
- [ ] Mostrar metodologías, fuentes, período, escala, confianza, supuestos, huecos y advertencias en tarjetas de evidencia legibles.
- [ ] Incluir guía de uso visible: “explore scenarios with an agricultural technician”; traducción y claims sometidos a revisión de Frainer.

**Aceptación:** usuario puede recorrer el caso completo sin iniciar sesión ni conexión; un caso con métrica faltante lo indica claramente; UI íntegramente en inglés; demo distingue escenario ilustrativo de observación.

### Fase 6 — Explicador opcional por AI Gateway

- [ ] Añadir `AI_GATEWAY_API_KEY` solo en variables seguras de Vercel/local `.env.local` (ignorado por Git); seleccionar nombre/modelo mediante configuración servidor y confirmar disponibilidad/condiciones antes del deploy.
- [ ] Implementar route handler Node con AI SDK y Vercel AI Gateway; validar request Zod, límite de tamaño, rate limit apropiado y lista permitida de campos.
- [ ] Enviar exclusivamente JSON calculado y referencias asociadas; instruir a resumir, expresar incertidumbre y usar solo evidencia proporcionada.
- [ ] Validar salida estructurada, exigir IDs de fuente presentes en entrada, escapar/renderizar como texto y ofrecer explicación plantilla si el gateway falla/no hay clave.
- [ ] No enviar localización exacta, datos personales, claves, geometrías ni texto libre. Registrar divulgación de IA y modelo/fecha en documentación de release.

**Aceptación:** funciona el flujo con gateway habilitado; falla a plantilla sin bloquear comparación; respuesta no puede cambiar puntajes ni añadir una cita/dato no suministrado. El MVP funciona offline sin esta función.

### Fase 7 — Vercel, revisión y entrega

- [ ] Desplegar preview y producción con build reproducible; comprobar rutas, cabeceras, tamaño de assets y carga de archivos estáticos/Blob.
- [ ] Verificar sin secretos en bundle/logs/repo; revisar política de privacidad, términos y licencias de datos, software, modelos, mapas y materiales.
- [ ] Realizar revisión humana agrícola de escenarios/plagas/agua y revisión de fuentes/citas; asignar cada observación como corregida o pendiente visible.
- [ ] Ensayar modo offline, conexión lenta, resolución móvil, navegación teclado, errores del LLM y capas sin cobertura.
- [ ] Grabar demo/video propio mostrando problema → capas NASA y escalas → clasificación con confianza → comparación de tres rotaciones/cuatro pilares → límites y revisión humana → divulgación de IA.
- [ ] Confirmar en el portal la zona horaria, campos, duración, enlaces y requisitos de submission que están marcados sin verificar; guardar recibo de envío.

**Aceptación:** URL de producción accesible; flujo principal sin llamadas externas funciona; créditos aparecen junto al dato y en pantalla de fuentes; video no implica validación en finca ni resultado medido no comprobado; checklist del portal y fecha/hora quedan confirmadas por el equipo.

## Variables de entorno

```dotenv
# Server-only. Configure in Vercel Project Settings and local .env.local (gitignored).
AI_GATEWAY_API_KEY=
AI_EXPLAIN_MODEL=
# Optional only when large versioned assets use Vercel Blob:
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_DATA_BASE_PATH=/data
```

No usar prefijo `NEXT_PUBLIC_` en secretos. La key del Gateway nunca se expone al cliente. Para demo sin AI Gateway no configurar key y usar fallback estático. Verificar el nombre exacto y mecanismo de credencial del proveedor en la documentación oficial vigente antes de release; no asumirlo si cambia.

## Riesgos y mitigaciones

| Riesgo | Mitigación/decisión de salida |
|---|---|
| Fuentes o descargas aún pendientes | `manifest` refleja estado real; usar casos marcados sintéticos, retirar métricas no sustentadas y mantener funcionalidad con el subconjunto disponible. |
| NDVI con nubes, diferencias entre sensores/resoluciones | Filtros de calidad, armonización documentada, huecos visibles y resolución junto a capa; no interpolar silenciosamente. |
| Clasificador riego/secano confunde patrones o rotaciones | Validación temporal/espacial, clase unknown, confianza y revisión visual; describirlo como patrón inferido, no estado actual. |
| Segmentación SAM produce límites plausibles pero erróneos | Opcional y fuera de salida principal sin revisión; geometrías de demo sintéticas/anonimizadas. |
| Puntaje parece recomendación o ranking científico | Mostrar reglas/ponderación y sensibilidad a prioridad; etiqueta “scenario comparison”; revisión agronómica. |
| Reglas IDIAF incompletas y mercado inconsistentes | Mostrar cobertura y estado preliminar; no puntuar componente sin soporte; precios solo contextualizados como mayoristas/minoristas de Santo Domingo. |
| Resolución climática atribuida al lote | Mostrar escala original y advertencia; métricas agregadas regionales no se rotulan como medición de campo. |
| LLM inventa explicación o indisponibilidad | JSON limitado, validación de citas, no modifica cálculo y fallback de plantilla; no depende del video/demo central. |
| Internet, WMTS/Blob/Gateway fuera de servicio | Fixture local, mapa/capas principales estáticas, fallback, guion de demo offline. |
| Privacidad/licencia de geometrías/modelos | Solo datos autorizados y generalizados; inventario de licencias y revisión antes de publicar. |

## Revisión de IA y fuentes

Mantener `AI_USAGE.md` por cada asistencia material, incluyendo herramienta, fecha, propósito, archivos y persona revisora (Frainer). Artefactos de código/datos generados sustancialmente por IA llevan cabecera/comentario compatible o entrada documental si el formato no lo admite. Revisar afirmaciones agrícolas y citas humanas antes de publicarlas. Atribuir NASA, USGS, IDIAF, Agricultura, INDRHI, paquetes de software, modelo base, tiles y datasets con licencia y límites. La presentación/video incluye una lámina breve sobre el uso de IA, qué revisó el equipo y qué no está validado.

## Secuencia corta para agente implementador

1. Leer `AGENTS.md`, este plan, `docs/04_producto_mvp.md`, `docs/05_arquitectura.md`, inventario y las fuentes oficiales del equipo.
2. Auditar qué datos/artefactos realmente existen; no crear cifras para llenar huecos.
3. Completar Fases 0–2 para un slice vertical con datos demo cacheados; luego avanzar Fases 3–6 con feature flags y evidencia disponible.
4. Ejecutar las comprobaciones del proyecto (lint, types, build y validadores de datos), documentar resultados y revisar UI completamente en inglés.
5. Completar Fase 7 con revisión humana y confirmación portal. No cambiar el scope del Valle de San Juan sin decisión del equipo.
