---
name: Siembra
target: web/app/page.tsx
mode: Operate
---

<!-- AI: Codex/OpenAI con Impeccable, 2026-11-15. Revisión de Frainer pendiente; ver AI_USAGE.md. -->
# Siembra

Superficie: pestaña `#siembra` de AgroVision. Dirección visual global: [DESIGN.md](../../DESIGN.md). Este brief conserva la composición autorizada por Frainer el 15-11-2026 y su posterior ampliación a toda la aplicación, registrada en [application.md](application.md).

Productores y técnicos comparan opciones desde teléfono al sol o con poca señal y desde escritorio. La interfaz apoya revisión humana: no convierte señales regionales en mediciones de finca ni predicciones. El piloto es el Valle de San Juan; la IA central analiza imágenes Landsat y no es un chatbot. Un asistente explicativo sigue siendo secundario.

## Direction contract

**THESIS:** Primero entender una recomendación y sus cuatro pilares; después comparar cultivos y guardar un plan. Se conserva identidad agrícola, fuentes y funciones.

**OWN-WORLD:** Modo sol blanco, oscuro verde negro histórico; IBM Plex Sans y Bricolage Grotesque. FarmIcon, estrellas y paneles planos con borde. PlantingPanel reutiliza SectionPanel; CropIdentity y PlantingPillars unifican las comparaciones.

**STORY:** Revisar ubicación y mes, entender señales y límites, explorar todos los cultivos, abrir evidencia y guardar o retomar el plan.

**FIRST VIEWPORT:** Contexto y mes arriba. Recomendación izquierda (1.3fr), pilares derecha (1fr) en 2×2. Nombre recomendado 44px; acciones y fuentes dentro de la recomendación. Hasta 800px se apilan; hasta 600px el nombre usa 32px.

**FORM:** seed: none (pinned). «Recomendación a la izquierda y cuatro pilares en 2×2 a la derecha en escritorio. En móvil se apilan.»

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Composición y comportamiento

Recorrido: contexto y mes → recomendación y pilares → todos los cultivos siempre visibles → objetivos alternativos y plan dentro del mismo panel → suelo → plagas → compartir → precauciones finales. La recomendación tiene la mayor presencia tipográfica; las secciones inferiores no imitan otro hero. Mantener todas las funciones y fuentes, sin añadir pasos, secciones ni datos para decorar.

Una alineación con cabecera y navegación. La pila principal usa 20px, 18px hasta 600px; el bloque de comparación se separa 24px de la recomendación, 8px hasta 800px. Panel con 20px de relleno y 16px hasta 600px. Recomendación con 24px en escritorio y 20px hasta 600px; separación interna 16px, contenido 14px y márgenes de explicación/metadatos a cero para no sumar vacíos. Radios: panel 16px, tarjeta 12px, control 10px. Texto base 16px; títulos de sección 20.8px, 19.2px en móvil; nombres de tarjetas 18px; contexto y evidencia 14–15px. La tipografía usa rem en la implementación.

En escritorio mayor de 1050px, comparación y plagas muestran tres tarjetas por fila. Cuatro cultivos usan dos columnas; cinco se equilibran en 3+2. Con siete o más, comparación usa filas con pistas alineadas para identidad, estrellas, cuatro pilares y precauciones; plagas usa filas de identidad, resumen y detalle. Una precaución o evidencia abierta puede extenderse a todo el ancho sin alterar la alineación de las demás filas.

Entre 601px y 1050px, comparación, opciones y plagas usan una lista de filas, cada una con dos columnas internas; los pilares quedan a la derecha de la identidad y valoración. Hasta 600px vuelven a tarjetas de una columna. Opciones usa auto-fit con mínimo de 280px y reparte cinco tarjetas en 3+2 en escritorio. A 1050px el bloque superior ajusta proporción a 1.1fr / 1fr; a 800px se apila. Sus cuatro pilares siguen en 2×2. El formulario pasa de tres columnas a dos hasta 800px y una hasta 600px. Los tres resúmenes de suelo se alinean en escritorio y se apilan hasta 800px; listas y motivos de suelo se ajustan al ancho disponible.

PlantingPlan vive dentro de Otras opciones y conserva guardar, retomar y borrar. Ayudas, precauciones, taxonomía y fuentes pueden plegarse; todos los cultivos y paneles principales permanecen visibles. No elipsis en nombres de cultivos ni estados. La ausencia de datos se explica. La UI usa español dominicano y conserva nombres científicos y oficiales.

## Verificación exigida

Esta es una matriz de requisitos, no una declaración de pruebas completadas. El resultado visual final y la revisión humana se registran por separado; una captura no valida el contenido agronómico.

- Revisar 1366×900 y 390×844, más anchos de 360px y 768px para desbordamientos, en ambos temas.
- Revisar nombres largos, conjuntos de 3, 4, 5, 7 y 11 cultivos, sin finca guardada y con finca existente; comprobar alineación de filas y grupos incompletos.
- Guardar, retomar y borrar plan; cambiar mes y comprobar fuente/evidencia.
- Desplegar plagas, ayudas y precauciones; probar chat lateral, navegación y menús abiertos.
- Comprobar teclado, foco visible, orden de lectura, controles táctiles y estados vacíos, guardados, error y deshabilitados.
- Verificar TypeScript, ESLint de archivos modificados, pruebas del motor y accesibilidad del flujo.

## Límites de documentación

La captura de tokens corresponde al código actual. El tamaño compacto de algunas etiquetas y las excepciones heredadas de controles secundarios no se convierten en un objetivo de accesibilidad: verificar su lectura y tamaño táctil en la revisión. Las cinco pestañas pertenecen ahora al alcance de mejora; esta guía documenta las reglas específicas de Siembra y no sustituye la matriz de aplicación.
