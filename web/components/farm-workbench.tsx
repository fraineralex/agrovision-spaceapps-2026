/* AI: Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";

import { CalendarDays, CloudRain, Coins, MapPin, Sprout } from "lucide-react";
import { useState, type FormEvent } from "react";
import { allCrops, cropNames, monthNames, type CropId } from "@/lib/advisor";
import type { Farm } from "@/lib/farms";
import { provinces, type Location } from "@/lib/geography";
import { localDate, shortDate } from "@/lib/rain";
import { RainCard, type useRain } from "@/components/rain-card";

export function WorkbenchNav() {
  return <nav className="workbench-nav" aria-label="Herramientas para tu finca">
    <a href="#lluvia-esta-semana"><CloudRain aria-hidden="true"/> Esta semana</a>
    <a href="#siembra"><Sprout aria-hidden="true"/> Plan de siembra</a>
    <a href="#cuanto-me-deja"><Coins aria-hidden="true"/> Costos y venta</a>
    <a href="#tu-finca-en-el-mapa"><MapPin aria-hidden="true"/> Mapa de la finca</a>
  </nav>;
}

export function FieldWeek({ farm, province, rain, onTurn, onAdd, onLocation }: {
  farm: Farm | null;
  province?: string;
  rain: ReturnType<typeof useRain>;
  onTurn: (date: string) => boolean;
  onAdd: () => void;
  onLocation: (point: Location) => void;
}) {
  const [turn, setTurn] = useState(farm?.waterTurn ?? "");
  const [status, setStatus] = useState("");
  const saveTurn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(onTurn(turn) ? (turn ? "Turno guardado en este dispositivo." : "Turno borrado.") : "Este navegador no pudo guardar el turno.");
  };
  const savedTurn = farm?.waterTurn;
  const forecast = rain.forecast?.kind === "forecast" && !rain.cached ? rain.forecast : null;
  const turnDay = forecast?.days.find(day => day.date === savedTurn);
  return <section id="lluvia-esta-semana" className="field-week" aria-labelledby="week-title">
    <div className="field-week-heading"><div><p className="workbench-place"><MapPin aria-hidden="true"/> {farm?.province || province || "República Dominicana"}</p>
      <h2 id="week-title">Esta semana en tu finca</h2></div><CloudRain className="week-icon" aria-hidden="true"/></div>
    {!farm && <label className="week-province">Provincia para consultar la lluvia
      <select value={province ?? ""} onChange={event => {
        const point = provinces.find(item => item.name === event.target.value);
        if (point) onLocation({ longitude: point.longitude, latitude: point.latitude });
      }}><option value="" disabled>Elige tu provincia</option>{provinces.map(item => <option key={item.name}>{item.name}</option>)}</select>
    </label>}
    {(province || farm) && <RainCard rain={rain}/>}
    {farm?.irrigation !== "rainfed" || savedTurn ? <div className="week-turn">
      <h3><CalendarDays aria-hidden="true"/> Turno de riego</h3>
      {farm ? <>
        {savedTurn && <p><strong>{shortDate(savedTurn)}</strong> · {savedTurn < localDate() ? "El turno anotado ya pasó." : turnDay ? `Para ese día se estiman ${turnDay.rainMm} mm${turnDay.probPct !== null ? ` y ${turnDay.probPct}% de probabilidad de lluvia` : ""}.` : "Aún no hay pronóstico actualizado para ese día."}</p>}
        <form onSubmit={saveTurn}>
          <label>Fecha que te dio la junta<input type="date" value={turn} min={localDate()} required onChange={event => { setTurn(event.target.value); setStatus(""); }}/></label>
          <button type="submit" disabled={!turn || turn === savedTurn}>Guardar turno</button>
          {savedTurn && <button type="button" className="link-button" onClick={() => { setTurn(""); setStatus(onTurn("") ? "Turno borrado." : "Este navegador no pudo borrar el turno."); }}>Borrar turno</button>}
        </form>
        <p className="week-note">Revisa la humedad de la tierra y confirma con tu junta antes de cambiar un turno.</p>
        <p role="status" className="week-note">{status}</p>
      </> : <button type="button" onClick={onAdd}>Agregar mi finca</button>}
    </div> : <p className="week-note">Cultivo de lluvia. Revisa la humedad de la tierra antes de decidir cuándo sembrar.</p>}
    <a href="https://indomet.gob.do/pronostico/">Ver avisos y pronóstico oficial de INDOMET</a>
  </section>;
}

export function PlantingPlan({ farm, sowMonth, onMonth, onSave }: {
  farm: Farm;
  sowMonth: number;
  onMonth: (month: number) => void;
  onSave: (plan: NonNullable<Farm["plan"]> | undefined) => boolean;
}) {
  const [crop, setCrop] = useState<CropId | "">(farm.plan?.crop ?? "");
  const [status, setStatus] = useState("");
  const options = farm.plan ? [...new Set([...farm.crops, farm.plan.crop])] : farm.crops;
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (crop && allCrops.includes(crop)) setStatus(onSave({ crop, sowMonth }) ? "Plan guardado en este dispositivo." : "Este navegador no pudo guardar el plan.");
  };
  return <div className="planting-plan">
    {farm.plan && <p className="saved-plan"><strong>Tu plan guardado</strong> · {cropNames[farm.plan.crop]} en {monthNames[farm.plan.sowMonth - 1]}</p>}
    <form className="workbench-form" onSubmit={save}>
      <label>Mes para comparar<select value={sowMonth} onChange={event => { onMonth(Number(event.target.value)); setStatus(""); }}>{monthNames.map((month, index) => <option value={index + 1} key={month}>{month}</option>)}</select></label>
      <label>Cultivo para tu plan<select value={crop} onChange={event => { setCrop(event.target.value as CropId | ""); setStatus(""); }}><option value="">Elige un cultivo</option>{options.map(id => <option value={id} key={id}>{cropNames[id]}</option>)}</select></label>
      <button type="submit" disabled={!crop || (farm.plan?.crop === crop && farm.plan.sowMonth === sowMonth)}>Guardar plan</button>
      {farm.plan && <button type="button" className="link-button" onClick={() => setStatus(onSave(undefined) ? "Plan borrado." : "Este navegador no pudo borrar el plan.")}>Borrar plan</button>}
    </form>
    <p role="status" className="note">{status}</p>
  </div>;
}
