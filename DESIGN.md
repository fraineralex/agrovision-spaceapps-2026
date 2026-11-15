---
name: AgroVision
description: Campo y evidencia para comparar opciones de siembra
colors:
  forest-heading: "#104b2b"
  sun-background: "#f6f8f4"
  sun-foreground: "#102418"
  sun-primary: "#14532d"
  sun-card: "#ffffff"
  sun-elevated: "#f4f8f5"
  sun-muted-surface: "#e9f2ec"
  sun-muted: "#425a4c"
  sun-border: "rgba(20, 83, 45, 0.14)"
  sun-input: "rgba(20, 83, 45, 0.28)"
  sun-focus: "#15803d"
  sun-success: "#115e32"
  sun-water: "#0369a1"
  sun-status-green-bg: "#dcfce7"
  sun-status-green-fg: "#115e32"
  sun-status-amber-bg: "#fef3c7"
  sun-status-amber-fg: "#854d0e"
  sun-status-red-bg: "#fee2e2"
  sun-status-red-fg: "#991b1b"
  sun-status-gray-bg: "#eef2f6"
  sun-status-gray-fg: "#334155"
  dark-background: "#0b120d"
  dark-foreground: "#ededce"
  dark-primary: "#ddff86"
  dark-card: "#151e17"
  dark-elevated: "#1d2a20"
  dark-muted-surface: "#213025"
  dark-muted: "#b8c6b4"
  dark-border: "#37483a"
  dark-input: "#6c826e"
  dark-water: "#bed5e5"
  dark-status-green-bg: "#213b28"
  dark-status-green-fg: "#d5efba"
  dark-status-amber-bg: "#382e1c"
  dark-status-amber-fg: "#e9ca8c"
  dark-status-red-bg: "#3b2328"
  dark-status-red-fg: "#ffa4a4"
  dark-status-gray-bg: "#28302b"
  dark-status-gray-fg: "#c4cdc0"
typography:
  workspace-heading:
    fontFamily: "Bricolage Grotesque, IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  display:
    fontFamily: "Bricolage Grotesque, IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.75rem)"
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.5
  planting-recommendation:
    fontFamily: "Bricolage Grotesque, IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  planting-section:
    fontFamily: "Bricolage Grotesque, IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 750
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  planting-crop:
    fontFamily: "Bricolage Grotesque, IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 750
    lineHeight: 1.35
  planting-evidence:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.9rem"
    lineHeight: 1.5
rounded:
  section-panel: "16px"
  section-panel-mobile: "12px"
  navigation: "12px"
  navigation-tab: "9px"
  global-control: "12px"
  planting-panel: "16px"
  planting-card: "12px"
  planting-control: "10px"
  planting-state: "8px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  section-inset: "20px"
  space-6: "24px"
components:
  section-panel-sun:
    backgroundColor: "{colors.sun-card}"
    textColor: "{colors.sun-foreground}"
    rounded: "{rounded.section-panel}"
    padding: "20px"
  section-panel-dark:
    backgroundColor: "{colors.dark-card}"
    textColor: "{colors.dark-foreground}"
    rounded: "{rounded.section-panel}"
    padding: "20px"
  planting-primary-sun:
    backgroundColor: "{colors.sun-primary}"
    textColor: "{colors.sun-card}"
    rounded: "{rounded.planting-control}"
    padding: "10px 16px"
  planting-primary-dark:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-background}"
    rounded: "{rounded.planting-control}"
    padding: "10px 16px"
  planting-panel-sun:
    backgroundColor: "{colors.sun-card}"
    textColor: "{colors.sun-foreground}"
    rounded: "{rounded.planting-panel}"
    padding: "20px"
  planting-panel-dark:
    backgroundColor: "{colors.dark-card}"
    textColor: "{colors.dark-foreground}"
    rounded: "{rounded.planting-panel}"
    padding: "20px"
---

<!-- AI: Codex/OpenAI con Impeccable, 2026-11-15. Revisión de Frainer pendiente; ver AI_USAGE.md. -->
# Design System: AgroVision

## Overview

**Creative North Star: "Campo y evidencia"**

AgroVision conserva su identidad agrícola: verde bosque en marca y navegación, cultivos ilustrados con FarmIcon, estrellas comparativas y datos con sus fuentes. La jerarquía permite leer la recomendación, comparar señales y abrir evidencia sin convertir la interfaz en una promesa agronómica.

Esta guía sustituye los criterios visuales contradictorios de auditorías y notas anteriores. Alcance ampliado explícitamente por Frainer en esta conversación el 15-11-2026: mejorar UI y UX de toda la aplicación y eliminar espacios vacíos llamativos conservando identidad, contenido y funciones. La dirección oficial de producto, evidencia, autoría y privacidad de AGENTS.md sigue vigente. El piloto es el Valle de San Juan. No se cambia el motor de datos por una decisión visual.

