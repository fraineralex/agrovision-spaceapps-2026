/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — plain-language "where does this come from" panel per recommendation. Frainer review pending. See AI_USAGE.md. */
"use client";
import { Bug, Coins, Droplets, FileText, Sun } from "lucide-react";
import { useEffect, useRef } from "react";
import { previousCropName, FAO56_URL, marketFor, marketSources, monthNames, starsFor, unitWord, whyThisCrop, type CropAdvice, type PreviousCrop } from "@/lib/advisor";
import { Stars } from "@/components/field-ui";
import { rainWords } from "@/components/fao-giews";
import { droughtSignal, faoProvince, faoGiews } from "@/lib/fao-giews";
import type { Irrigation } from "@/lib/data";

import { pestLimit, pestSources, pestsFor } from "@/lib/pests";

const IDIAF_URL = "https://intranet.cedaf.org.do/digital/IDIAF.Habichuela.Compendio.guia.pdf";
const money = (n: number) => `RD$${Math.round(n).toLocaleString("es-DO")}`;
const when = (p: string) => `${monthNames[Number(p.slice(5, 7)) - 1]} de ${p.slice(0, 4)}`;
const date = (d: string) => { const [y, m, day] = d.split("-"); return `${Number(day)} de ${monthNames[Number(m) - 1]} de ${y}`; };

function Block({ icon, title, verdict, children, links }: { icon: React.ReactNode; title: string; verdict: string; children: React.ReactNode; links: [string, string][] }) {
  return <section className="src-block">
    <h3><span aria-hidden="true" className="src-icon">{icon}</span> {title}: <em>{verdict}</em></h3>
    {children}
    <div className="src-links">{links.map(([label, url]) => <a key={url + label} href={url} target="_blank" rel="noreferrer"><FileText aria-hidden="true" size={18} /> {label}</a>)}</div>
  </section>;
}

