# AgroVision

Repositorio privado de contexto y arranque del equipo AgroVision para NASA Space Apps Challenge 2026, reto [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/). El objetivo es alinear al equipo, conservar fuentes y arrancar una demo reproducible para el evento virtual de Santo Domingo.

## Reto en breve

Explorar cómo datos de observación de la Tierra de NASA, contexto local de suelo, rasgos de cultivos y prioridades agrícolas pueden ayudar a comparar rotaciones resilientes. La herramienta apoya la decisión y no sustituye criterio de productores, técnicos ni especialistas. AgroVision enfoca el MVP en San Juan de la Maguana, con rotaciones comparables y explicaciones rastreables a datos y reglas.

## Fechas y deadlines

- Evento: 14 y 15 de noviembre de 2026, Santo Domingo, modalidad virtual.
- Corte interno de entrega: domingo 15 de noviembre, 6:00 PM AST.
- Cierre oficial de envío: domingo 15 de noviembre, 11:59 PM AST.
- La guía citada en el chat sitúa el inicio de juzgamiento el 16 de noviembre. Revisar la página oficial por cambios.

## Equipo y fortalezas

- Ronald: Python, FastAPI, infraestructura, datos y aprendizaje automático.
- Victor: algoritmos, programación competitiva, backend y React.
- Frainer: liderazgo técnico, TypeScript, React, Node, AWS y experiencia con datos satelitales.
- Hansel: desarrollo full stack, Scrum y Python aplicado a IA.
- Karla: ciberseguridad, desarrollo web, estadística y automatización conversacional.
- Luis: desarrollo con C#, React, Python y JavaScript; automatización conversacional.

Las fortalezas provienen del resumen compartido del equipo y no implican asignación definitiva de tareas.

## Cómo arrancar

Requisitos: Python 3.10 o superior y acceso a internet para consultar NASA POWER. La API no requiere clave.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
python scripts/fetch_power.py --lat 18.80 --lon -71.23 --start 2016-01-01 --end 2025-12-31
uvicorn backend.main:app --reload
```

API local: `http://127.0.0.1:8000/health` y `http://127.0.0.1:8000/climate`. La caché inicial está en `data/cache/`.

## Mapa del repo

- `docs/`: reto, datos, contexto dominicano, MVP, arquitectura, plan e ideas.
- `scripts/`: descarga reproducible de POWER, comprobación de GIBS y dependencias.
- `data/cache/`: CSV de demostración. Guardar aquí datos públicos derivados y documentar fuente/fecha.
- `backend/`: esqueleto FastAPI.
- `frontend/`: propuesta inicial de interfaz.
- `.github/`: plantillas de issues y pull requests.
- `AI_USAGE.md`: registro obligatorio de asistencia de IA.

## Convenciones de trabajo

- Crear ramas `feature/<nombre-corto>` desde `main`.
- Abrir PRs pequeños a `main`, describiendo problema, cambio, cómo revisarlo y fuentes relevantes.
- Usar issues para tareas, decisiones pendientes y defectos; enlazar PR con su issue.
- No incluir secretos, credenciales, datos personales de productores ni datos privados del equipo.
- Cada dato externo debe llevar fuente, fecha, unidad, cobertura y limitaciones. Mantener visible la incertidumbre.
- Toda contribución asistida por IA se registra en `AI_USAGE.md`.

## Checklist de entrega

Confirmar la guía oficial de submission el día del cierre. Completar y revisar:

- [ ] Título, descripción del proyecto, reto seleccionado y problema que aborda.
- [ ] Cómo funciona, público objetivo, impacto esperado y qué se construyó frente a qué es visión futura.
- [ ] Uso concreto de datos NASA: dataset, variable, periodo, resolución y papel en cada comparación.
- [ ] Al menos tres rotaciones, incluida una línea base, con evidencia, beneficios, incertidumbres y riesgos.
- [ ] Demo funcional y enlace accesible; probar modo demo con caché.
- [ ] Video según duración y formato que indique la guía oficial; audio claro y flujo ensayado.
- [ ] Fuentes y atribuciones de datos, software y materiales de terceros.
- [ ] Diapositiva sobre uso de IA y referencias en `AI_USAGE.md`.
- [ ] Enviar antes del corte interno de 6 PM AST y verificar confirmación antes del cierre oficial.
