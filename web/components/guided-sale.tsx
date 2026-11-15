/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
"use client";

import { useState } from "react";
import { allCrops, cropNames, marketFor, marketSources, type CropId } from "@/lib/advisor";
import type { Irrigation } from "@/lib/data";
import { CPI, historicCost, wholesaleRange, rd } from "@/lib/profit";

const labels = ["Semilla", "Abono", "Mano de obra", "Riego", "Máquina", "Otros gastos"];
// Habichuela roja, Suroeste, 2019. Los tres riegos se restan de mano de obra.
const beanCosts = [1021.43, 1069.28, 2213.10, 266.12, 1107.50, 501.44];
const questions = ["¿Qué vas a vender?", "¿Cuánta semilla usaste?", "¿Tienes riego?", "¿Sabes cuánto gastaste?", "¿Cuánto esperas cosechar?", "¿Cuánto te ofrecen?"];
const rounded = (value: number) => rd(Math.round(value / 100) * 100);

export function GuidedSale({ initialCrop, farmTareas, initialIrrigation, areaSource }: {
  initialCrop: CropId; farmTareas: number | null; initialIrrigation: Irrigation; areaSource?: string;
}) {
  const [step, setStep] = useState(0);
  const [crop, setCrop] = useState(initialCrop);
  const [area, setArea] = useState(farmTareas ? farmTareas.toFixed(2) : "");
  const [seed, setSeed] = useState("");
  const [seedUnit, setSeedUnit] = useState("quintal");
  const [sackWeight, setSackWeight] = useState("");
  const [irrigation, setIrrigation] = useState(initialIrrigation);
  const [useEstimate, setUseEstimate] = useState(false);
  const [cost, setCost] = useState("");
  const [lines, setLines] = useState<Record<number, string>>({});
  const [harvest, setHarvest] = useState("");
  const [offer, setOffer] = useState("");
  const [discount, setDiscount] = useState("");
  const tareas = Number(area);
  const market = marketFor(crop);
  const reference = historicCost(crop, irrigation);
  const costReference = reference?.cost;
  const wholesale = wholesaleRange(crop);
  const seedLb = Number(seed) * (seedUnit === "quintal" ? 100 : seedUnit === "saco" ? Number(sackWeight) : 1);
  const hasBreakdown = crop === "habichuela_roja" && Boolean(costReference);
  const lineValues = labels.map((_, index) => {
    const baseline = index === 0 && seedLb > 0 ? seedLb * 55 : beanCosts[index] * tareas;
    return lines[index] ?? (hasBreakdown ? String(Math.round(baseline * CPI.factor)) : "");
  });
  const estimatedCost = costReference ? costReference.costPerTarea * CPI.factor * tareas : 0;
  const totalCost = !useEstimate ? Number(cost) : hasBreakdown || Object.values(lines).some(Boolean)
    ? lineValues.reduce((sum, line) => sum + Number(line), 0) : estimatedCost;
  const yieldLb = reference?.yieldLb ?? 0;
  const harvestQQ = harvest ? Number(harvest) : yieldLb * tareas / 100;
  const prices = offer !== "" ? [Number(offer)] : wholesale
    ? [wholesale.low, wholesale.mid, wholesale.high].map(value => value * (100 - Number(discount))) : [];
  const canAdvance = step === 0 ? tareas > 0 : step === 3 ? totalCost > 0 : step === 4 ? harvestQQ > 0 : true;

  return <div className="guided-sale">
    {step < questions.length ? <form className="workbench-form" onSubmit={event => { event.preventDefault(); setStep(step + 1); }}>
      <fieldset>
        <legend>{questions[step]}</legend>
        {step === 0 && <>
          <label>Cultivo<select value={crop} onChange={event => { setCrop(event.target.value as CropId); setLines({}); }}>{allCrops.map(id => <option key={id} value={id}>{cropNames[id]}</option>)}</select></label>
          <label>Tareas a sembrar<input type="number" required min=".01" max="100000" step="any" value={area} onChange={event => { setArea(event.target.value); setLines({}); }} /></label>
          {areaSource && <p className="note">Área inicial {areaSource}. Puedes ajustarla para esta venta.</p>}
        </>}
        {step === 1 && <>
          <label>Cantidad de semilla (opcional)<input type="number" min="0" step="any" value={seed} onChange={event => { setSeed(event.target.value); setLines({}); }} /></label>
          <label>Unidad de semilla<select value={seedUnit} onChange={event => { setSeedUnit(event.target.value); setLines({}); }}><option value="quintal">Quintales de 100 libras</option><option value="libra">Libras</option><option value="saco">Sacos</option></select></label>
          {Number(seed) > 0 && seedUnit === "saco" && <label>Libras por saco<input type="number" min=".01" step="any" required value={sackWeight} onChange={event => { setSackWeight(event.target.value); setLines({}); }} /></label>}
          <p className="note">La semilla ayuda a estimar su costo. La cosecha se calcula aparte.</p>
        </>}
        {step === 2 && <label>Sistema de la finca<select value={irrigation} onChange={event => { setIrrigation(event.target.value as Irrigation); setLines({}); }}><option value="unconfirmed">Sin confirmar</option><option value="irrigated">Con riego</option><option value="rainfed">Secano (de lluvia)</option></select></label>}
        {step === 3 && <>
          <label>Cómo quieres indicar el gasto<select value={useEstimate ? "estimate" : "known"} onChange={event => setUseEstimate(event.target.value === "estimate")}><option value="known">Sé mi gasto total</option><option value="estimate">Necesito una referencia o poner gastos por separado</option></select></label>
          {!useEstimate ? <label>Gasto total (RD$)<input type="number" required min=".01" step="any" value={cost} onChange={event => setCost(event.target.value)} /></label> : <>
            {costReference ? <p className="note">{costReference.area} · 2019 · {rounded(estimatedCost / tareas)} por tarea, ajustados con el <a href={CPI.url}>IPC de enero 2026</a>. <a href={costReference.source}>Ficha de Agricultura</a>.</p> : <p className="note">{irrigation === "rainfed" ? "No hay datos de secano." : "Sin datos suficientes del sistema."}</p>}
            {!hasBreakdown && <p className="note">Sin desglose comprobado. Si llenas los rubros, su suma reemplaza el total de referencia.</p>}
            {hasBreakdown && seedLb > 0 && <p className="note">La ficha usa unas 19 libras de semilla por tarea. Declaraste {(seedLb / tareas).toFixed(1)} lb/tarea. Comprueba el área y la unidad si hay mucha diferencia.</p>}
            <div className="guided-cost-lines">{labels.map((label, index) => <label key={label}>{label} (RD$)<input type="number" min="0" step="any" value={lineValues[index]} onChange={event => setLines({ ...lines, [index]: event.target.value })} /></label>)}</div>
          </>}
        </>}
        {step === 4 && <>
          <label>Cosecha para vender (quintales de 100 libras)<input type="number" min=".01" step="any" required={!yieldLb} value={harvest} onChange={event => setHarvest(event.target.value)} /></label>
          <p className="note">{yieldLb ? <>Si lo dejas vacío, usamos {yieldLb / 100} quintales por tarea de la ficha de 2019 ({costReference?.area}).</> : "Sin datos suficientes de rendimiento comparable. Escribe tu estimación."}</p>
        </>}
        {step === 5 && <>
          <label>Oferta por quintal (RD$, opcional)<input type="number" min="0" step="any" value={offer} onChange={event => setOffer(event.target.value)} /></label>
          {offer === "" && wholesale && <label>Descuento del intermediario sobre el mayorista (%, opcional)<input type="number" min="0" max="100" step="any" value={discount} onChange={event => setDiscount(event.target.value)} /></label>}
        </>}
      </fieldset>
      <div className="plan-form-actions">
        {step > 0 && <button type="button" className="link-button" onClick={() => setStep(step - 1)}>Atrás</button>}
        <button type="submit" disabled={!canAdvance}>{step === 5 ? "Ver resultado" : "Continuar"}</button>
      </div>
    </form> : <section className="budget-result" aria-label="Resultado de la calculadora">
      <p>Gasto total · {useEstimate ? rounded(totalCost) : rd(totalCost)}</p>
      <strong>Vende a mínimo {rd(Math.ceil(totalCost / harvestQQ))} por quintal para no perder</strong>
      {offer === "" && prices.length > 0 && <p className="note">Escenario histórico (precio mayorista) · Santo Domingo · 12 meses hasta {market?.latest?.period} · RD$ por {tareas} tareas · {discount ? discount + "% de descuento declarado" : "sin descuento declarado"}.</p>}
      {prices.length ? <dl>{prices.map((value, index) => {
        const income = value * harvestQQ;
        return <div key={index}><dt>{offer !== "" ? "Oferta declarada" : ["Bajo", "Medio", "Alto"][index]}</dt><dd>Venta {rounded(income)} · saldo {rounded(income - totalCost)}</dd></div>;
      })}</dl> : <p>Sin datos suficientes de precio comparable. Puedes añadir la oferta que recibiste.</p>}
      {offer === "" && prices.length > 0 && <a href={marketSources.prices}>Fuente de precios mayoristas</a>}
      <button type="button" className="link-button" onClick={() => setStep(0)}>Cambiar datos</button>
    </section>}
  </div>;
}