**Key Characteristics:**
- Dos temas: superficies blancas en modo sol y verde negro histórico en oscuro.
- IBM Plex Sans para lectura; Bricolage Grotesque para títulos y cifras destacadas.
- Iconos existentes, estados con palabras y color, fuentes a mano.
- Paneles compartidos, densidad legible y jerarquía estable en las cinco pestañas, fuentes y onboarding.

Tokens extraídos de `web/app/globals.css`, `web/app/theme-dark.css`, `web/app/workspace.css`, `web/app/planting.css` y `web/app/layout.tsx`. Los prefijos `sun-` y `dark-` documentan ambas variantes; el código usa variables semánticas sin esos prefijos. Estrategia y revisión de las superficies: [.impeccable/surfaces/application.md](.impeccable/surfaces/application.md) y [.impeccable/surfaces/siembra.md](.impeccable/surfaces/siembra.md).

## Colors

Paleta agrícola de verde bosque, superficies claras o verde negro y azul para agua y evidencia.

### Primary
- **Verde bosque:** acción principal del modo sol y presencia de marca en la cabecera.
- **Bosque de cabecera:** campo sólido de marca compartido por las pestañas, con títulos blancos; no es otra variante de superficie del tema.
- **Verde lima histórico:** acción principal, foco y señal favorable en oscuro. El texto sobre acción usa el fondo oscuro; en modo sol usa blanco.

### Secondary
- **Azul agua:** enlaces de fuente e indicadores de agua. Su equivalente oscuro conserva lectura sobre las superficies verde negro.
- **Estados:** verde favorable, ámbar atención, rojo precaución y gris información insuficiente. Usar las familias existentes `--status-*-bg/fg/border`; la etiqueta siempre explica el significado.

### Neutral
- **Blanco y verde claro:** fondo, tarjetas y superficies secundarias del modo sol.
- **Verde negro y verde profundo:** fondo, tarjetas y superficies elevadas del oscuro.
- **Tinta, texto secundario y bordes:** variables semánticas del tema, incluidos controles y desplegables.

**The Shared Palette Rule.** Ningún componente define su propia paleta. La recomendación usa la misma superficie que las otras tarjetas y se identifica con texto; no se introduce otra variante marfil del modo sol.

## Typography

**Display Font:** Bricolage Grotesque, con IBM Plex Sans y sans serif como respaldo.
**Body Font:** IBM Plex Sans, con ui-sans-serif y system-ui como respaldo.

Se conservan las familias ya cargadas mediante `next/font`; no se añade otra. `workspace-heading` describe el título compartido de la pestaña. Los valores con prefijo `planting-` describen Siembra; su título de sección también se reutiliza en SectionPanel.

### Hierarchy
- **Display:** token global adaptable para títulos principales.
- **Workspace heading:** título de sección de la aplicación; con finca activa dice «Siembra», sin repetir el nombre de finca que ya aparece en su barra.
- **Planting recommendation:** mayor presencia tipográfica de Siembra; se reduce en móvil según su brief.
- **Planting section:** encabezados consistentes de sección, acompañados por un icono.
- **Planting crop:** nombres de cultivos en comparación, opciones y plagas.
- **Body / planting evidence:** lectura y contexto secundario; no recortar nombres ni estados con elipsis. La explicación principal admite hasta 60ch; suelo y evidencia, hasta 75ch.

**The Readable Evidence Rule.** Mantener nombres y estados completos, numerales tabulares en métricas y contraste de texto secundario en ambos temas. La UI usa español dominicano; nombres científicos y nombres oficiales de fuentes se preservan.

## Layout

Un ancho de contenido alineado con cabecera y navegación. El workspace limita su ancho a 1440px, con 24px de margen interior horizontal en escritorio, 16px hasta 800px y 12px hasta 760px. Los contenidos ocupan el ancho disponible sin columnas laterales vacías ni alturas impuestas para igualar paneles. El directorio de fuentes conserva un ancho de lectura propio de 1100px.

La escala reutiliza `space-*` y el interior compartido de sección de 20px. Paneles de trabajo se separan normalmente 20px; tarjetas, 16px; grupos internos, 8–12px. SectionPanel usa 20px de interior y 16px hasta 600px. Siembra comparte ese interior, pero conserva su radio de 16px y sus reglas de cuadrícula en planting.css. El contenido de recomendación usa separación explícita, sin acumular márgenes de párrafo y contenedor. Las filas densas alinean las mismas columnas para cada cultivo.

Hasta 760px la navegación pasa al borde inferior y el workspace reserva el espacio necesario una sola vez; el footer es compacto, sin otra tarjeta ni una segunda reserva inferior. Los menús, búsquedas y onboarding crecen hacia abajo con límites de altura y scroll, sin desplazar innecesariamente los controles superiores. Los briefs documentan las composiciones por tarea y la matriz de revisión.

