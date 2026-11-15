<!-- AI: Claude (Anthropic), 2026-11-14. Revisión de Frainer pendiente. -->
# Asesor de siembra y mercado (vista del productor)

Responde a la auditoría de usuario del 14-11-2026 (productor de arroz y habichuela de Juan de Herrera, nota 4/10). La vista principal ahora dice **qué sembrar ahora y por qué**, cambia según provincia, riego, cultivo anterior y mes de siembra, y muestra el mercado con datos oficiales.

## Entradas
Provincia (búsqueda, lista, GPS o toque en el mapa), cultivo anterior, riego (sí/no/no sé), mes de siembra y prioridad.

## Reglas (`web/lib/advisor.ts`)
Candidatos: habichuela, maíz, arroz y batata (los cuatro con curva FAO-56 y precios mayoristas).

- **Agua:** integral Kc·día FAO-56 (tablas 11–12), relativa entre los cuatro (0–5). El arroz sin riego queda descartado. El arroz inundado gasta más de lo que muestra el cálculo; así se dice en la app.
- **Sequía:** `droughtScore` de FAO GIEWS por provincia (ASI, VHI e historial 1984–2025), ya existente (`docs/14_fao_giews.md`).
- **Plagas:** regla IDIAF para habichuela→maíz y descuento por repetición o por plagas compartidas. Ver «Plagas compartidas en el asesor».
- **Precio:** índice estacional del mes de cosecha (mes de siembra + ciclo FAO-56) de la serie mayorista primera del Ministerio, `2,5 + (índice − 100)/5`, menos 1 si la siembra nacional está “alta”.
- **Resultado:** promedio ponderado de los criterios con dato, menos el descuento de plagas cuando aplica. La prioridad elegida pesa el doble. Verde ≥ 3,34, ámbar ≥ 1,67.

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

## Actualización (14-11-2026, tarde)
- **Onboarding** (`web/components/onboarding.tsx`): la primera visita hace 6 preguntas: dónde está la finca, qué sembró, si tiene riego, qué cultivos puede sembrar, cuándo siembra y qué le importa más. Las respuestas se guardan solo en ese teléfono (`localStorage`) y se pueden cambiar con “Cambiar”.
- **13 cultivos**: habichuela, maíz, arroz, batata, yuca, plátano, maní, tomate, cebolla, ají, auyama, papa y sorgo.
  - Los coeficientes FAO-56 (tablas 11 y 12) se comprobaron en la página de la FAO el 14-11-2026. Para el Kc inicial se usan los valores de grupo que imprime la tabla; para los rangos, el punto medio.
  - El agua se compara en una escala fija entre los 13 cultivos.
  - Guandul queda fuera porque FAO-56 no lo incluye.
- **Precios nuevos**: plátano (por unidad), yuca, tomate, cebolla, ají, auyama y papa, tomados del CSV mayorista del Ministerio de Agricultura.
  - El pronóstico solo se muestra si el error del backtest es de 50% o menos; la papa queda sin pronóstico.
  - Maní y sorgo no tienen precio mayorista en la fuente.
- **Voz**:
  - Funciona en producción: comprobado el 14-11-2026 con conexión real y una pregunta por texto dentro de la llamada. El micrófono físico debe probarse en un celular.
  - Ahora saluda al conectar y habla en español dominicano cálido.
  - Muestra una esfera animada que reacciona al nivel del micrófono y a cuando habla AgroVision.
  - Da mensajes claros si falta el permiso del micrófono o la conexión.

## Cultivos comunes de RD (14-11-2026)
- Se quitó el sorgo. Quedan 22 cultivos: habichuela roja y negra, maíz, arroz, batata, yuca, plátano, guineo, maní, tomate, cebolla, ají, auyama, papa, pepino, berenjena, repollo, zanahoria, piña, café, cacao y aguacate.
- Los coeficientes de los cultivos nuevos salen de FAO-56 (tablas 11 y 12), verificados en la página de la FAO.
- Café, cacao y aguacate son permanentes: el agua se cuenta por un año, no tienen mes de cosecha y se listan después de los cultivos de temporada.
- Café y cacao no tienen precio mayorista ni siembra en las fuentes del Ministerio, así que aparecen sin precio.
- La habichuela roja y la negra son la misma especie (*Phaseolus vulgaris*), por eso comparten la regla de plagas del IDIAF.

