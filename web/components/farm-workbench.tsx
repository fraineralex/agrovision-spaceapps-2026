/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";

import { CalendarDays, CloudRain, Coins, Droplets, MapPin, Mic, Sprout, Sun, ThermometerSun } from "lucide-react";
import { useState, type FormEvent } from "react";
import { HelpTip } from "@/components/help-tip";
import { CustomSelect } from "@/components/custom-select";
import { allCrops, cropNames, monthNames, type CropId } from "@/lib/advisor";
import type { Farm, IrrigationDate } from "@/lib/farms";
import { provinces, type Location } from "@/lib/geography-core";
import { localDate, shortDate } from "@/lib/rain";
import { RainCard, type useRain } from "@/components/rain-card";

export type SectionTab = "siembra" | "lluvia" | "venta" | "mapa" | "preguntar";

export function BottomNav({
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
    { id: "mapa", label: "Fincas", Icon: MapPin },
    { id: "preguntar", label: "Ayuda", Icon: Mic },
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
            tabIndex={selected ? 0 : -1}
            onKeyDown={event => {
              const index = tabs.findIndex(tab => tab.id === id);
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
                : event.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length
                : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
              if (next < 0) return;
              event.preventDefault();
              onSelectTab(tabs[next].id);
              document.getElementById("tab-" + tabs[next].id)?.focus();
            }}
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

export function FieldWeek({ farm, province, rain, droughtLabel, tempC, areaText, supervisor = false, onIrrigationDate, onAdd, onLocation }: {
  farm: Farm | null;
  province?: string;
  rain: ReturnType<typeof useRain>;
  droughtLabel?: string;
  tempC?: number | null;
  areaText?: string;
  supervisor?: boolean;
  onIrrigationDate: (entry?: IrrigationDate) => boolean;
  onAdd: () => void;
  onLocation: (point: Location) => void;
}) {
  const saved = farm?.irrigationDate ?? (farm?.waterTurn ? { date: farm.waterTurn, mode: "assigned" } as const : undefined);
  const [date, setDate] = useState(saved?.date ?? "");
  const [mode, setMode] = useState<IrrigationDate["mode"]>(saved?.mode ?? "own");
  const [status, setStatus] = useState("");
  const saveDate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(onIrrigationDate({ date, mode }) ? "Fecha guardada." : "No se pudo guardar la fecha.");
  };
  const clearDate = () => {
    if (!onIrrigationDate()) { setStatus("No se pudo borrar la fecha."); return; }
    setDate("");
    setStatus("Fecha borrada.");
  };
  const forecast = rain.fresh && rain.forecast && !rain.cached ? rain.forecast : null;
  const rainDay = forecast?.days.find(day => day.date === saved?.date);
  const weekRainMm = rain.forecast?.days ? Math.round(rain.forecast.days.reduce((sum, d) => sum + d.rainMm, 0)) : null;
  return <section id="lluvia-esta-semana" className="field-week" aria-labelledby="week-title">
    <div className="field-week-heading">
      <div>
        <p className="workbench-place"><MapPin aria-hidden="true"/> {farm?.province || province || "República Dominicana"}{areaText ? ` · ${areaText}` : ""}</p>
        <div className="subhead-help">
          <h2 id="week-title">Lluvia de la semana</h2>
          <HelpTip label="Lluvia de la semana" text="Mira la lluvia esperada de los próximos 7 días. Toca cualquier día para ver el detalle y anota aquí tu próxima fecha de riego." />
        </div>
      </div>
      <div className="week-telemetry" role="group" aria-label="Indicadores rápidos de la semana">
        {weekRainMm !== null && <span className="wt-chip rain"><CloudRain size={15} aria-hidden="true"/> <strong>{weekRainMm} mm</strong> <small>/ 7 días</small></span>}
        {droughtLabel && <span className="wt-chip drought"><Sun size={15} aria-hidden="true"/> Sequía: {droughtLabel.toLowerCase()}</span>}
        {tempC != null && <span className="wt-chip temp"><ThermometerSun size={15} aria-hidden="true"/> {Math.round(tempC)} °C (lo normal del mes)</span>}
      </div>
    </div>
    <div className="field-week-grid">
      <div className="field-week-main">
        {!farm && <div className="week-province ag-select-field"><span className="ag-select-label">Provincia para consultar la lluvia</span>
          <CustomSelect ariaLabel="Provincia para consultar la lluvia" placeholder="Elige tu provincia" value={province ?? ""} options={provinces.map(item => ({ value: item.name, label: item.name }))} onChange={val => {
            const point = provinces.find(item => item.name === val);
            if (point) onLocation({ longitude: point.longitude, latitude: point.latitude });
          }} />
        </div>}
        {(province || farm) && <RainCard rain={rain} supervisor={supervisor}/>}
      </div>
      <div className="field-week-side">
        {farm?.irrigation !== "rainfed" || saved ? <div className="week-turn">
          <div className="week-turn-head">
            <div className="subhead-help subhead-inline">
              <h3><Droplets aria-hidden="true"/> Próximo riego</h3>
              <HelpTip label="Próximo riego" text="Elige si tú decides el día de riego o si te dan turno de canal, y guarda la fecha para cruzarla con la lluvia." />
            </div>
            <a className="indomet-link" href="https://indomet.gob.do/pronostico/">Avisos de INDOMET →</a>
          </div>
          {farm ? <>
            {saved && <p className="turn-summary"><time dateTime={saved.date}>{shortDate(saved.date)}</time><strong>{saved.mode === "assigned" ? "Turno asignado" : "Fecha elegida"}</strong><span>{saved.date < localDate() ? "Fecha pasada" : rainDay ? `${rainDay.rainMm} mm${rainDay.probPct !== null ? ` · ${rainDay.probPct}% de lluvia` : " previstos"}` : "Sin pronóstico actualizado"}</span></p>}
            <form onSubmit={saveDate}>
              <fieldset className="irrigation-modes">
                <legend className="sr-only">Quién fija la fecha de riego</legend>
                {(["own", "assigned"] as const).map(value => <label className="irrigation-choice" key={value}>
                  <input type="radio" name="irrigation-mode" checked={mode === value} onChange={() => { setMode(value); setStatus(""); }}/>
                  {value === "own" ? <Droplets aria-hidden="true"/> : <CalendarDays aria-hidden="true"/>}
                  {value === "own" ? "Yo elijo" : "Me dan turno"}
                </label>)}
              </fieldset>
              <label>{mode === "assigned" ? "Fecha del turno" : "Fecha de riego"}<input type="date" value={date} min={localDate()} required onChange={event => { setDate(event.target.value); setStatus(""); }}/></label>
              <button type="submit" disabled={!date || (date === saved?.date && mode === saved.mode)}>Guardar fecha</button>
              {saved && <button type="button" className="link-button" onClick={clearDate}>Borrar fecha</button>}
            </form>
            {mode === "assigned" && <p className="week-note">Confirma los cambios con quien te asigna el turno.</p>}
            <p role="status" className="week-note">{status}</p>
          </> : <div className="week-turn-empty"><p className="week-note">Registra tu finca para guardar tu fecha de riego y ver si llueve ese día.</p><button type="button" className="workbench-button" onClick={onAdd}>Registrar finca para guardar riego</button></div>}
        </div> : <div className="week-turn-head"><p className="week-note">Cultivo de lluvia</p><a className="indomet-link" href="https://indomet.gob.do/pronostico/">Avisos de INDOMET →</a></div>}
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
      <div className="ag-select-field"><span className="ag-select-label">Mes para comparar</span><CustomSelect ariaLabel="Mes para comparar" value={String(sowMonth)} options={monthNames.map((month, index) => ({ value: String(index + 1), label: month }))} onChange={val => { onMonth(Number(val)); setStatus(""); }} /></div>
      <div className="ag-select-field"><span className="ag-select-label">Cultivo para tu plan</span><CustomSelect ariaLabel="Cultivo para tu plan" placeholder="Elige un cultivo" value={crop} options={[{ value: "", label: "Elige un cultivo" }, ...options.map(id => ({ value: id, label: cropNames[id] }))]} onChange={val => { setCrop(val as CropId | ""); setStatus(""); }} /></div>
      <div className="plan-form-actions">
        <button type="submit" disabled={!crop || (farm.plan?.crop === crop && farm.plan.sowMonth === sowMonth)}>Guardar plan</button>
        {farm.plan && <button type="button" className="link-button" onClick={() => setStatus(onSave(undefined) ? "Plan borrado." : "Este navegador no pudo borrar el plan.")}>Borrar plan</button>}
      </div>
    </form>
    <p role="status" className="note">{status}</p>
  </div>;
}