Los desplegables se apilan encima de sus vecinos; el menú conserva scroll propio y no recorta opciones. El orden de lectura y teclado sigue el visual. Los objetivos táctiles deben alcanzar 44px; los controles principales de Siembra implementan 46px.

## Elevation & Depth

SectionPanel, navegación y footer usan superficies planas; Siembra también mantiene recomendación y tarjetas sin sombra. Los divisores estructuran los cuatro pilares y separan grupos. Los menús flotantes conservan la sombra de superposición existente; no se extiende a cada tarjeta.

### Shadow Vocabulary
- **Menú de selección:** sombra de superposición existente, documentada como `select-menu`.

**The Flat Workspace Rule.** En paneles compartidos, no acumular sombra, halo y borde; la jerarquía se construye con espacio, texto y divisores. La transición de controles es breve y respeta reducción de movimiento.

## Shapes

Esquinas suaves sin convertir cada fragmento en cápsula. El panel compartido usa `section-panel` y su variante móvil; la navegación tiene su radio propio. `global-control` conserva el radio de los controles existentes; Siembra usa los específicos de tarjeta, control y estado. Los bordes principales de paneles son de 1px. No se usan tarjetas dentro de tarjetas para cada fragmento de texto.

## Components

### Buttons
Acciones con texto y, cuando corresponde, icono Lucide. La principal usa `--primary` y `--primary-foreground`; la secundaria, superficie y borde de entrada. En Siembra, relleno de 10px 16px, altura mínima de 46px y radio `planting-control`. Foco visible, guardado, error y deshabilitado deben ser distinguibles.

### Inputs / Fields
CustomSelect conserva superficie, texto y borde del tema; el seleccionado usa los colores de acción principal. Siembra aplica su radio de control. El menú abierto supera las secciones vecinas y permite revisar todas las opciones. Los estados vacíos explican qué falta, sin completar datos automáticamente.

### Cards / Containers
`SectionPanel` es la estructura compartida de encabezado y cuerpo de la aplicación: icono de 21px, título y ayuda discreta. `Fold` y `PlantingPanel` lo reutilizan; las secciones principales permanecen abiertas. Su encabezado evita duplicar el título de una tarjeta interior. `CropIdentity` y `CropSourceButton` reutilizan nombre, FarmIcon, marca textual de recomendación y acceso a evidencia en comparación, opciones y plagas. Las tarjetas comparten superficie y borde del tema.

### Chips
`PlantingPillars` muestra cuatro estados con etiqueta, palabra y color. Las pastillas de distribución resumen el conjunto existente sin cambiar los cálculos. Estrellas y barras conservan sus significados; ni tamaño ni color añaden una afirmación nueva.

### Navigation
Conserva marca verde bosque, iconos y pestaña activa con colores principales del tema. La navegación tiene cinco columnas y selección mediante `aria-selected`; el hover usa superficie elevada y el foco es visible. Hasta 760px pasa al borde inferior, con iconos y etiquetas, sin tapar acciones ni duplicar reservas de espacio.

### Signature components
`FarmIcon`, `Stars`, `WaterGauge` y gráficos existentes se reutilizan sin alterar cálculos. Se preservan fotografías del onboarding y atribuciones; no se sustituyen ilustraciones por fotografías arbitrarias. `PestOverview` presenta nombres comunes y resumen con taxonomía, fuentes y límites bajo demanda. `PlantingPlan` conserva almacenamiento, mes y cultivo.

La composición compartida, las cinco áreas de trabajo, fuentes y onboarding pertenecen a `web/app/workspace.css`; las reglas específicas de Siembra, a `web/app/planting.css`; los tokens de tema, a `globals.css` y `theme-dark.css`. `workspace.css` no contiene selectores `#siembra`. El CSS global no debe reintroducir composición antigua ni variaciones locales de paneles. Las reglas existentes de `theme-dark.css` se limitan a colores semánticos. Editar la regla vigente sin añadir bloques de correcciones al final. La estructura compartida vive en `web/components/ui/section-panel.tsx`.

## Do's and Don'ts

### Do:
- **Do** reutilizar componentes, iconos, tipografías, gráficos y fuentes existentes.
- **Do** expresar estados con palabras además de color, incluido «Sin datos».
- **Do** conservar foco visible, lectura completa y acceso a evidencia en ambos temas.
- **Do** mantener fuente, período, unidad, escala espacial y confianza/calidad de cada métrica, distinguiendo observación, reanálisis, regla y dato declarado.

### Don't:
- **Don't** añadir una paleta local, otra familia tipográfica o una variante marfil del modo sol.
- **Don't** ocultar cultivos para simplificar la comparación ni añadir pasos o datos decorativos.
- **Don't** convertir señales regionales en mediciones de finca o presentar predicciones de rendimiento, plagas o rentabilidad garantizada.
- **Don't** cambiar cálculos, fuentes, privacidad ni dirección oficial de producto por una decisión visual.
