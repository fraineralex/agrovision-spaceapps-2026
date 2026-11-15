/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
"use client";
import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Calculator, CircleCheck, Coins, Package, Wallet } from "lucide-react";
import { rd } from "@/lib/profit";
import { CustomSelect } from "@/components/custom-select";
import { useLocale } from "@/lib/i18n/client";
import { localeTag } from "@/lib/i18n/locale";
import { saleMessages } from "@/lib/i18n/sale-messages";

const units = ["libra", "quintal", "kilo", "unidad", "saco", "caja"] as const;
type Unit = typeof units[number];
const format = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);
function amount(value: string) {
  const clean = value.trim();
  return /^\d+(?:[.,]\d{1,2})?$/.test(clean) ? Number(clean.replace(",", ".")) : NaN;
}
export function SaleBudget() {
  const locale = useLocale();
  const text = saleMessages[locale];
  const number = new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 2 });
  const price = new Intl.NumberFormat(localeTag(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [unit, setUnit] = useState<Unit>("quintal");
  const [result, setResult] = useState<{ cost: number; quantity: number; offer: number | null; unit: Unit } | null>(null);
  const [error, setError] = useState(false);
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const cost = amount(String(data.get("cost") ?? ""));
    const quantity = amount(String(data.get("quantity") ?? ""));
    const rawOffer = String(data.get("offer") ?? "").trim();
    const offer = rawOffer ? amount(rawOffer) : null;
    if (!(cost > 0) || !(quantity > 0) || (offer !== null && !(offer >= 0))) {
      setResult(null); setError(true); return;
    }
    setError(false);
    setResult({ cost, quantity, offer, unit });
  }
  const minPrice = result ? Math.ceil(result.cost * 100 / result.quantity) / 100 : 0;
  const balance = result && result.offer !== null ? result.offer * result.quantity - result.cost : null;
  const maxCompare = result && result.offer !== null ? Math.max(minPrice, result.offer, 1) : 1;
  return <div className="sale-budget">
    <form className="workbench-form" onSubmit={calculate} onChange={() => { setResult(null); setError(false); }}>
      <label><span><Wallet aria-hidden="true"/> {text.totalCost}</span><input name="cost" inputMode="decimal" maxLength={12} placeholder="25000" required/></label>
      <div className="ag-select-field"><span className="ag-select-label">{text.saleUnit}</span><CustomSelect name="unit" ariaLabel={text.saleUnit} value={unit} options={units.map(item => ({value:item,label:text.units[item]}))} onChange={val => setUnit(val as Unit)} /></div>
      <label><span><Package aria-hidden="true"/> {text.sellQuantity}</span><input name="quantity" inputMode="decimal" maxLength={12} placeholder="40" required/></label>
      <label><span><Coins aria-hidden="true"/> {format(text.offerPer, { unit: text.units[unit] })}</span><input name="offer" inputMode="decimal" maxLength={12} placeholder={text.optional}/></label>
      <button type="submit"><Calculator aria-hidden="true"/> {text.calculate}</button>
    </form>
    <details className="visual-details"><summary>{text.expensesQuestion}</summary><p>{text.expensesHelp}</p></details>
    {error && <p role="alert" className="warning">{text.invalid}</p>}
    <div aria-live="polite">{result && <div className="budget-result">
      <p>{text.minimum}</p>
      <strong>{format(text.perUnit, { price: price.format(minPrice), unit: text.units[result.unit] })}</strong>
      {balance !== null && result.offer !== null && <>
        <p className={`budget-balance ${balance < 0 ? "budget-short" : ""}`}>{balance < 0 ? <ArrowDown aria-hidden="true"/> : balance > 0 ? <ArrowUp aria-hidden="true"/> : <CircleCheck aria-hidden="true"/>}
          {balance < 0 ? format(text.shortfall, { amount: rd(-balance, locale) }) : balance > 0 ? format(text.remaining, { amount: rd(balance, locale) }) : text.covered}</p>
        <div className="budget-bars" aria-hidden="true">
          <div className="bbar-row"><span>{text.minimumShort}</span><div className="bbar-track"><span className="bbar-fill min" style={{ width: `${Math.max(8, Math.round((minPrice / maxCompare) * 100))}%` }} /></div><b>RD${price.format(minPrice)}</b></div>
          <div className="bbar-row"><span>{text.offer}</span><div className="bbar-track"><span className={`bbar-fill ${balance >= 0 ? "ok" : "bad"}`} style={{ width: `${Math.max(8, Math.round((result.offer / maxCompare) * 100))}%` }} /></div><b>RD${price.format(result.offer)}</b></div>
        </div>
      </>}
      <small>{format(text.scenario, { cost: rd(result.cost, locale), quantity: number.format(result.quantity) })}</small>
    </div>}</div>
  </div>;
}
