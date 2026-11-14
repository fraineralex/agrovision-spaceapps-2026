# Plan: linderos de fincas, vista simple y datos FAO

## 1. Linderos de fincas (parcelas aproximadas)
- Objetivo: dibujar las divisiones entre fincas, parcelas, tareas y cercas de tierra del Valle de San Juan, para que cada agricultor toque y vea su propia finca, aunque sea pequeña.
- Imagen base: Esri World Imagery (menos de 1 m/píxel, zoom 17-18).
- Método: Segment Anything (SAM / samgeo) sobre la imagen Esri. Fields of The World (Sentinel-2, 10 m) como alternativa. Detección de bordes como último recurso.
- Filtros: 0.05 a 50 ha. Se quitan casas, caminos y agua, y se simplifica la geometría.
- Salida: `data/derived/fields_san_juan.geojson`, más una versión ligera en `web/public/data/`.
- Cada finca lleva id, área, centroide, fuente y confianza.
- Etiqueta en la app: "Parcelas aproximadas (detectadas por satélite, no catastrales)". Luego se extiende a otras provincias.

## 2. Vista simple por finca
- Una sola recomendación arriba, con un semáforo grande y una frase sencilla. Ejemplo: "Conviene rotar a habichuela: menos agua y buen precio".
- Los 4 pilares (agua y suelo, clima, plagas, mercado) como íconos de color.
- Los detalles técnicos (Kc-día, FAO-56, fuentes, confianza) van en "Ver detalles", cerrado por defecto.
- Usar los datos reales de clima, plagas (reglas IDIAF) y mercado. "Sin datos" solo cuando de verdad falten.

## 3. FAO GIEWS (contexto regional de sequía)
- Fuente: https://www.fao.org/giews/earthobservation/country/index.jsp?lang=es&code=DOM
- Usar: el Índice de Estrés Agrícola (ASI) y el VHI por provincia, la frecuencia histórica de sequías (1984-2025) y la fenología (inicio y fin de temporada). Sirven para la alerta de sequía por provincia, el pilar clima y para elegir la mejor época de siembra.
- Límite: la resolución es de unos 1 km y los datos son por provincia, así que no sirven para una finca individual.
- Integración: capa WMTS opcional en el mapa, más estadísticas por provincia (GAUL nivel 1 o 2) cacheadas en `data/derived/`.

## Uso de IA
Plan redactado con ayuda de IA (Grok Bot) a partir de las instrucciones de Frainer Encarnación.
