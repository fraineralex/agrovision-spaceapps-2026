/* AI: Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";

import { CalendarDays, CloudRain, Coins, MapPin, MessageCircle, Sprout, Sun, ThermometerSun } from "lucide-react";
import { useState, type FormEvent } from "react";
import { HelpTip } from "@/components/help-tip";
import { allCrops, cropNames, monthNames, type CropId } from "@/lib/advisor";
import type { Farm } from "@/lib/farms";
import { provinces, type Location } from "@/lib/geography";
import { localDate, shortDate } from "@/lib/rain";
import { RainCard, type useRain } from "@/components/rain-card";

export type SectionTab = "siembra" | "lluvia" | "venta" | "mapa" | "preguntar";

export function WorkbenchNav({
  activeTab,
  onSelectTab,
  weekRainMm,
}: {
  activeTab: SectionTab;
  onSelectTab: (tab: SectionTab) => void;
  weekRainMm?: number | null;
}) {
  const tabs: { id: SectionTab; label: string; Icon: typeof Sprout; badge?: string }[] = [
    { id: "siembra", label: "Siembra", Icon: Sprout },
    { id: "lluvia", label: "Lluvia", Icon: CloudRain, badge: weekRainMm != null ? `${weekRainMm} mm` : undefined },
    { id: "venta", label: "Venta", Icon: Coins },
    { id: "mapa", label: "Mapa y clima", Icon: MapPin },
    { id: "preguntar", label: "Preguntar", Icon: MessageCircle },
  ];
  return (
    <div className="workbench-nav" role="tablist" aria-label="Secciones principales de tu finca">
      {tabs.map(({ id, label, Icon, badge }) => {
        const selected = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={selected}
            aria-controls={`panel-${id}`}
            className={selected ? "wnav-tab is-active" : "wnav-tab"}
            onClick={() => onSelectTab(id)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {badge && <em className="wnav-badge">{badge}</em>}
          </button>
        );
      })}
    </div>
  );
}

export function FieldWeek({ farm, province, rain, droughtLabel, tempC, areaText, onTurn, onAdd, onLocation }: {
  farm: Farm | null;
  province?: string;
  rain: ReturnType<typeof useRain>;
  droughtLabel?: string;
  tempC?: number | null;
  areaText?: string;
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
  const weekRainMm = rain.forecast?.days ? Math.round(rain.forecast.days.reduce((sum, d) => sum + d.rainMm, 0)) : null;
  return <section id="lluvia-esta-semana" className="field-week" aria-labelledby="week-title">
    <div className="field-week-heading">
      <div>
        <p className="workbench-place"><MapPin aria-hidden="true"/> {farm?.province || province || "República Dominicana"}{areaText ? ` · ${areaText}` : ""}</p>
        <div className="subhead-help">
          <h2 id="week-title">Lluvia de la semana</h2>
          <HelpTip label="Lluvia de la semana" text="Mira la lluvia esperada de los próximos 7 días. Toca cualquier día para ver el detalle y anota aquí la fecha de tu turno de canal." />
        </div>
      </div>
      <div className="week-telemetry" aria-label="Indicadores rápidos de la semana">
        {weekRainMm !== null && <span className="wt-chip rain"><CloudRain size={15} aria-hidden="true"/> {weekRainMm} mm / 7 días</span>}
        {droughtLabel && <span className="wt-chip drought"><Sun size={15} aria-hidden="true"/> {droughtLabel}</span>}
        {tempC != null && <span className="wt-chip temp"><ThermometerSun size={15} aria-hidden="true"/> {Math.round(tempC)} °C normal</span>}
      </div>
    </div>
    <div className="field-week-grid">
      <div className="field-week-main">
        {!farm && <label className="week-province">Provincia para consultar la lluvia
          <select value={province ?? ""} onChange={event => {
            const point = provinces.find(item => item.name === event.target.value);
            if (point) onLocation({ longitude: point.longitude, latitude: point.latitude });
          }}><option value="" disabled>Elige tu provincia</option>{provinces.map(item => <option key={item.name}>{item.name}</option>)}</select>
        </label>}
        {(province || farm) && <RainCard rain={rain}/>}
      </div>
      <div className="field-week-side">
        {farm?.irrigation !== "rainfed" || savedTurn ? <div className="week-turn">
          <div className="subhead-help">
            <h3><CalendarDays aria-hidden="true"/> Turno de riego</h3>
            <HelpTip label="Turno de riego" text="Anota la fecha en que te toca agua del canal. La comparamos con los días de lluvia para ayudarte a planificar." />
          </div>
          {farm ? <>
            {savedTurn && <p className="turn-summary"><time dateTime={savedTurn}>{shortDate(savedTurn)}</time><span>{savedTurn < localDate() ? "Turno pasado" : turnDay ? `${turnDay.rainMm} mm${turnDay.probPct !== null ? ` · ${turnDay.probPct}% de lluvia` : " previstos"}` : "Sin pronóstico actualizado"}</span></p>}
            <form onSubmit={saveTurn}>
              <label>Fecha que te dio la junta<input type="date" value={turn} min={localDate()} required onChange={event => { setTurn(event.target.value); setStatus(""); }}/></label>
              <button type="submit" disabled={!turn || turn === savedTurn}>Guardar turno</button>
              {savedTurn && <button type="button" className="link-button" onClick={() => { setTurn(""); setStatus(onTurn("") ? "Turno borrado." : "Este navegador no pudo borrar el turno."); }}>Borrar turno</button>}
            </form>
            <p className="week-note">Confirma los cambios de turno con tu junta.</p>
            <p role="status" className="week-note">{status}</p>
          </> : <div className="week-turn-empty"><p className="week-note">Registra tu finca para guardar tu fecha de turno y ver si llueve ese día.</p><button type="button" className="workbench-button" onClick={onAdd}>Registrar finca para guardar turno</button></div>}
        </div> : <p className="week-note">Cultivo de lluvia</p>}
        <a className="indomet-link" href="https://indomet.gob.do/pronostico/">Avisos de INDOMET →</a>
      </div>
    </div>
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
