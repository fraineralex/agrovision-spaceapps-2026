---
name: Aplicación AgroVision
target: web/app/workspace.css
mode: Operate
---

<!-- AI: Codex/OpenAI con Impeccable, 2026-11-15. Revisión de Frainer pendiente; ver AI_USAGE.md. -->
# Aplicación AgroVision

Frainer amplió el alcance a toda la aplicación: eliminar espacios vacíos llamativos, mejorar UI y UX y conservar identidad, funciones, contenido y fuentes. [DESIGN.md](../../DESIGN.md) es la dirección visual vigente; [PRODUCT.md](../../PRODUCT.md) conserva las restricciones de producto. Sin cambios del motor de datos ni nuevas afirmaciones agronómicas.

## Direction contract

**THESIS:** Cada pestaña usa el ancho para completar su tarea; la densidad proviene de agrupar información relacionada y retirar envoltorios y alturas sobrantes.

**OWN-WORLD:** Superficies blancas en modo sol y verde negro histórico en oscuro; cabecera bosque sólida, IBM Plex Sans y Bricolage Grotesque. SectionPanel une icono, título, ayuda y contenido; FarmIcon y gráficos existentes mantienen identidad.

**STORY:** Elegir sección, entender su dato o acción principal, revisar fuentes y completar el flujo sin perder contexto de finca ni asistencia.

**FIRST VIEWPORT:** Cabecera compacta con nombre de sección, barra de finca y navegación compartidas. La tarea propia ocupa el ancho disponible; los detalles relacionados aparecen después o al lado según ancho, sin columnas vacías.

**FORM:** seed: none (pinned). «Toda la aplicación», «eliminar espacios en blanco» y conservar identidad y funciones son el alcance explícito. Las composiciones se registran abajo a partir del código actual.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Composición por tarea

- **Siembra:** recomendación y pilares primero; comparaciones adaptadas al número de cultivos, opciones y plan, suelo y plagas. Reglas detalladas en [siembra.md](siembra.md).
- **Lluvia:** resumen y días con detalle seleccionado debajo; controles de riego y fecha agrupados después, sin columna lateral vacía. En móvil los días se desplazan horizontalmente y el detalle pasa a una columna.
- **Venta:** calculadora antes de Precio y mercado. El formulario agrupa campos con acción al lado en escritorio; mercado tiene columnas internas de precio actual y contexto. Hasta 800px se apilan; hasta 600px los campos usan una columna.
- **Fincas:** mapa a todo el ancho seguido de contexto. GPS, búsqueda y provincia comparten fila en escritorio; resultados crecen hacia abajo con scroll. Clima dispone gráfico y métricas relacionados; se apilan según ancho. Mapa de 360px, 320px hasta 600px.
- **Ayuda:** «Tu consulta» a la izquierda (1.25fr), instrucciones a la derecha (.75fr); hasta 1050px se ajustan a 1.2fr / .8fr y hasta 800px se apilan con la consulta primero, también en orden DOM y teclado. «Escribe tu pregunta o usa la voz» orienta la acción. La guía limita la consulta a siembra, lluvia, sequía o precios con los datos disponibles. Asistencia explicativa opcional conserva voz y escritura; fuera de Ayuda no se añade otro panel expandido.
- **Fuentes:** directorio de lectura de hasta 1100px, fuente y descripción en dos columnas; hasta 600px cada entrada se apila. Mantener enlaces, procedencia y límites.

## Estructura y adaptación

`workspace.css` posee shell, SectionPanel, composiciones de tarea, footer, fuentes y onboarding. `planting.css` posee las excepciones de Siembra; no hay selectores `#siembra` en workspace.css. Los tokens de tema permanecen en globals.css/theme-dark.css. Fold y PlantingPanel reutilizan `ui/section-panel.tsx`; el cuerpo elimina otro marco de tarjeta cuando solo repetiría el panel exterior.

Workspace de hasta 1440px, separación de tareas de 20px. SectionPanel usa 20px de interior y radio de 16px; hasta 600px, interior de 16px y radio de 12px. La cabecera usa nombre de sección, sin duplicar finca. Hasta 760px la navegación baja al borde inferior: una única reserva del workspace evita tapar el cierre. Footer sin caja, dos columnas en escritorio y una en móvil, con fuentes y atribuciones en su lugar.

Onboarding: cuadrícula de cultivos arriba y tres grupos de condiciones debajo en escritorio; hasta 600px cultivos en dos columnas y condiciones apiladas. El paso de ubicación se ancla arriba y crece hacia abajo hasta la altura disponible, con scroll. En móvil, tarjeta acotada a la pantalla con margen de 12px; no recuperar una altura fija de 604px.

## Verificación exigida

Requisitos de revisión, no certificación ni declaración de resultados completados. La revisión visual de las tareas y estados tiene prioridad para resolver espacios vacíos, recortes, superposiciones y jerarquía. Registrar resultados observados por separado; pruebas automáticas no sustituyen esa revisión.

- Revisar las cinco pestañas en escritorio claro y oscuro y móvil, además de 360px y 768px para desbordamientos; verificar navegación y footer sin doble reserva.
- Revisar finca existente y estado inicial sin finca, fuentes, búsqueda de ubicación y sus resultados, todos los pasos de onboarding y contenido largo.
- Revisar conjuntos de cultivos y filas según el brief de Siembra; menús abiertos, foco y ayudas, fuentes, precauciones, plan y asistente lateral.
- Recorrer calculadora y mercado, selección de día y controles de riego, búsqueda/mapa, ayuda escrita y estados del asistente disponibles en el entorno.
- Preservar revisión de teclado, etiquetas, ausencia de datos, errores y contraste en ambos temas. Documentar estados dependientes de red, micrófono o servicios que no se hayan podido verificar.
