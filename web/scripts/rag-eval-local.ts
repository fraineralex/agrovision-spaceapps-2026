/* AI: Cursor agent (composer-2.5), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
const base = process.env.AGROVISION_URL ?? "http://localhost:3456";
const selection = {
  priority: "market",
  month: 11,
  irrigation: "irrigated",
  parcelId: "demo-01",
  previousCrop: "arroz",
  farmName: "Conuco prueba",
  farmArea: "4 tareas",
};
const questions = [
  "¿Cuándo siembro habichuela en San Juan?",
  "¿Puedo sembrar papa después de papa?",
  "¿Qué dice la NASA de la lluvia en mi zona?",
  "¿Cuánto cuesta sembrar una tarea de arroz?",
  "¿Qué le echo al tizón de la papa?",
  "¿De dónde sacan los precios?",
  "¿Cuánta semilla por tarea y qué distancia entre hileras recomienda el IDIAF para habichuela?",
  "¿Qué prácticas de manejo de enfermedades y plagas describe el compendio IDIAF de habichuela?",
  "¿Qué manejo del mosaico dorado describe el compendio y de qué año es la guía?",
  "¿Qué mide IMERG y qué unidad debo revisar antes de leer la lluvia?",
  "¿SMAP me dice la humedad de mi parcela y de qué tamaño es aproximadamente el píxel?",
  "¿Qué significa una imagen de Landsat o GIBS para mi cultivo y cuáles son sus límites?",
  "¿Qué beneficios puede aportar alternar familias botánicas y raíces de distinta profundidad en una rotación?",
  "¿Qué papel pueden tener las leguminosas en una rotación y qué condiciones hacen incierto el aporte al cultivo siguiente?",
  "¿Cómo ayuda alternar cultivos hospedadores y no hospedadores, y puedo aplicar a San Juan los intervalos europeos de Best4Soil?",
  "¿Cuál es la diferencia entre rotación y asociación de cultivos?",
  "¿Qué debo revisar antes de probar una asociación de cereal y leguminosa en una finca tropical pequeña?",
];

async function ask(question: string) {
  const response = await fetch(`${base}/api/voice/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selection, messages: [{ role: "user", content: question }] }),
  });
  const sourcesHeader = response.headers.get("X-AgroVision-Sources");
  const sources = sourcesHeader ? JSON.parse(decodeURIComponent(sourcesHeader)) : [];
  if (!response.body) return { question, answer: "", sources };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    text += decoder.decode(value, { stream: !done });
    if (done) break;
  }
  return { question, answer: text.trim(), sources };
}

async function main() {
  const results = [];
  for (const q of questions) {
    results.push(await ask(q));
    console.log("Done:", q.slice(0, 40));
  }
  console.log(JSON.stringify(results, null, 2));
}
main().catch(error => {
  console.error(error);
  process.exit(1);
});
