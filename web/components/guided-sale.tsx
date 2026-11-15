/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
"use client";
import { StepProgress } from "@/components/field-ui";
import { CustomSelect } from "@/components/custom-select";
import { Fragment, useState, type ReactNode } from "react";
import { allCrops, marketFor, marketSources, type CropId } from "@/lib/advisor";
import type { Irrigation } from "@/lib/data";
import { CPI, historicCost, wholesaleRange, rd } from "@/lib/profit";
import { useLocale } from "@/lib/i18n/client";
import { localeTag } from "@/lib/i18n/locale";
import { cropLabel } from "@/lib/i18n/advice";
import { saleMessages } from "@/lib/i18n/sale-messages";
import { sourceMessages } from "@/lib/i18n/source-messages";

const costKeys = ["seed", "fertilizer", "labor", "irrigation", "machinery", "other"] as const;
// Habichuela roja, Suroeste, 2019. Los tres riegos se restan de mano de obra.
const beanCosts = [1021.43, 1069.28, 2213.10, 266.12, 1107.50, 501.44];
const format = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
const rich = (template: string, values: Record<string, ReactNode>) => template.split(/(\{\w+\})/g).map((part, index) => /^\{\w+\}$/.test(part) ? <Fragment key={index}>{values[part.slice(1, -1)]}</Fragment> : part);

