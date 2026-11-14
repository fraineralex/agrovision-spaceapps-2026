# 04. Producto MVP

## Usuario y problema

Aplicación web para productores y técnicos agrícolas del Valle de San Juan. En la región se toman decisiones de siembra con presión de sequía, disponibilidad de riego, desgaste del suelo, plagas compartidas y cambios de precio. La app organiza evidencia para que el productor y un técnico comparen la rotación actual con dos o tres escenarios. No reemplaza su criterio.

## Comparación en cuatro pilares

1. **Agua y suelo:** necesidad relativa de agua por cultivo/ciclo con método FAO-56 y datos climáticos disponibles; cobertura y exposición del suelo observadas con series Landsat; pendiente SRTM si corresponde. Las escalas regionales no se describen como mediciones de finca.
2. **Clima:** historial de temperatura y variables de NASA POWER, precipitación IMERG y ventanas de vulnerabilidad. Mostrar período y resolución; POWER mezcla valle y montaña, e IMERG tiene celdas cercanas a 10 km.
3. **Plagas:** informar plagas/enfermedades y familias/cultivos compartidos únicamente cuando estén respaldados por fuentes IDIAF revisadas. Es una regla de rotación cualitativa, no detección ni predicción de brotes.
4. **Mercado:** estacionalidad de precios mayoristas/minoristas del Ministerio en Santo Domingo. Aclarar que no son precios pagados al productor y que hay inconsistencias por limpiar.

## IA de análisis de imágenes

La IA del MVP clasifica imágenes Landsat para identificar meses en que un campo queda pelado y distinguir áreas de riego frente a secano. Mostrar el período, resolución, método/clases y confianza; validar visualmente la muestra y no convertir la etiqueta en certeza de cultivo o disponibilidad de agua. La IA analiza datos, no conversa ni recomienda por sí sola. No afirmar predicción de rendimiento ni de plagas. Sensores físicos son una extensión futura, fuera de la demo.

## Flujo de demo

1. Abrir el caso del Valle de San Juan y elegir ubicación aproximada/comunidad.
2. Declarar cultivo previo, condición de riego (riego/secano/no confirmado) y prioridad del usuario.
3. Ver línea base de rotación actual y dos o tres alternativas ilustrativas.
4. Comparar los cuatro pilares con evidencia, regla usada, fuente/fecha, escala, confianza, datos faltantes y riesgos a validar con técnico.
5. Mantener la pantalla de ejemplo disponible desde caché local aunque no haya internet.

No presentar cultivos/fechas como recomendación agronómica final sin validación del productor, técnico y fuentes locales. Las secuencias concretas de demostración deben etiquetarse como escenarios.

## Alcance y límites

- Núcleo demostrable: caso San Juan, datos NASA conectados a la interfaz, cuatro pilares, comparación explicable y clasificación Landsat descrita arriba.
- El resumen del equipo indica datos de precios disponibles pero por limpiar; si la limpieza no se completa, mostrar un ejemplo marcado como preliminar y no derivar rentabilidad.
- La serie de presas se arma con Landsat y boletines puntuales; no llamarla registro hidrológico observado continuo.
- LLM explicativo: opción secundaria futura, no parte del MVP ni del flujo principal. Si el equipo lo aprueba más adelante, solo podría explicar métricas estructuradas ya calculadas, con salida validada y divulgación de IA.
- Sensores: extensión futura de monitoreo/calibración, no usar en la demo.

## Qué no afirmar

- No afirmar predicción de rendimiento, rentabilidad o plagas.
- No presentar clasificación de uso del suelo como verdad observada sin validación y confianza.
- No atribuir a una parcela la resolución de celdas climáticas o de humedad regional.
- No afirmar fechas óptimas universales, seguridad de rotación ni cambios garantizados de suelo.
- No presentar precios mayoristas/minoristas como precio en finca.
