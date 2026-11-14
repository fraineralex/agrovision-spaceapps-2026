# Agua, suelo y clima — método del piloto

Generado con asistencia de IA (Cursor agent, 14-11-2026). Pendiente de revisión agronómica por Frainer. Los números de este documento salen de `data/derived/water_climate/` y no se redondearon a mano fuera de lo que ya guarda el JSON.

## Qué cubre

Pilares de agua y suelo y de clima para el Valle de San Juan, en el punto NASA POWER 18.8 N, 71.23 W, del 1 de enero de 2016 al 31 de diciembre de 2025. El punto cae dentro del bbox del valle (lon -71.40 a -71.05, lat 18.65 a 18.95). No es una parcela.

La serie diaria de T2M y PRECTOTCORR coincide con `data/cache/power_daily_18.8_-71.23_2016-01-01_2025-12-31.csv` en las 3653 fechas (diferencia absoluta máxima 0). La descarga nueva añade T2M_MAX, T2M_MIN, WS2M y ALLSKY_SFC_SW_DWN, que el caché anterior no traía.

## Cómo reproducir

```bash
python3 scripts/water_climate/run_pipeline.py
```

Usa `requests`, `numpy`, `matplotlib` y `Pillow`. Si el CSV de POWER ya está en `data/derived/water_climate/`, no vuelve a llamar a la API. IMERG y SMAP sí se vuelven a consultar. La demo no debe depender de esa consulta: los JSON ya están en el repositorio.

## Clima

Fuente: NASA POWER Daily API v2.10.3, comunidad AG, fuentes MERRA-2, SYN1DEG y POWER. Elevación que devuelve la geometría del punto: **935.34 m**. El resumen del equipo describe el valle cerca de 400 m. Esta celda de unos 0.5° mezcla valle y montaña; la ET0 se calculó a 935.34 m y no se corrigió a 400 m.

Radiación solar ALLSKY_SFC_SW_DWN está en MJ/m²/día. La documentación de POWER sitúa la meteorología cerca de 0.5° y la radiación solar cerca de 1°.

ET0 diaria: FAO-56 Penman-Monteith (Allen et al. 1998, ecuación 6). La humedad relativa media sustituye a RHmin/RHmax para la presión de vapor real. El viento ya viene a 2 m. En esta corrida las 3653 fechas usaron Penman-Monteith; Hargreaves (ecuación 52) solo entra si falta un insumo.

Resultados de la climatología 2016-2025, en `climate_series.json`:

| Métrica | Valor | Unidad | Confianza |
|---|---:|---|---:|
| Precipitación anual media POWER | 830.562 | mm/año | 0.35 |
| Tmáx diaria media | 28.827 | °C | 0.70 |
| ET0 anual media | 1546.099 | mm/año | 0.60 |
| Meses bajo la mitad de la media del mes calendario | 42 | meses | 0.35 |

Reglas del proyecto, no índices oficiales de ONAMET ni del INDRHI:

- Mes de riesgo de calor: media climatológica de T2M_MAX en el percentil 75 o más de los 12 meses. Umbral resultante 30.118 °C. Meses: julio, agosto y septiembre.
- Mes seco (cuartil): lluvia mensual en el percentil 25 o menos. Umbral 54.485 mm. Meses: enero, febrero y marzo.
- Mes de sequía en un año concreto: lluvia POWER de un mes completo por debajo de la mitad de la media 2016-2025 de ese mes calendario.
- Día caluroso de conteo: T2M_MAX ≥ 32 °C. Es un conteo, no un umbral de daño de cultivo, y no entra en el score.
- Ventana de siembra ilustrativa: lluvia del mes igual o mayor que la mediana de los 12 meses (63.551 mm) y el mes no es de riesgo de calor. Meses: mayo, octubre, noviembre y diciembre. No es una fecha óptima.

La ventana publicada de habichuela roja que usa el inventario del equipo, citando el compendio IDIAF, es del 5 de noviembre al 15 de diciembre, con 250–400 mm de agua por ciclo. Este pipeline no releyó el PDF: https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf

## IMERG y SMAP

`remote_access.json` guarda la prueba del 14 de noviembre de 2026:

- GPM IMERG Final mensual V07 (GPM_3IMERGM) lista el directorio HTTPS, pero el subconjunto OPeNDAP responde 302 hacia `https://urs.earthdata.nasa.gov/oauth/authorize/`. Sin login de Earthdata no hay milímetros.
- GIBS `GetMap` de `IMERG_Precipitation_Rate` devuelve un PNG de consulta (1462 píxeles opacos en una tesela de 64×64 sobre La Española, 15 de junio de 2020). `GetFeatureInfo` no está habilitado. Esos colores no se convirtieron a lluvia.
- SMAP L3 `SMAP_L3_Passive_Enhanced_Day_Soil_Moisture` devolvió un PNG vacío (0 píxeles opacos) en esa fecha y bbox.
- SMAP L4 `SMAP_L4_Analyzed_Surface_Soil_Moisture` devolvió un PNG con 2092 píxeles opacos. No hay escala pública leída en esta corrida, así que no hay humedad en m³/m³.
- AppEEARS rechaza un login vacío (HTTP 400).

