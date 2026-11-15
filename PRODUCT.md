# Product

<!-- impeccable:product-schema 1 -->
<!-- AI: Codex/OpenAI con Impeccable, 2026-11-15. Síntesis de instrucciones y fuentes confirmadas; revisión de Frainer pendiente. -->

Este registro resume restricciones confirmadas por las instrucciones de Frainer y la documentación del equipo. No introduce otra autoridad de producto: `docs/fuentes_equipo/resumen_equipo.txt` y `docs/fuentes_equipo/inventario_datos.txt` prevalecen sobre propuestas anteriores. AGENTS.md conserva las reglas de evidencia, autoría, privacidad y colaboración. La dirección visual autorizada vive en DESIGN.md; los flujos se documentan en `.impeccable/surfaces/application.md` y `.impeccable/surfaces/siembra.md`.

## Platform

web

## Users

Productores y técnicos agrícolas del Valle de San Juan, piloto oficial. Comparan su rotación actual con alternativas para revisar la siguiente siembra. El uso incluye teléfono al sol o con poca señal y escritorio para comparar opciones.

## Product Purpose

Apoyar la decisión con datos y límites comprensibles, sin sustituir el juicio del productor ni la revisión de un técnico. El producto compara rotaciones en cuatro pilares: agua y suelo, clima, plagas y mercado. La ausencia de evidencia debe seguir siendo visible.

## Operating Context

Proyecto AgroVision para NASA Space Apps 2026, reto Field Shift. La implementación web existente usa Next.js App Router, React y TypeScript. Frainer amplió explícitamente el alcance de diseño a toda la aplicación: unificar criterios, mejorar UI y UX y eliminar espacios vacíos llamativos manteniendo identidad, contenido y funciones. El alcance incluye las cinco pestañas, onboarding y directorio de fuentes; no cambia el motor de datos.

El flujo de Siembra conserva revisión de mes y contexto, recomendación y comparación, fuentes, opciones, plan, suelo, plagas y compartir. El plan conserva mes, cultivo y almacenamiento existente. La demo debe usar caché local en `data/cache/` y no depender de una API externa durante la presentación.

Las otras áreas existentes permiten revisar lluvia y contexto, calcular gastos y precio de venta, revisar finca y zona en mapa y consultar ayuda con explicación opcional. La reorganización visual preserva sus controles y fuentes; no implica capacidades de predicción nuevas.

## Capabilities and Constraints

- La dirección oficial sitúa observaciones terrestres de NASA en el mecanismo de comparación, acompañadas por información local de suelo, cultivos y prioridades del agricultor.
- La IA central prevista analiza imágenes Landsat para clasificar meses de campo pelado y zonas de riego frente a secano. Esta es dirección del producto, no una afirmación de modelo integrado o validado: cualquier disponibilidad, resultado y confianza deben comprobarse en los artefactos correspondientes.
- El MVP no se diseña como chatbot. Un LLM explicativo es secundario, debe citarse y no añade cifras ni conclusiones fuera de la evidencia. Los sensores son extensión futura, fuera de la demo.
- Toda métrica visible debe conservar fuente, fecha o período, unidad, escala espacial y confianza/calidad. Distinguir observación, reanálisis, regla agronómica y dato declarado.
- No afirmar predicción de rendimiento o plagas, rentabilidad garantizada, fechas óptimas universales ni resultados validados en finca sin evidencia. No convertir señales regionales en mediciones de finca.
- No exponer credenciales, ubicaciones identificables ni datos personales de productores. No inventar datos, fuentes, citas, testimonios, resultados ni disponibilidad.

## Brand Commitments

Nombre AgroVision e identidad agrícola existente. Preservar los recursos de marca, FarmIcon, estrellas, gráficos, fotografías del onboarding y atribuciones. UI en español dominicano; nombres científicos y nombres oficiales de fuentes se conservan. DESIGN.md contiene las decisiones visuales vigentes y sustituye auditorías visuales contradictorias.

## Evidence on Hand

Fuentes confirmadas del contexto de trabajo:

- `docs/fuentes_equipo/resumen_equipo.txt`: dirección oficial y propósito del piloto.
- `docs/fuentes_equipo/inventario_datos.txt`: inventario oficial; su estado no equivale a una comprobación independiente de descarga o integración.
- `docs/02_recursos_datos.md`, `docs/04_producto_mvp.md` y `docs/10_plan_tecnico.md`: recursos, alcance y plan técnico con sus límites.
- `web/app/`, `web/components/` y `web/lib/`: implementación existente, no prueba de validación agronómica.
- `AI_USAGE.md`: asistencia material de IA y revisión humana; no sustituye la revisión de fuentes ni de resultados.

Este documento no certifica una descarga, un modelo, disponibilidad en producción ni un resultado de campo. Lo no comprobado queda pendiente o «sin verificar» en su registro correspondiente.

## Product Principles

- Comparar opciones con evidencia y límites antes de recomendar una acción.
- Mantener visibles los cuatro pilares y explicar datos insuficientes.
- Preservar el flujo principal y la evidencia local cuando falte conectividad.
- Mantener explicaciones de IA subordinadas a datos citados y revisión humana.

## Accessibility & Inclusion

Texto legible en ambos temas, estados con palabras además de color, foco visible y orden de teclado coherente. Preservar controles táctiles y acceso a fuentes, ayudas y límites. Los cultivos permanecen visibles para la comparación; divulgación progresiva para detalle técnico. Las pruebas de escritorio, móvil, estados y accesibilidad de toda la aplicación son requisitos documentados en los briefs, no resultados asumidos.