export function SourcesSheet({ advice, all, province, previous, irrigation, sowMonth, onClose }: { advice: CropAdvice; all: CropAdvice[]; province?: string; previous: PreviousCrop; irrigation: Irrigation; sowMonth: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    close.current?.focus();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);
  const keepFocus = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const items = event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]");
    const edge = event.shiftKey ? items[0] : items[items.length - 1];
    if (document.activeElement !== edge) return;
    event.preventDefault();
    (event.shiftKey ? items[items.length - 1] : items[0])?.focus();
  };
  const m = marketFor(advice.crop);
  const fao = faoProvince(province);
  const signal = droughtSignal(fao);
  const perennial = advice.harvestMonth === 0;
  const sorted = [...all].sort((a, b) => a.kcDays - b.kcDays);
  const rank = sorted.findIndex(a => a.crop === advice.crop) + 1;
  const idx = perennial ? null : m?.seasonalIndex?.[String(advice.harvestMonth)] ?? null;
  const hist = fao?.history.reduce<NonNullable<typeof fao>["history"][number] | undefined>((h, x) => !h || x.frequency30Pct > h.frequency30Pct ? x : h, undefined);
  const prevName = previous === "unknown" || previous === "otro" ? null : previousCropName(previous).toLowerCase();
  const pestEntry = pestsFor(advice.crop);
  const shared = advice.sharedPests;
  const sourceIds = new Set([...(pestEntry?.sources ?? []), ...(shared.length ? pestsFor(previous)?.sources ?? [] : [])]);
  const pestLinks = Array.from(sourceIds, id => pestSources[id]);
  if (advice.scores.pests === 5) pestLinks.push(["IDIAF · Compendio de habichuela (2013), págs. 88, 94 y 102", IDIAF_URL]);
  return <dialog ref={dialog} onKeyDown={keepFocus} className="src-overlay" aria-label={`De dónde sale la recomendación de ${advice.name}`} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="src-sheet" onClick={e => e.stopPropagation()}>
      <div className="src-head"><h2>¿Por qué {advice.name.toLowerCase()}?</h2><button type="button" className="ob-link" ref={close} onClick={onClose}>Cerrar ✕</button></div>
      <section className="src-why" aria-label={`Por qué ${advice.name}`}>
        <div className="src-why-head"><Stars score={advice.overall} /><strong>{advice.overall === null ? "Falta información" : `${starsFor(advice.overall)} de 5 estrellas`}</strong></div>
        {whyThisCrop(advice, all, previous).map(line => <p key={line}>{line}</p>)}
        <p className="src-limit">Es una guía hecha con datos públicos. Antes de sembrar, confírmalo con tu técnico.</p>
      </section>
      <h3 className="src-detail-title">El detalle y las fuentes</h3>
      <p className="src-intro">Cada punto para <strong>{advice.name.toLowerCase()}</strong> en <strong>{province ?? "todo el país"}</strong>, sembrando en <strong>{monthNames[sowMonth - 1]}</strong>{prevName ? <>, después de <strong>{prevName}</strong></> : null}, con su fuente para que la revises tú o tu técnico.</p>

      <Block icon={<Droplets />} title="Agua" verdict={advice.words.water} links={[["FAO-56, tablas 11 y 12 (1998)", FAO56_URL]]}>
        <p>Usamos el manual de riego de la FAO (Naciones Unidas), que dice cuánta agua pide cada cultivo en cada etapa. Para {advice.name.toLowerCase()} usamos la fila “{advice.faoRow}”.</p>
        <p>De los {all.length} cultivos que comparas, {advice.name.toLowerCase()} es el <strong>número {rank}</strong> que menos agua pide en {perennial ? "un año" : `su ciclo de unos ${Math.round(advice.cycleDays / 30)} meses`}.</p>
        {advice.crop === "arroz" && <p>Ojo: el arroz inundado gasta más de lo que dice este cálculo, porque no cuenta la lámina de agua ni lo que se pierde en el canal.</p>}
        {!advice.viable && <p>Como dijiste que no tienes riego, el arroz queda descartado.</p>}
        <p className="src-limit">Es una comparación entre cultivos, no litros exactos de tu finca. Los ejemplos de la FAO son de otras regiones del mundo.</p>
      </Block>

      <Block icon={<Sun />} title="Sequía" verdict={advice.words.climate} links={fao ? [["FAO GIEWS · República Dominicana", faoGiews.source], ...(fao.asi?.source ? [["Datos ASI (CSV)", fao.asi.source] as [string, string]] : [])] : [["FAO GIEWS", faoGiews.source]]}>
        {fao ? <>
          <p>La FAO mira por satélite cuánta área cultivada de {province} está seca. {fao.asi ? <>Al <strong>{date(fao.asi.date)}</strong>, {fao.asi.value < 1 ? "menos del 1%" : `el ${Math.round(fao.asi.value)}%`} del área cultivada tenía sequía.</> : "No hay medición reciente."} Para AgroVision eso es: <strong>{signal.label}</strong>.</p>
          {hist && <p>Historia: de {hist.seasons} temporadas ({hist.start}–{hist.end}), en <strong>{hist.above30}</strong> hubo sequía en más del 30% del área cultivada.</p>}
          {fao.rain?.anomalyPct != null && <p>Lluvia en los 10 días desde el {date(fao.rain.date)}: {rainWords(fao.rain.anomalyPct).toLowerCase()} (estimación ECMWF publicada por la FAO).</p>}
          <p>Cuando hay sequía, o ha sido frecuente, los cultivos que piden más agua salen peor.</p>
        </> : <p>Elige tu provincia para ver la sequía de tu zona.</p>}
        <p className="src-limit">Es un dato de toda la provincia (cuadros de ~1 km), no de tu finca. El semáforo es una regla de AgroVision, no una alerta oficial de la FAO.</p>
      </Block>

      <Block icon={<Bug />} title="Plagas" verdict={advice.words.pests} links={pestLinks}>
        {advice.pestPrecautions.map(note => <p key={note}>{note}</p>)}
        {shared.length > 0 && <><p>Coincidencias con {prevName}. Los grupos identificados solo por género requieren confirmar la especie.</p></>}
        {advice.scores.pests === 5 && <p>El IDIAF cita el maíz como opción de rotación después de habichuela para problemas específicos de ese cultivo.</p>}
        {advice.scores.pests === 1 && <p>Pierde estrellas porque repite el cultivo o comparte plagas con el anterior, según referencias locales.</p>}
        {advice.scores.pests === null && <p>Como no hay datos, las plagas no suman ni restan estrellas aquí.</p>}
        <p className="src-limit">{pestLimit}</p>

      </Block>

      <Block icon={<Coins />} title="Precio" verdict={advice.words.market} links={[...(m?.latest ? [[`Ministerio de Agricultura · precios mayoristas ${marketSources.pricesPeriod}`, marketSources.prices] as [string, string]] : []), ...(m?.sowing?.tareasLast12 ? [["Ministerio de Agricultura · siembra nacional mensual", marketSources.sowing] as [string, string]] : []), ...(m?.cost2019 ? [[`Costos de producción 2019, pág. ${m.cost2019.pdfPage}`, `${m.cost2019.source}#page=${m.cost2019.pdfPage}`] as [string, string]] : [])]}>
        {perennial ? <p>{advice.name} es un cultivo permanente: no tiene un mes de cosecha que comparar.</p>
          : m?.latest ? <>
            <p>El Ministerio de Agricultura publica cada semana los precios al por mayor en Santo Domingo. En <strong>{when(m.latest.period)}</strong>, {advice.name.toLowerCase()} estaba a <strong>{money(m.latest.price)} {unitWord(m.unit)}</strong>.</p>
            {idx != null && <p>Si siembras en {monthNames[sowMonth - 1]}, cosechas en <strong>{monthNames[advice.harvestMonth - 1]}</strong>. En los años con datos completos ({m.seasonalYearsUsed?.join(", ") ?? "varios"}), en {monthNames[advice.harvestMonth - 1]} el precio estuvo en promedio <strong>{Math.abs(Math.round(idx - 100))}% {idx >= 100 ? "por encima" : "por debajo"}</strong> de lo normal del año.</p>}
          </> : <p>El Ministerio no publica precio al por mayor de {advice.name.toLowerCase()}.</p>}
        {m?.sowing?.tareasLast12 && m.sowing.medianPrev12 ? <p>Siembra en el país: {m.sowing.tareasLast12.toLocaleString("es-DO")} tareas en los últimos 12 meses (hasta {when(m.sowing.windowEnd!)}), frente a {m.sowing.medianPrev12.toLocaleString("es-DO")} lo normal. {m.sowing.status === "alta" ? "Se está sembrando bastante más: si todos cosechan a la vez, el precio puede bajar." : m.sowing.status === "baja" ? "Se está sembrando menos que lo normal." : "Está dentro de lo normal."}</p> : null}
        {m?.cost2019 && <p>Costo de producir una tarea (2019, {m.cost2019.area}): {money(m.cost2019.costPerTarea)}, con una cosecha típica de {m.cost2019.yield} {m.cost2019.yieldUnit} por tarea.</p>}
        <p className="src-limit">Es el precio al por mayor en Santo Domingo, no lo que te pagan en la finca. No es una promesa de precio.</p>
      </Block>

      <section className="src-block">
        <h3>Importante</h3>
        <p>Los colores comparan los cultivos entre sí con estas fuentes. Riego que declaraste: {irrigation === "irrigated" ? "sí tienes" : irrigation === "rainfed" ? "no tienes" : "no sabes"}. Tus respuestas solo se guardan en este teléfono.</p>
        <p className="src-limit">Lo hizo el equipo AgroVision (estudiantes de UNIBE) y no está probado en el campo. Úsalo como guía y confírmalo con tu técnico o extensionista.</p>

      </section>
    </div>
  </dialog>;
}
