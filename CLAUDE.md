# Instrucciones para el equipo AgroVision

## Lectura y dirección de producto

- Leer en orden: `docs/00_reglas_envio_y_evaluacion.md`, `docs/01_reto.md`, `docs/02_recursos_datos.md`, `docs/03_contexto_rd.md`, `docs/04_producto_mvp.md`, `docs/05_arquitectura.md`, `docs/06_plan_equipo.md`, `docs/07_ideas_y_competencia.md`, `docs/08_premios.md`, `README.md`.
- `docs/fuentes_equipo/resumen_equipo.txt` y `docs/fuentes_equipo/inventario_datos.txt` son la dirección oficial vigente y prevalecen sobre notas o propuestas anteriores.
- El piloto es el Valle de San Juan. El producto compara rotaciones en cuatro pilares: agua y suelo, clima, plagas y mercado.
- La IA central analiza datos: clasifica con imágenes Landsat meses de campo pelado y zonas de riego frente a secano. No diseñar el MVP como chatbot. Un LLM explicativo es opción secundaria y debe quedar citado. Sensores fuera de la demo, como extensión futura.

## Evidencia, datos y límites

- No inventar datos, fuentes, URLs, citas, testimonios, resultados ni disponibilidad. Marcar como pendiente o “sin verificar” lo que no se haya comprobado.
- Toda métrica visible debe tener fuente, fecha/período, unidad, escala espacial y confianza/calidad. Distinguir observación, reanálisis, regla agronómica y dato declarado.
- No afirmar predicción de rendimiento ni de plagas, rentabilidad garantizada, fechas óptimas universales ni resultados validados en finca sin evidencia.
- Usar caché local (`data/cache/`) para que la demo funcione offline. No hacer que la presentación dependa de una API externa.
- No exponer credenciales, ubicaciones identificables ni datos personales de productores.

## Uso de IA y autoría

- La organización permite IA solo si se cita. Registrar cada asistencia material en `AI_USAGE.md` con fecha, herramienta, propósito, archivos y revisión por Frainer.
- Añadir comentario de cabecera pertinente en archivos o artefactos producidos sustancialmente con IA que identifique herramienta, fecha y revisión. No insertar comentarios que rompan formatos o código; en esos casos documentar en `AI_USAGE.md`.
- Revisar afirmaciones y citas humanas antes de integrarlas o enviarlas. Atribuir datasets, software, imágenes y contenido de terceros y respetar sus licencias.

## Desarrollo y colaboración

- Todos los mensajes de commit deben estar en inglés y seguir Conventional Commits (por ejemplo, `docs: add technical implementation plan`).
- Todo el texto visible en la interfaz de usuario (UI) debe estar en inglés. La documentación del repositorio puede seguir en español.
- Seguir `docs/10_plan_tecnico.md` para implementar y revisar el producto.
- Crear ramas `feature/<nombre-corto>`, `fix/<nombre-corto>` o `docs/<nombre-corto>` desde `main`; no trabajar directamente en `main` salvo operación final de integración autorizada.
- Abrir PRs pequeños hacia `main`, con propósito, archivos, fuentes y pasos concretos de revisión. No incluir secretos ni datos privados.
- Mantener cambios coherentes con la dirección oficial; actualizar documentación y registro de IA en el mismo cambio.

## Fecha límite

- Envío Space Apps: domingo 15 de noviembre de 2026, 11:59 PM AST según la sede Santo Domingo. Confirmar zona/hora en el portal y respetar cualquier indicación activa del formulario. La guía oficial de envío 2026 y varios límites específicos están marcados “sin verificar” en `docs/00_reglas_envio_y_evaluacion.md`.
