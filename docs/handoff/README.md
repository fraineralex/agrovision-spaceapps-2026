# Handoff (actualizado 2026-11-14, tarde)

Las cuatro ramas de trabajo ya están fusionadas en `main`: `wip/farmer-cards`, `feature/market-dominican-sources`, `feature/fao-giews` y `feature/field-boundaries`. Integración y correcciones de la auditoría de productor: ver `docs/16_asesor_siembra.md` y `AI_USAGE.md`.

## Pendiente y por qué

| Tema | Estado | Qué falta |
| --- | --- | --- |
| Contornos de fincas (SAM) | 10 de 42 ventanas del valle | Correr `scripts/fields` (MobileSAM) en una PC con Python, PyTorch y acceso a las imágenes de Esri. El entorno de la IA no puede bajar esas imágenes. |
| Calendario de siembra provincial (FAO) | La fenología de la FAO solo existe como mapa WMTS | Extraer los valores de inicio de temporada (SOS) por provincia a partir de las imágenes del mapa. Por ahora la app muestra los meses de más siembra nacional (Ministerio de Agricultura). |
| Agua de canales y presas | Sin datos | Niveles de embalses del INDRHI (boletín diario) o datos de las juntas de regantes. El Plan de Contingencia 2026 no trae niveles. |
| Plagas por época | Solo la regla habichuela→maíz (IDIAF) | Tabla de plagas por cultivo y mes del IDIAF o del Ministerio, con su página. |
| Importaciones | Sin datos | Volúmenes de importación por producto (DGA o Ministerio de Agricultura), mensuales. |

Verificación: `cd web && npm run lint && npm test && npm run build && npm run test:e2e`.
