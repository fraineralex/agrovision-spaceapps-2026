<!-- AI assistance: Codex (OpenAI), 2026-11-14. Frainer review: pending. -->
# Precios mayoristas del Ministerio de Agricultura

Fuente primaria consultada el 14-11-2026: [catálogo de Transparencia del MA](https://agricultura.gob.do/transparencia/categoria/informe-precios-de-mercado-interdiario-2017-2025/). Aunque el slug termina en 2025, la página y sus descargas abarcan agosto de 2017–octubre de 2026. El [CSV directo](https://agricultura.gob.do/transparencia/wp-content/uploads/2023/01/Informe-de-precios-Mayorista-Agosto-2017-Octubre-2026..csv) se descargó con HTTP 200; también se contrastaron las primeras filas del XLSX enlazado por el catálogo. La página antigua `informe-de-precios-interdiario/` todavía enlaza archivos hasta junio de 2021: no usarla para afirmar cobertura 2026.

## Reproducir

Python 3.10 o posterior; solo biblioteca estándar:

```bash
python3 scripts/market/build_prices.py --refresh  # descarga y conserva bytes originales
python3 scripts/market/build_prices.py            # sin red, usa caché versionada
python3 -m unittest discover -s scripts/market -p 'test_*.py'
```

La caché `data/cache/market/wholesale_2017_2026.csv` conserva Windows-1252, separador `;`, sin cabecera. Columnas: producto, categoría, nivel comercial, unidad/empaque, precio RD$, semana ordinal del mes, mes, año. El JSON de metadatos guarda URL y fecha real de descarga; `data/derived/market_prices.json` añade SHA-256. No se añade cabecera IA al CSV original de terceros; la transformación queda atribuida aquí, en el JSON y en `AI_USAGE.md`.

La regla específica en `.gitattributes` conserva los bytes/CRLF originales y evita tratar este CSV Windows-1252 como un diff UTF-8. Para revisar datos, abrirlo con Windows-1252 o seguir `sourceRow` desde el derivado; no convertir la caché en el editor porque invalidaría el checksum.

La exportación contiene observaciones de habichuela roja, maíz, guandul, batata y arroz; conserva nombre, variedad, calidad, empaque original y número de fila del CSV (base 1). No identifica mercado individual: se etiqueta como referencia mayorista de Santo Domingo. La columna categoría contiene errores y no se usa para clasificar cultivos.

## Método y límites

- Solo sacos con peso explícito se convierten a RD$/lb. `Quintal` permanece RD$/quintal; no se asume su masa. No se mezclan guandul en grano y en vaina, variedades ni calidades.
- Cero/vacío = faltante. Las semanas son ordinales publicadas, **no semanas ISO**: no se inventan fechas diarias. Espacios, mayúsculas y acentos se normalizan; correcciones ordinales explícitas están en `WEEKS`. Mes `Juio` y año corrupto se excluyen, sin adivinar. El listado `audit.rejectedRows` permite revisar las exclusiones.
- Duplicados idénticos de una serie/mes/semana cuentan una sola vez; si difieren, se excluye todo el grupo. Observaciones y motivos permanecen en el artefacto. No se elimina un valor extremo solo por parecer inusual.
- `monthlyPrices` promedia semanas elegibles por serie y mes; incluye número de semanas y filas fuente. No interpola.
- `monthlySeasonality` contiene los doce meses de cada serie. Usa la mediana interanual de `media mensual / media de los doce meses del año × 100`. Solo admite años con doce meses y al menos tres semanas por mes, y requiere al menos tres años completos. El índice compara cada mes con la referencia anual, no predice precios; datos insuficientes producen `null` y estado pendiente.
- Se excluyen años parciales del índice; precios nominales, sin ajuste de inflación. El cambio de nivel entre años se reduce con cocientes anuales. No hay causalidad ni validación estadística de un efecto estacional. `confidence: null`; calidad preliminar y `marketScore: null` hasta revisión humana.

Todas las métricas heredan la fuente `ma_wholesale_2017_2026`; cada observación indica período, unidad, escala, método y calidad. En estacionalidad, `years` define el período realmente utilizado. No usar estos precios como ingreso en finca, margen, predicción o calendario óptimo de cosecha.

## Comprobación manual de la muestra

En el CSV original, agosto de 2017, primera semana ordinal: fila 4 maíz Francés largo RD$1,100/saco de 100 lb; fila 5 habichuela roja Yacomelo RD$3,900/saco de 100 lb; fila 11 guandul verde en vaina Kaki RD$1,700/saco de 100 lb; fila 12 batata Roja Copelo RD$700/quintal. Verificar contra las filas correspondientes del XLSX del mismo catálogo. Estos son valores de observación, no promedios mensuales.

La licencia ODbL aparece en el [catálogo datos.gov.do](https://www.datos.gov.do/dataset/info); su aplicación al archivo descargado directamente del MA queda pendiente de revisión. Se conserva atribución y origen; no se relicencian estos datos como código del proyecto. Frainer debe revisar derechos de redistribución, filas excluidas y cálculos antes del envío.

Integración pendiente del equipo de UI: consumir el artefacto y, si corresponde, exportarlo al contrato `web/public/data/prices-weekly.json`. Esta tarea no modifica `web/` ni `scripts/ml/`.
