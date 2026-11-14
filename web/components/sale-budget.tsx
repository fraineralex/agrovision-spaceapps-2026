/* AI: Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";

import { useState, type FormEvent } from "react";
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
    <p>Suma semilla, abono, mano de obra, riego y transporte. Usa la cantidad que crees que podrás vender.</p>
    <form className="workbench-form" onSubmit={calculate} onChange={() => { setResult(null); setError(""); }}>
      <label>Gasto total (RD$)<input name="cost" inputMode="decimal" maxLength={12} placeholder="Ej.: 25000" required/></label>
      <label>Unidad de venta<select name="unit" value={unit} onChange={event => setUnit(event.target.value as typeof unit)}>{units.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Cantidad para vender<input name="quantity" inputMode="decimal" maxLength={12} placeholder="Ej.: 40" required/></label>
      <label>Oferta por {unit} (RD$)<input name="offer" inputMode="decimal" maxLength={12} placeholder="Si ya tienes una oferta"/></label>
      <button type="submit">Calcular precio mínimo</button>
    </form>
    {error && <p role="alert" className="warning">{error}</p>}
    <div aria-live="polite">{result && <div className="budget-result">
      <p>Para cubrir tus gastos cobra al menos</p>
      <strong>RD${price.format(Math.ceil(result.cost * 100 / result.quantity) / 100)} por {result.unit}</strong>
      {balance !== null && <p>{balance < 0 ? `Con esa oferta te faltarían ${rd(-balance)} para cubrir los gastos.` : balance > 0 ? `Con esa oferta te quedarían ${rd(balance)} después de los gastos anotados.` : "Con esa oferta cubres justo los gastos anotados."}</p>}
      <small>Escenario con tus datos · {rd(result.cost)} de gasto ÷ {number.format(result.quantity)} de la unidad elegida.</small>
    </div>}</div>
  </div>;
}
