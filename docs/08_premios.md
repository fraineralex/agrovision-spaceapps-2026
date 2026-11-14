# Cómo destacar en cada premio

> Documento redactado con asistencia de IA (Grok Bot, asistente de Frainer) el 14-11-2026, revisado por el equipo. Registrado en AI_USAGE.md.

Idea central: una sola historia (un productor de San Juan decide qué sembrar la próxima temporada) que sirve para los 10 premios. Cada premio se gana con una pieza concreta de la demo, no con un producto distinto.

| Premio | Qué buscan | Qué hacemos nosotros | Evidencia en la entrega |
|---|---|---|---|
| Best Use of Science | Uso válido de ciencia y método científico | Hipótesis explícita por rotación, métricas con unidades, escala y confianza; separar medición, regla agronómica y preferencia; mostrar límites (POWER 0.5°, SMAP 9 km no son parcela) | Sección "Metodología" en la app y en el README; tabla de supuestos e incertidumbres |
| Best Use of Data | Hacer accesibles los datos espaciales | Combinar POWER + IMERG + SMAP + NDVI (Sentinel-2/Landsat) + GAEZ en una sola tarjeta entendible; cada número con fuente y fecha clicable | Panel "De dónde sale este dato"; datasets citados con DOI/URL |
| Best Use of Technology | Uso más innovador de tecnología | Backend FastAPI con caché offline, scoring transparente, LLM por API que solo explica el JSON de métricas (sin alucinar) y, si da tiempo, voz/WhatsApp en español dominicano | Diagrama de arquitectura; demo funcionando sin internet |
| Galactic Impact | Mayor potencial de mejorar la vida en la Tierra | Reducir riesgo de pérdida por sequía y sobreoferta para pequeños productores; métrica de impacto: tareas y productores del Valle de San Juan | Diapositiva de impacto con cifras citadas de docs/03 |
| Best Mission Concept | Concepto y diseño más plausibles | Usuario definido (productor + extensionista), alcance realista, hoja de ruta: piloto con una asociación de San Juan, luego IDIAF/Agricultura | Diapositiva "Cómo llega a producción" con costos y aliados |
| Most Inspirational | El que llega al corazón | Abrir el video con un productor real o su testimonio (Karla/Luis), la historia de botar cosecha por sobreoferta o perderla por sequía | Primeros 20 segundos del video |
| Best Use of Storytelling | Comunicar datos abiertos con creatividad | Narrativa "tu temporada se movió": antes/después de lluvias en San Juan con 10 años de NASA POWER, animación del calendario | Video y pantalla de la línea de tiempo |
| Global Connection | Conectar personas en el mundo | Diseño replicable: cualquier pin del mundo funciona con datos globales; español e inglés; código abierto | Demo cambiando el pin a otro país; README en inglés corto |
| Art & Technology | Combinar lo técnico y lo creativo | Visual cuidado: mapa con capas GIBS, iconos de cultivos, paleta tierra; ilustración del ciclo de rotación | Capturas de UI y portada del video |
| Local Impact | Mayor potencial de impacto local | Enfoque San Juan y Cibao, cultivos dominicanos (habichuela, maíz, guandul, arroz, plátano), riego Sabana Yegua, precios del Ministerio de Agricultura | Caso San Juan en la demo y cifras de docs/03 |

## Prioridad si falta tiempo
1. Local Impact, Best Use of Data y Best Use of Science: son el núcleo y salen solos si la demo de San Juan funciona bien.
2. Storytelling y Most Inspirational: dependen del video, reservar el domingo de 13:00 a 18:00 para eso.
3. Technology, Art & Technology y Global Connection: pulido de UI, modo offline y cambiar el pin a otro país.
4. Mission Concept y Galactic Impact: dos diapositivas bien hechas.

## Checklist de la entrega
- [ ] Demo con caso San Juan funcionando offline
- [ ] Cada métrica con fuente, fecha, escala y confianza
- [ ] Video: gancho humano, problema, datos NASA, demo, impacto, uso de IA citado
- [ ] Diapositivas de metodología, impacto, hoja de ruta y uso de IA
- [ ] README con resumen en inglés
- [ ] AI_USAGE.md completo
