> Registro histórico de decisiones y hallazgos. Para diseño visual vigente, seguir [DESIGN.md](../DESIGN.md). Los límites de evidencia y necesidades de producto aquí documentados se conservan.

# 17 · Auditoría de UI, UX y accesibilidad (14-11-2026)

Hecha con Claude (Anthropic) y las skills `frontend-design`, `web-design-guidelines` y `shadcn`. Capturas con Playwright a 360×800 (Android barato) y 1280×800 (escritorio):

- Antes: `docs/ui-audit/before/` (onboarding, selector de finca, inicio, panel de fuentes).
- Después: `docs/ui-audit/after/` (las mismas pantallas).

Usuario de referencia: productor dominicano de más de 50 años, teléfono Android barato, al sol y con poca señal. Español del campo, sin jerga en las pantallas principales.

Dirección visual: “campo dominicano”. Verde monte `#1f4d2c`, tierra `#6b4226`, sol `#f2b705` como acento, cielo `#1d5f9e` para enlaces y papel `#f5f7f0` de fondo. Texto de 18 px. Íconos lucide junto a palabras y colores, nunca color solo. Los tokens están en `web/app/globals.css` (`:root`).

| # | Hallazgo | Severidad | Arreglo | Estado |
|---|---|---|---|---|
| 1 | Las tarjetas estaban plegadas: el productor no veía lluvia, ganancia ni mercado sin tocar. | Alta | Todas las secciones están siempre abiertas (`Fold` ahora es un panel). También están abiertas la comparación de cultivos, la sequía y el clima. | Hecho |
| 2 | En escritorio todo iba en una columna estrecha. | Media | Dos columnas desde 960 px: la recomendación, las 5 opciones, la lluvia y la ganancia a la izquierda; el mapa, el mercado, la sequía y el clima a la derecha (columna fija al bajar). | Hecho |
| 3 | El mapa salía muy abajo. | Alta | En escritorio está arriba a la derecha. En móvil va justo después de la recomendación. | Hecho |
| 4 | Fórmulas a la vista (Kc·día, “resta un punto”, umbrales ASI/VHI, fórmula de anomalía). | Alta | Se quitaron de la interfaz. Quedan los datos, la fecha y el enlace a la fuente. Los métodos siguen documentados en `docs/`. | Hecho |
| 5 | Una sola recomendación, sin comparar con seguir igual. | Alta | Tarjeta “Compara 5 opciones”: gastar menos agua, vender a mejor precio, tener menos plagas, aguantar la sequía y seguir con el cultivo actual. Cada una tiene su semáforo en palabras y el botón “¿De dónde sale esto?”. | Hecho |
| 6 | El onboarding tenía 6 pasos, incluido “¿Qué te importa más?”. | Media | Ahora tiene 3 pasos (dónde, marcar finca, qué siembras y riego), con barra de progreso, “Saltar” en cada paso y “Atrás”. La prioridad se reemplaza por las 5 opciones. | Hecho |
| 7 | El selector de finca no tenía un “listo” claro. | Media | El botón “Listo: N tareas” o “Saltar este paso” es grande. Se puede deshacer (quitar pieza, borrar todo). | Hecho |
| 8 | La tarjeta de voz no se leía: el texto claro quedaba sobre fondo blanco. | Crítica | La tarjeta tiene fondo verde monte y texto claro (contraste AA). Se quitó la etiqueta “4 · PREGÚNTALE” duplicada. | Hecho |
| 9 | La ganancia se salía de la pantalla a 360 px (scroll horizontal). | Alta | En teléfonos, las tres filas se apilan y el monto no se parte. La prueba e2e comprueba que no hay scroll horizontal. | Hecho |
| 10 | Jerga en mercado (“Serie: maize:…”). | Media | Se quitó. Queda “Precio mayorista promedio del mes en Santo Domingo” con la fuente. | Hecho |
| 11 | Emojis como íconos de botones (🔎, 📍, 📲, 📄, 🌧️). | Baja | Se cambiaron por íconos lucide con `aria-hidden` y texto visible. Los emojis de cultivos se quedan como ilustración. | Hecho |
| 12 | axe: `aria-required-children` en las pestañas de finca (el botón “Agregar” estaba dentro del `tablist`). | Seria | El `tablist` solo contiene las fincas. “Agregar finca” queda fuera. | Hecho |
| 13 | axe: `aria-prohibited-attr` en `#map` (`aria-label` sin rol). | Seria | Se añadió `role="region"`. | Hecho |
| 14 | axe: `label-content-name-mismatch` en el botón flotante de voz. | Seria | El nombre accesible empieza con el texto visible “Preguntar”, más texto solo para lectores de pantalla. | Hecho |
| 15 | El botón flotante de voz apuntaba a `#voz`, que no existía. | Alta | El panel de voz tiene `id="voz"`. El botón está en la zona del pulgar (abajo a la derecha). | Hecho |
| 16 | Faltaban enlace para saltar al contenido, landmarks e idioma. | Media | Se añadieron el enlace “Saltar al contenido”, `header`/`main`/`nav`, `lang="es-DO"`, foco visible de 3 px, `prefers-reduced-motion`, objetivos de 44 px o más y texto de 18 px. | Hecho |
| 17 | El texto pequeño de ganancia medía 13 px. | Baja | Ahora mide 15 px. | Hecho |

## Pruebas

- `web/tests/demo.spec.ts` corre `@axe-core/playwright` con las etiquetas WCAG 2.0, 2.1 y 2.2 A/AA en:
  - el onboarding;
  - el inicio a 360 px;
  - el panel de fuentes;
  - el inicio a 1280 px.
- La prueba falla con cualquier hallazgo serio o crítico. Se excluye el lienzo WebGL del mapa.
- También comprueba lo siguiente:
  - hay 5 opciones con los 4 objetivos y “seguir igual”;
  - los paneles están abiertos sin tocar nada;
  - el mapa está a la derecha y dentro de la primera pantalla en escritorio;
  - no hay scroll horizontal a 360 px.

## Pendiente

- Probar con productores reales al sol (contraste y tamaño en la práctica) y con TalkBack.
- El mapa satelital necesita internet. Sin señal, la alternativa es la lista de provincias y el campo de búsqueda.
- La sección “Para técnicos” y “Más capas de la NASA” siguen plegadas a propósito: son herramientas avanzadas, no tarjetas del productor.
- Solo existe el botón de shadcn. Los demás controles usan CSS propio con los mismos tokens.
