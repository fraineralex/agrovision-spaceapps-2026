/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Codex (OpenAI), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";

import { CalendarDays, CloudRain, Coins, Droplets, MapPin, Mic, Sprout, Sun, ThermometerSun } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { weatherMessages } from "@/lib/i18n/weather-messages";
import { localizedShortDate } from "@/lib/i18n/rain";
import { cropLabel, monthLabel } from "@/lib/i18n/advice";
import { HelpTip } from "@/components/help-tip";
import { CustomSelect } from "@/components/custom-select";
import { allCrops, type CropId } from "@/lib/advisor";
import type { Farm, IrrigationDate } from "@/lib/farms";
import { provinces, type Location } from "@/lib/geography-core";
import { localDate } from "@/lib/rain";
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
  const text = messages[useLocale()].navigation;
  const tabs: { id: SectionTab; label: string; Icon: typeof Sprout; badge?: string }[] = [
    { id: "siembra", label: text.planting, Icon: Sprout },
    { id: "lluvia", label: text.rain, Icon: CloudRain, badge: weekRainMm != null ? `${weekRainMm} mm` : undefined },
    { id: "venta", label: text.sale, Icon: Coins },
    { id: "mapa", label: text.farms, Icon: MapPin },
    { id: "preguntar", label: text.help, Icon: Mic },
  ];
  return (
    <div className="workbench-nav" role="tablist" aria-label={text.sections}>
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
  const locale = useLocale();
  const text = weatherMessages[locale];
  const saved = farm?.irrigationDate ?? (farm?.waterTurn ? { date: farm.waterTurn, mode: "assigned" } as const : undefined);
  const [date, setDate] = useState(saved?.date ?? "");
  const [mode, setMode] = useState<IrrigationDate["mode"]>(saved?.mode ?? "own");
  const [status, setStatus] = useState<"dateSaved" | "dateSaveError" | "dateDeleteError" | "dateDeleted" | "">("");
  const saveDate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(onIrrigationDate({ date, mode }) ? "dateSaved" : "dateSaveError");
  };
  const clearDate = () => {
    if (!onIrrigationDate()) { setStatus("dateDeleteError"); return; }
    setDate("");
    setStatus("dateDeleted");
  };
  const forecast = rain.fresh && rain.forecast && !rain.cached ? rain.forecast : null;
  const rainDay = forecast?.days.find(day => day.date === saved?.date);
  const weekRainMm = rain.forecast?.days ? Math.round(rain.forecast.days.reduce((sum, d) => sum + d.rainMm, 0)) : null;
  return <section id="lluvia-esta-semana" className="field-week" aria-labelledby="week-title">
    <div className="field-week-heading">
      <div>
        <p className="workbench-place"><MapPin aria-hidden="true"/> {farm?.province || province || text.country}{areaText ? ` · ${areaText}` : ""}</p>
        <div className="subhead-help">
          <h2 id="week-title">{text.week}</h2>
          <HelpTip label={text.week} text={text.weekHelp} />
        </div>
      </div>
      <div className="week-telemetry" role="group" aria-label={text.telemetry}>
        {weekRainMm !== null && <span className="wt-chip rain"><CloudRain size={15} aria-hidden="true"/> <strong>{weekRainMm} mm</strong> <small>{text.days7}</small></span>}
        {droughtLabel && <span className="wt-chip drought"><Sun size={15} aria-hidden="true"/> {text.drought} {droughtLabel.toLowerCase()}</span>}
        {tempC != null && <span className="wt-chip temp"><ThermometerSun size={15} aria-hidden="true"/> {Math.round(tempC)} °C {text.normalMonth}</span>}
      </div>
    </div>
    <div className="field-week-grid">
      <div className="field-week-main">
        {!farm && <div className="week-province ag-select-field"><span className="ag-select-label">{text.province}</span>
          <CustomSelect ariaLabel={text.province} placeholder={text.chooseProvince} value={province ?? ""} options={provinces.map(item => ({ value: item.name, label: item.name }))} onChange={val => {
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
              <h3><Droplets aria-hidden="true"/> {text.nextIrrigation}</h3>
              <HelpTip label={text.nextIrrigation} text={text.irrigationHelp} />
            </div>
            <a className="indomet-link" href="https://indomet.gob.do/pronostico/">{text.warnings}</a>
          </div>
          {farm ? <>
            {saved && <p className="turn-summary"><time dateTime={saved.date}>{localizedShortDate(saved.date, locale)}</time><strong>{saved.mode === "assigned" ? text.assigned : text.chosen}</strong><span>{saved.date < localDate() ? text.past : rainDay ? `${rainDay.rainMm} mm${rainDay.probPct !== null ? ` · ${text.rainOnDay.replace("{percent}", String(rainDay.probPct))}` : ` ${text.expected}`}` : text.noCurrentForecast}</span></p>}
            <form onSubmit={saveDate}>
              <fieldset className="irrigation-modes">
                <legend className="sr-only">{text.whoSets}</legend>
                {(["own", "assigned"] as const).map(value => <label className="irrigation-choice" key={value}>
                  <input type="radio" name="irrigation-mode" checked={mode === value} onChange={() => { setMode(value); setStatus(""); }}/>
                  {value === "own" ? <Droplets aria-hidden="true"/> : <CalendarDays aria-hidden="true"/>}
                  {value === "own" ? text.own : text.assignedChoice}
                </label>)}
              </fieldset>
              <label>{mode === "assigned" ? text.turnDate : text.irrigationDate}<input type="date" value={date} min={localDate()} required onChange={event => { setDate(event.target.value); setStatus(""); }}/></label>
              <button type="submit" disabled={!date || (date === saved?.date && mode === saved.mode)}>{text.saveDate}</button>
              {saved && <button type="button" className="link-button" onClick={clearDate}>{text.deleteDate}</button>}
            </form>
            {mode === "assigned" && <p className="week-note">{text.confirmTurn}</p>}
            <p role="status" className="week-note">{status ? text[status] : ""}</p>
          </> : <div className="week-turn-empty"><p className="week-note">{text.registerToSave}</p><button type="button" className="workbench-button" onClick={onAdd}>{text.registerFarm}</button></div>}
        </div> : <div className="week-turn-head"><p className="week-note">{text.rainfed}</p><a className="indomet-link" href="https://indomet.gob.do/pronostico/">{text.warnings}</a></div>}
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
  const locale = useLocale();
  const text = weatherMessages[locale];
  const [crop, setCrop] = useState<CropId | "">(farm.plan?.crop ?? "");
  const [status, setStatus] = useState<"planSaved" | "planSaveError" | "planDeleted" | "planDeleteError" | "">("");
  const options = farm.plan ? [...new Set([...farm.crops, farm.plan.crop])] : farm.crops;
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (crop && allCrops.includes(crop)) setStatus(onSave({ crop, sowMonth }) ? "planSaved" : "planSaveError");
  };
  return <div className="planting-plan">
    {farm.plan && <p className="saved-plan"><strong>{text.savedPlan}</strong> · {text.planIn.replace("{crop}", cropLabel(farm.plan.crop, locale)).replace("{month}", monthLabel(farm.plan.sowMonth, locale))}</p>}
    <form className="workbench-form" onSubmit={save}>
      <div className="ag-select-field"><span className="ag-select-label">{text.compareMonth}</span><CustomSelect ariaLabel={text.compareMonth} value={String(sowMonth)} options={Array.from({length:12}, (_, index) => ({ value: String(index + 1), label: monthLabel(index + 1, locale) }))} onChange={val => { onMonth(Number(val)); setStatus(""); }} /></div>
      <div className="ag-select-field"><span className="ag-select-label">{text.planCrop}</span><CustomSelect ariaLabel={text.planCrop} placeholder={text.chooseCrop} value={crop} options={[{ value: "", label: text.chooseCrop }, ...options.map(id => ({ value: id, label: cropLabel(id,locale) }))]} onChange={val => { setCrop(val as CropId | ""); setStatus(""); }} /></div>
      <div className="plan-form-actions">
        <button type="submit" disabled={!crop || (farm.plan?.crop === crop && farm.plan.sowMonth === sowMonth)}>{text.savePlan}</button>
        {farm.plan && <button type="button" className="link-button" onClick={() => setStatus(onSave(undefined) ? "planDeleted" : "planDeleteError")}>{text.deletePlan}</button>}
      </div>
    </form>
    <p role="status" className="note">{status ? text[status] : ""}</p>
  </div>;
}