Por eso la lluvia de los cálculos es POWER `PRECTOTCORR`. El plan técnico excluye esa lluvia tropical del producto principal de precipitación. Los scores quedan en calidad `preliminary` y confianza 0.35 en la lluvia. No se inventó una serie IMERG.

## Agua de cultivo

FAO-56, tablas 11 y 12, curva de Kc del capítulo 6. Kc mid y Kc end no se ajustaron con la ecuación 62 porque POWER no trae RHmin.

| Cultivo | Kc ini, mid, end | Etapas (días) | Procedencia |
|---|---|---|---|
| Habichuela roja | 0.40, 1.15, 0.35 | 20, 30, 40, 20 | Frijol seco y legumbres; etapas del ejemplo de clima continental |
| Leguminosa del escenario 2 | 0.40, 1.15, 0.35 | 20, 30, 40, 20 | El mismo grupo FAO-56. No se identifica como habichuela roja |
| Maíz grano | 0.30, 1.20, 0.35 | 20, 35, 40, 30 | Kc ini del grupo cereales; Kc end 0.35 es la cosecha en grano seco. Etapas del ejemplo húmedo de Nigeria en junio |
| Guandul como cobertura | 0.40, 1.15, 0.35 | 20, 30, 40, 20 | FAO-56 no lista *Cajanus cajan*. Es un proxy de legumbre, no una duración de cobertura verificada |

Lluvia efectiva mensual, fórmula USDA SCS tal como la implementa FAO CROPWAT (Smith 1992, FAO Irrigation and Drainage Paper 46):

- si P ≤ 250 mm, Peff = P × (125 − 0.2 P) / 125
- si P > 250 mm, Peff = 125 + 0.1 P

Peff se limita a [0, P] y se reparte por los días del mes en que el cultivo está presente. No hay balance de suelo.

El calendario usa el año plantilla 2021 (no bisiesto) y la media de cada mes-día. Cada mes-día, salvo el 29 de febrero, tiene 10 años. El 29 de febrero tiene 3 y no entra en el año plantilla.

Tres secuencias ilustrativas. Hay que revisarlas con un técnico. No son prescripción.

| Escenario | Inicio plantilla | ETc (mm) | Lluvia efectiva (mm) | Riego neto (mm) | Agua/suelo | Clima |
|---|---|---:|---:|---:|---:|---:|
| Habichuela (15 nov) y luego maíz | 2021-11-15 | 806.143 | 414.761 | 433.152 | 3.28 | 2.94 |
| Leguminosa (1 oct) y luego maíz | 2021-10-01 | 755.544 | 458.271 | 336.162 | 5.00 | 3.09 |
| Habichuela, proxy de guandul y luego maíz | 2021-11-15 | 1231.268 | 655.412 | 618.722 | 0.00 | 2.36 |

La ETc de la habichuela del 15 de noviembre es 307.789 mm. Cae dentro del rango 250–400 mm citado del compendio. Eso no calibra las etapas FAO-56: es solo una comparación.

Octubre es el mes de siembra ilustrativa más lluvioso distinto de noviembre. Noviembre queda para la ventana de habichuela. El escenario de tres cultivos dura más y por eso pide más riego en esta cuenta. El 0 y el 5 de agua son los extremos de estos tres escenarios, no una aptitud absoluta.

## Scores

`pillar_scores.json` sigue el contrato de `docs/10_plan_tecnico.md`: `schemaVersion`, `generatedAt`, `caseId`, y por escenario `id`, `label`, `status`, `crops`, `sourceIds` y `pillars`. Cada pilar trae `score`, `scoreScale` 0–5, `summary`, `metrics`, `rulesApplied`, `missingData` y `reviewRisks`. Cada métrica trae valor, unidad, confianza, calidad, procedencia y límite.

- Agua y suelo: `5 × (riego máximo − riego del escenario) / (máximo − mínimo)`. Un valor alto significa menos riego neto estimado que los otros dos. SMAP, SRTM y textura faltan, así que la parte de suelo no se puntúa.
- Clima: `5 × (1 − fracción de días del ciclo en un mes de calor o del cuartil seco)`.

Plagas y mercado no están en estos archivos.

La figura `water_climate_climatology.png` muestra la climatología mensual de lluvia POWER y ET0, y el riego neto de las tres secuencias.

## Lo que no afirma este resultado

No hay predicción de rendimiento, de plagas ni de fecha óptima. No hay lluvia IMERG en milímetros, ni humedad SMAP numérica, ni eficiencia de riego del INDRHI aplicada al cálculo. La confianza de la lluvia POWER es baja a propósito.