export function GuidedSale({ initialCrop, farmTareas, initialIrrigation, areaSource }: {
  initialCrop: CropId; farmTareas: number | null; initialIrrigation: Irrigation; areaSource?: string;
}) {
  const locale = useLocale();
  const text = saleMessages[locale];
  const sources = sourceMessages[locale];
  const tag = localeTag(locale);
  const rounded = (value: number) => rd(Math.round(value / 100) * 100, locale);
  const areas: Record<string, string> = { "Regional Suroeste (San Juan), riego por gravedad": sources.areaSouthwest, "Nacional, riego": sources.areaNationalIrrigated, "Nacional": sources.areaNational, "Cebolla roja, riego por gravedad": sources.areaOnion };
  const areaName = (value?: string) => value ? areas[value] ?? value : "";
  const questions = [text.questions.crop, text.questions.seed, text.questions.irrigation, text.questions.expenses, text.questions.harvest, text.questions.offer];
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
  const lineValues = costKeys.map((_, index) => {
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
  const saleLow = prices[0] * harvestQQ;
  const saleHigh = prices.at(-1)! * harvestQQ;
  const breakEven = Math.ceil(totalCost / harvestQQ);
  const comparisonPrice = prices[Math.floor(prices.length / 2)];
  const maxPrice = Math.max(breakEven, comparisonPrice ?? 0);
  const range = (low: number, high: number) => low === high ? rounded(low) : rounded(low) + text.rangeSeparator + rounded(high);

  return <div className="guided-sale">
    {step < questions.length ? <form className="workbench-form" onSubmit={event => { event.preventDefault(); setStep(step + 1); }}>
      <StepProgress step={step + 1} total={questions.length} />
      <fieldset>
        <legend>{questions[step]}</legend>
        {step === 0 && <>
          <div className="ag-select-field"><span className="ag-select-label">{text.crop}</span><CustomSelect ariaLabel={text.crop} value={crop} options={allCrops.map(id => ({value:id,label:cropLabel(id,locale)}))} onChange={val => { setCrop(val as CropId); setLines({}); }} /></div>
          <label>{text.tareas}<input type="number" required min=".01" max="100000" step="any" value={area} onChange={event => { setArea(event.target.value); setLines({}); }} /></label>
          {areaSource && <p className="note">{format(text.initialArea, { source: areaSource === "declarada" ? text.declared : areaSource === "del mapa" ? text.fromMap : areaSource })}</p>}
        </>}
        {step === 1 && <>
          <label>{text.seedAmount}<input type="number" min="0" step="any" value={seed} onChange={event => { setSeed(event.target.value); setLines({}); }} /></label>
          <label>{text.seedUnit}<select value={seedUnit} onChange={event => { setSeedUnit(event.target.value); setLines({}); }}><option value="quintal">{text.quintals100}</option><option value="libra">{text.pounds}</option><option value="saco">{text.sacks}</option></select></label>
          {Number(seed) > 0 && seedUnit === "saco" && <label>{text.poundsPerSack}<input type="number" min=".01" step="any" required value={sackWeight} onChange={event => { setSackWeight(event.target.value); setLines({}); }} /></label>}
          <p className="note">{text.seedNote}</p>
        </>}
        {step === 2 && <label>{text.farmSystem}<select value={irrigation} onChange={event => { setIrrigation(event.target.value as Irrigation); setLines({}); }}><option value="unconfirmed">{text.unconfirmed}</option><option value="irrigated">{text.irrigated}</option><option value="rainfed">{text.rainfed}</option></select></label>}
        {step === 3 && <>
          <label>{text.expenseMethod}<select value={useEstimate ? "estimate" : "known"} onChange={event => setUseEstimate(event.target.value === "estimate")}><option value="known">{text.known}</option><option value="estimate">{text.estimate}</option></select></label>
          {!useEstimate ? <label>{text.totalCost}<input type="number" required min=".01" step="any" value={cost} onChange={event => setCost(event.target.value)} /></label> : <>
            {costReference ? <p className="note">{rich(text.referencePerTarea, { area: areaName(costReference.area), amount: rounded(estimatedCost / tareas), cpi: <a href={CPI.url}>{text.cpi}</a>, source: <a href={costReference.source}>{text.agricultureRecord}</a> })}</p> : <p className="note">{irrigation === "rainfed" ? text.noRainfed : text.noSystem}</p>}
            {!hasBreakdown && <p className="note">{text.noBreakdown}</p>}
            {hasBreakdown && seedLb > 0 && <p className="note">{format(text.seedComparison, { amount: (seedLb / tareas).toLocaleString(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}</p>}
            <div className="guided-cost-lines">{costKeys.map((key, index) => <label key={key}>{text.costLabels[key]} (RD$)<input type="number" min="0" step="any" value={lineValues[index]} onChange={event => setLines({ ...lines, [index]: event.target.value })} /></label>)}</div>
          </>}
        </>}
        {step === 4 && <>
          <label>{text.harvestQuantity}<input type="number" min=".01" step="any" required={!yieldLb} value={harvest} onChange={event => setHarvest(event.target.value)} /></label>
          <p className="note">{yieldLb ? format(text.yieldDefault, { yield: (yieldLb / 100).toLocaleString(tag), area: areaName(costReference?.area) }) : text.noYield}</p>
        </>}
        {step === 5 && <>
          <label>{text.offerQuintal}<input type="number" min="0" step="any" value={offer} onChange={event => setOffer(event.target.value)} /></label>
          {offer === "" && wholesale && <label>{text.discount}<input type="number" min="0" max="100" step="any" value={discount} onChange={event => setDiscount(event.target.value)} /></label>}
        </>}
      </fieldset>
      <div className="plan-form-actions">
        {step > 0 && <button type="button" className="link-button" onClick={() => setStep(step - 1)}>{text.back}</button>}
        <button type="submit" disabled={!canAdvance}>{step === 5 ? text.viewResult : text.continue}</button>
      </div>
    </form> : <section className="budget-result" aria-label={text.calculatorResult}>
      <h3>{cropLabel(crop, locale)} · {tareas.toLocaleString(tag)} tareas</h3>
      <dl className="sale-metrics">
        <div><dt>{text.expense}</dt><dd>{useEstimate ? rounded(totalCost) : rd(totalCost, locale)}</dd></div>
        <div><dt>{text.sale}</dt><dd>{prices.length ? range(saleLow, saleHigh) : text.noData}</dd></div>
        <div className={prices.length && saleHigh < totalCost ? "sale-loss" : undefined}><dt>{text.net}</dt><dd>{prices.length ? range(saleLow - totalCost, saleHigh - totalCost) : text.noData}</dd></div>
      </dl>
      <strong>{format(text.breakEven, { amount: rd(breakEven, locale) })}</strong>
      {comparisonPrice !== undefined && maxPrice > 0 && <div className="break-even-chart">
        <span>{offer === "" ? text.middlePrice : text.yourOffer}: {rd(comparisonPrice, locale)}/qq</span>
        <div className="break-even-track" aria-hidden="true"><i style={{ width: (comparisonPrice / maxPrice) * 100 + "%" }} /><b style={{ insetInlineStart: "min(calc(100% - 2px), " + (breakEven / maxPrice) * 100 + "%)" }} /></div>
      </div>}
      {offer === "" && prices.length > 0 && <p className="note">{format(text.scenarioHistory, { irrigation: irrigation === "irrigated" ? text.withIrrigation : irrigation === "rainfed" ? text.withoutIrrigation : text.irrigationUnknown, period: market?.latest?.period ?? "", tareas: tareas.toLocaleString(tag), discount: discount ? format(text.declaredDiscount, { discount }) : text.noDiscount })}</p>}
      {prices.length ? <dl>{prices.map((value, index) => {
        const income = value * harvestQQ;
        return <div key={index}><dt>{offer !== "" ? text.declaredOffer : [text.low, text.mid, text.high][index]}</dt><dd>{format(text.saleBalance, { sale: rounded(income), balance: rounded(income - totalCost) })}</dd></div>;
      })}</dl> : <p>{text.noComparablePrice}</p>}
      {offer === "" && prices.length > 0 && <a href={marketSources.prices}>{text.priceSource}</a>}
      <button type="button" className="link-button" onClick={() => setStep(0)}>{text.changeData}</button>
    </section>}
  </div>;
}
