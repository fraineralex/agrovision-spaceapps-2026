<!-- AI: Claude (Anthropic), 2026-11-14. Revisión de Frainer pendiente. -->
# Asesor de siembra y mercado (vista del productor)

Responde a la auditoría de usuario del 14-11-2026 (productor de arroz y habichuela de Juan de Herrera, nota 4/10). La vista principal ahora dice **qué sembrar ahora y por qué**, cambia según provincia, riego, cultivo anterior y mes de siembra, y muestra el mercado con datos oficiales.

## Entradas
Provincia (búsqueda, lista, GPS o toque en el mapa), cultivo anterior, riego (sí/no/no sé), mes de siembra y prioridad.

## Reglas (`web/lib/advisor.ts`)
Candidatos: habichuela, maíz, arroz y batata (los cuatro con curva FAO-56 y precios mayoristas).

- **Agua:** integral Kc·día FAO-56 (tablas 11–12), relativa entre los cuatro (0–5). El arroz sin riego queda descartado. El arroz inundado gasta más de lo que muestra el cálculo; así se dice en la app.
- **Sequía:** `droughtScore` de FAO GIEWS por provincia (ASI, VHI e historial 1984–2025), ya existente (`docs/14_fao_giews.md`).
- **Plagas:** solo la regla citada de IDIAF (Oviedo 2013, pp. 88, 94, 102): habichuela→maíz = 5; repetir el mismo cultivo = 1; lo demás sin dato.
- **Precio:** índice estacional del mes de cosecha (mes de siembra + ciclo FAO-56) de la serie mayorista primera del Ministerio, `2,5 + (índice − 100)/5`, menos 1 si la siembra nacional está “alta”.
- **Resultado:** promedio de los pilares con dato; la prioridad elegida pesa el doble. Verde ≥ 3,34, ámbar ≥ 1,67.

Las reglas de puntos y umbrales son propias de AgroVision, no validadas en campo.

## Mercado (`scripts/market/build_market_insights.py` → `web/public/data/market-insights.json`)
- Precio más reciente, comparación con hace 12 meses y la serie de 24 meses.
- Mejores y peores meses de venta según el índice estacional (mediana de años completos, mínimo 3).
- Pronóstico a 3 y 6 meses: promedio de 12 meses × índice estacional. El rango es ± el MAPE del backtest de los últimos 36 meses (habichuela 4,1%, arroz 6,3%, maíz 12,1% y batata 26,9% a 3 meses).
- Presión de siembra: tareas sembradas en el país en los últimos 12 meses frente a la mediana de los 3 años anteriores. “Alta” si es ≥ 115%; “baja” si es ≤ 85%.
- Meses en que más se siembra cada cultivo en el país.
- Costos por tarea de 2019 con su página del PDF. No se calcula ganancia, porque mezclar precio mayorista de 2026 con costos de 2019 engañaría.

## Límites
Los precios son mayoristas de Santo Domingo, no precio en finca, y son nominales. La siembra es nacional, no provincial. En el consolidado, la siembra de plátano de diciembre es muy alta (unas 600.000 tareas), probablemente un total acumulado: no se corrige y se marca como dato a revisar. No hay importaciones ni pronóstico de plagas.

## Otras correcciones de la auditoría
- El buscador muestra botones con las provincias encontradas.
- Ya no viene Monte Plata por defecto. Se puede usar el GPS.
- Las fincas aproximadas de SAM se pueden tocar en el mapa y muestran el área en tareas.
- La letra mínima es de 14 px y el texto base de 17 px.
- El mapa es más grande, sin botones encima, y empieza plano para cargar menos teselas.
- La lluvia se dice en palabras y en mm al mes, con la advertencia de la celda de 50 km.
- La voz usa la misma recomendación y los mismos datos de mercado.
- Se dice quién hace la app.
- “Caso guardado sin conexión” se cambió por un estado claro.
