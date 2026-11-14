<!-- Asistencia de IA: Codex (OpenAI), 14-11-2026. Revisado por Frainer; ver AI_USAGE.md. -->

# AgroVision

Repositorio del equipo AgroVision para NASA Space Apps Challenge 2026, reto [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/), sede Santo Domingo virtual.

## Dirección oficial

El piloto es el **Valle de San Juan**. AgroVision compara la rotación actual con dos o tres escenarios para apoyar, sin reemplazar, la decisión del productor y del técnico agrícola. Organiza la evidencia en cuatro pilares: **agua y suelo, clima, plagas y mercado**.

La IA del MVP analiza imágenes Landsat para clasificar meses de campo pelado y zonas de riego frente a secano, indicando confianza y límites. No es un chatbot; un LLM explicativo es una opción secundaria. Sensores quedan para una fase futura y no entran en la demo. No se afirma predicción de rendimiento ni de plagas.

## Inicio rápido

Requisitos: Python 3.10 o superior. La demo debe funcionar con datos precargados en caché aunque no haya internet.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
python scripts/fetch_power.py --lat 18.80 --lon -71.23 --start 2016-01-01 --end 2025-12-31
uvicorn backend.main:app --reload
```

API local: `http://127.0.0.1:8000/health` y `http://127.0.0.1:8000/climate`. La descarga requiere red; la presentación debe poder reproducir el caso desde `data/cache/`.

## Documentos

Leer en orden según [AGENTS.md](AGENTS.md). La dirección oficial y el inventario base están en `docs/fuentes_equipo/resumen_equipo.txt` y `docs/fuentes_equipo/inventario_datos.txt`.

- `docs/00_reglas_envio_y_evaluacion.md`: reglas confirmadas, elementos sin verificar y checklist de envío.
- `docs/02_recursos_datos.md`: tabla de las 33 fuentes y estados.
- `docs/04_producto_mvp.md`, `docs/05_arquitectura.md`: alcance y arquitectura de la demo.
- `docs/08_premios.md`: correspondencia con descripciones oficiales publicadas; ponderaciones 2026 sin verificar.
- `AI_USAGE.md`: registro de asistencia de IA.

## Fechas y entrega

- Evento: 14 y 15 de noviembre de 2026.
- Cierre oficial de envío: domingo 15 de noviembre, 11:59 PM AST según sede Santo Domingo. Confirmar hora activa en el portal del equipo.
- Los requisitos que no se pudieron comprobar en la guía 2026 están identificados como “sin verificar”; revisar el formulario oficial antes de enviar.

## Desarrollo

- Ramas: `feature/<nombre-corto>`, `fix/<nombre-corto>` o `docs/<nombre-corto>` desde `main`; PRs pequeños con fuentes y pasos de revisión.
- Citar cada fuente/dataset con fecha, escala, unidad y limitaciones. No inventar métricas ni URLs.
- No guardar secretos, credenciales ni datos personales de productores.
- Toda asistencia de IA debe registrarse en `AI_USAGE.md` y citarse en el material generado.