## Fincas, lluvia, ganancia, compartir y sobreoferta (14-11-2026, noche)
- **Fincas** (`web/lib/farms.ts`, `web/components/{farm-picker,farm-switcher}.tsx`):
  - Hay tres formas de marcar la finca: tocar cuadros de 50 × 50 m (unas 4 tareas), tocar parcelas aproximadas (SAM o unidades Sentinel-2), arrastrar un rectángulo o dibujar un polígono.
  - El área se calcula con la fórmula geodésica esférica y se muestra en tareas y hectáreas.
  - Se pueden guardar varias fincas en el teléfono (`agrovision:farms`), cada una con su propio perfil.
- **Lluvia** (`web/lib/rain.ts`, `/api/rain`):
  - Usa el pronóstico de 7 días de Open-Meteo. Si no está disponible, muestra los últimos días de NASA POWER y lo dice.
  - Regla propia: 5 mm o más con 50% de probabilidad cuentan como lluvia útil; menos de 5 mm en la semana es una semana seca.
  - El último resultado se guarda para usarlo sin conexión.
- **¿Cuánto me deja?** (`web/lib/profit.ts`):
  - Costo: costo por tarea de 2019 × 1,3774 (IPC del Banco Central de enero 2026, base oct. 2019–sep. 2020 = 100).
  - Venta: rendimiento del informe de costos × precio mayorista (el más bajo, el último y el más alto de 12 meses).
  - El arroz no se calcula porque la cosecha está en fanegas en cáscara y el precio es de arroz pilado. Café, cacao, plátano y otros cultivos sin costos de 2019 tampoco se calculan.
- **Sobreoferta** (`oversupplyFor`): siembra nacional alta (≥ 115%) o precio estacional bajo (≤ 95) en el mes de cosecha. Resta un punto de precio cuando la siembra está alta. No existen datos de siembra por provincia.
- **Compartir:** la tarjeta se dibuja como imagen en un `canvas` y se comparte con la Web Share API; si no se puede, se abre `wa.me` con el texto.


## Plagas compartidas en el asesor

El catálogo incluye insectos, ácaros y nematodos de los 27 cultivos de la lista de referencia, con nombre científico cuando está disponible y enlaces a las fuentes por cultivo. El cultivo anterior puede seleccionarse de ese catálogo. La lista de candidatos sigue dependiendo de la cobertura del asesor (datos de agua, clima y mercado).

Una coincidencia de taxón con evidencia local, o la repetición del cultivo, descuenta 0,5 puntos del resultado final (1 punto si se priorizan plagas). Una coincidencia basada en una referencia externa (†) se muestra para confirmar localmente y no modifica el puntaje. Los nombres generales sin taxón, como «trips», no se cruzan. Una coincidencia por género indica posible hospedero compartido y requiere identificar la especie en campo. El respaldo específico del IDIAF para la secuencia habichuela a maíz sigue aportando al promedio ponderado.

Estas reglas comparan asociaciones documentadas; la ficha no mide incidencia ni actividad por provincia o mes. El puntaje es una regla del prototipo, pendiente de revisión agronómica.

El asesor, la lectura en voz y las rotaciones de ejemplo muestran precauciones para cada transición concreta. Si hay un hospedero compartido, indican revisar el historial del cultivo anterior; también destacan una plaga del cultivo siguiente. Las referencias externas se presentan como pendientes de confirmación.

## Ajustes del flujo del agricultor (2026-11-15)

El asesor muestra primero una rotación de ciclo conocido y aparta repeticiones, incluidas habichuela roja y negra. Su puntaje compara opciones. La aptitud de una parcela exige confirmar agua, suelo e historial en campo. El precio bajo en el año histórico se presenta como estacionalidad; la superficie sembrada se describe por separado. La tarjeta muestra contexto de NASA POWER/MERRA-2 (2016–2025, grilla regional de unos 50 km); el componente de sequía del puntaje sigue usando FAO GIEWS.

Venta prefiere el área declarada y después la marcada. El escenario usa fichas de 2019 con sistema de riego identificado, ajustadas por IPC general, y una ventana de 12 meses de precios mayoristas. La ficha de habichuela roja de San Juan incluye rubros editables. Para otros cultivos, los rubros se completan con datos del productor cuando falta desglose verificado. La calculadora mantiene disponible el ingreso manual para secano y para arroz en cáscara. El descuento sobre mayorista se toma de lo declarado en el formulario.

Asistencia de OpenAI, 2026-11-15. Revisión por Frainer pendiente.
