/* AI: Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";

import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Calculator, CircleCheck, Coins, Package, Wallet } from "lucide-react";
import { rd } from "@/lib/profit";

const units = ["libra", "quintal", "kilo", "unidad", "saco", "caja"] as const;
const number = new Intl.NumberFormat("es-DO", { maximumFractionDigits: 2 });
const price = new Intl.NumberFormat("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function amount(value: string) {
  const clean = value.trim();
  return /^\d+(?:[.,]\d{1,2})?$/.test(clean) ? Number(clean.replace(",", ".")) : NaN;
}

export function SaleBudget() {
  const [unit, setUnit] = useState<(typeof units)[number]>("quintal");
  const [result, setResult] = useState<{ cost: number; quantity: number; offer: number | null; unit: string } | null>(null);
  const [error, setError] = useState("");

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const cost = amount(String(data.get("cost") ?? ""));
    const quantity = amount(String(data.get("quantity") ?? ""));
    const rawOffer = String(data.get("offer") ?? "").trim();
    const offer = rawOffer ? amount(rawOffer) : null;
    if (!(cost > 0) || !(quantity > 0) || (offer !== null && !(offer >= 0))) {
      setResult(null);
      setError("Escribe un gasto y una cantidad mayores que cero. Usa números sin separador de miles, por ejemplo 2500,50.");
      return;
    }
    setError("");
    setResult({ cost, quantity, offer, unit });
  }

  const balance = result && result.offer !== null ? result.offer * result.quantity - result.cost : null;
  return <div className="sale-budget">
    <form className="workbench-form" onSubmit={calculate} onChange={() => { setResult(null); setError(""); }}>
      <label><span><Wallet aria-hidden="true"/> Gasto total (RD$)</span><input name="cost" inputMode="decimal" maxLength={12} placeholder="25000" required/></label>
      <label>Unidad de venta<select name="unit" value={unit} onChange={event => setUnit(event.target.value as typeof unit)}>{units.map(item => <option key={item}>{item}</option>)}</select></label>
      <label><span><Package aria-hidden="true"/> Cantidad para vender</span><input name="quantity" inputMode="decimal" maxLength={12} placeholder="40" required/></label>
      <label><span><Coins aria-hidden="true"/> Oferta por {unit} (RD$)</span><input name="offer" inputMode="decimal" maxLength={12} placeholder="Opcional"/></label>
      <button type="submit"><Calculator aria-hidden="true"/> Calcular precio mínimo</button>
    </form>
    <details className="visual-details"><summary>¿Qué gastos pongo?</summary><p>Semilla, abono, mano de obra, riego y transporte. Usa la cantidad que esperas vender.</p></details>
    {error && <p role="alert" className="warning">{error}</p>}
    <div aria-live="polite">{result && <div className="budget-result">
      <p>Precio mínimo</p>
      <strong>RD${price.format(Math.ceil(result.cost * 100 / result.quantity) / 100)} por {result.unit}</strong>
      {balance !== null && <p className={`budget-balance ${balance < 0 ? "budget-short" : ""}`}>{balance < 0 ? <ArrowDown aria-hidden="true"/> : balance > 0 ? <ArrowUp aria-hidden="true"/> : <CircleCheck aria-hidden="true"/>}
        {balance < 0 ? `Te faltan ${rd(-balance)}` : balance > 0 ? `Te quedan ${rd(balance)}` : "Cubres tus gastos"}</p>}
      <small>Escenario con tus datos · {rd(result.cost)} de gasto ÷ {number.format(result.quantity)} de la unidad elegida.</small>
    </div>}</div>
  </div>;
}
