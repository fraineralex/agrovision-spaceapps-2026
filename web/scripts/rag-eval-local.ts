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