# 04. Producto MVP

## Usuario objetivo

Agente de extensión agropecuaria que acompaña a pequeños y medianos productores del valle de San Juan. El productor participa con ubicación aproximada, cultivo previo, disponibilidad declarada de riego y prioridad. La app móvil web compara opciones sin imponer una decisión.

## Propuesta

Mapa centrado en San Juan de la Maguana, selección de punto, una ficha climática regional respaldada por POWER y tres secuencias de cultivo comparables. Cada tarjeta enseña razones, puntaje por criterio, fuente/escala y riesgos. Compartir una tarjeta por mensajería puede quedar como extra. La conversación del equipo registró que el chatbot se había descartado para el MVP; una explicación por API de LLM es una posibilidad posterior y debe aprobarse como alcance por el equipo.

## Tres rotaciones ilustrativas

Estas opciones son escenarios para revisión, no calendarios agronómicos prescritos. Las fechas y cultivos definitivos dependen de validación con productor y ficha local.

1. **Línea base declarada:** habichuela roja de invierno seguida del cultivo que informe el productor (por ejemplo maíz). Captura la práctica real antes de comparar; todavía falta entrevista para fijar secuencia/fechas.
2. **Leguminosa → maíz:** alternar habichuela o guandul con maíz en el ciclo siguiente, condicionado por ventana de lluvia/agua y restricciones fitosanitarias. Potencial: diversificación, posible aporte de nitrógeno e interrupción de ciclos de plaga. El efecto real depende del manejo y suelo.
3. **Habichuela → cobertura leguminosa corta → maíz:** cobertura o abono verde entre ciclos solo si existe humedad/agua y ventana viable. Potencial: cubrir suelo y reducir exposición a erosión. Riesgos: consumo de agua, demora de siembra y competencia por recursos. Guandul no debe prescribirse sin verificar duración y veda.

## Scoring explicable de 0 a 5

Para cada alternativa calcular criterios separados y publicar la regla y los datos usados:

- Ajuste de ventana térmica: 0 desfavorable, 5 favorable según umbrales de ficha de cultivo validada.
- Riesgo de déficit hídrico: 0 alto, 5 bajo, usando lluvia y ET0/proxy con escala regional.
- Cobertura del suelo: 0 exposición prolongada, 5 mayor cobertura prevista según secuencia.
- Aporte potencial de leguminosa: 0 ausente, 5 rasgo presente; es una regla cualitativa, no nitrógeno medido.
- Factibilidad declarada: 0 incompatible con acceso a agua/maquinaria/preferencia ingresada, 5 compatible.

Puntaje total como promedio ponderado 0-5 según prioridad que elige la persona. Mostrar cada componente, pesos, fuente, periodo, resolución, confianza y dato faltante. No presentar el total como rendimiento, probabilidad de éxito ni rentabilidad. En el primer prototipo, usar valores normalizados y reglas visibles; no inventar calibración empírica.

## Uso de IA

El trabajo inicial del equipo descarta chatbot para el MVP. Si el equipo decide añadir explicación por LLM vía API, enviar solo métricas y reglas ya calculadas, con prompt fijo y respuesta JSON validada. Sin RAG y sin consulta abierta a internet. La IA solo explica datos recibidos: no decide rotaciones, no estima rendimientos y no completa valores faltantes.

Prompt de referencia:

```text
Explica en español sencillo las métricas JSON recibidas para un agente de extensión.
No añadas hechos, cifras, cultivos, fechas ni recomendaciones que no aparezcan en el JSON.
Aclara escala espacial, periodo, incertidumbre y datos faltantes. Presenta opciones como escenarios para revisar con el productor.
Devuelve exclusivamente JSON con las claves resumen, evidencia, limites y preguntas_para_validar.
```

Entrada y esquema de salida de ejemplo:

```json
{
  "ubicacion": "San Juan, RD",
  "periodo": "2016-2025",
  "metricas": {"lluvia_mm_anual": 0, "t2m_c": 0, "resolucion": "rejilla regional POWER"},
  "rotacion": "leguminosa-maiz",
  "reglas": ["posible aporte de N por rasgo de leguminosa"],
  "incertidumbres": ["no hay análisis de suelo del lote", "riego no verificado"]
}
```

Los ceros son marcadores estructurales, no resultados de San Juan.

```json
{"resumen":"...", "evidencia":["..."], "limites":["..."], "preguntas_para_validar":["..."]}
```

Validar JSON contra esquema y rechazar campos no permitidos. Registrar proveedor/modelo, fecha y respuesta revisada si se integra.

## Qué no afirmar

- No afirmar que satélite mide textura, fertilidad o humedad exacta del lote.
- No afirmar ganancias, rendimiento, fechas óptimas universales ni seguridad de una rotación.
- No afirmar que POWER o SMAP resuelven variación entre parcelas próximas.
- No sugerir una ventana fitosanitaria vigente sin fuente oficial actual.
- No presentar escenarios ilustrativos como validados en finca.
- No llamar recomendación autónoma al sistema: apoya exploración y juicio local.
