/* AI: Claude (Anthropic) & Codex (OpenAI), 2026-11-14; UI/i18n polish: Antigravity, 2026-11-15. */
"use client";
import { AlertTriangle, CalendarDays, Info, MapPin, Wheat } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { cropLabel, localizedAdviceSentence, localizedPestPrecautions, localizedPillarTitle, localizedPillarWord, localizedWarnings, monthLabel } from "@/lib/i18n/advice";
import { HeroRecommendation, MetricTile, RiskPill, SourceChip, Stars, WaterGauge } from "@/components/field-ui";
import { FarmIcon } from "@/components/farm-icon";
import { PestOverview } from "@/components/pest-overview";
import { PlantingPanel, CropIdentity, CropSourceButton, PlantingPillars } from "@/components/planting-ui";
import { CustomSelect } from "@/components/custom-select";
import { adviseNextCrop, lightFor, recommendedCrop, type AdvicePriority, type CropAdvice, type CropId, type Pillar, type PreviousCrop } from "@/lib/advisor";
import { SourcesSheet } from "@/components/sources-sheet";
import { climate, type Irrigation } from "@/lib/data";
import { useReadAloud } from "@/lib/use-read-aloud";
import { profitFor } from "@/lib/profit";

const pillarInfo: { id: Pillar; icon: string }[] = [
  { id: "water", icon: "water" }, { id: "climate", icon: "climate" },
  { id: "pests", icon: "pests" }, { id: "market", icon: "market" },
];

type Props = {
  province?: string; irrigation: Irrigation; previous: PreviousCrop; sowMonth: number; priority: AdvicePriority; crops: CropId[];
  supervisor?: boolean; onEdit: () => void; onTop?: (crop: CropId) => void; onSowMonth?: (month: number) => void;
};

function CropRow({ a, top, supervisor, onSources }: { a: CropAdvice; top: boolean; supervisor: boolean; onSources: () => void }) {
  const locale = useLocale();
  const text = messages[locale].advisor;
  const name = cropLabel(a.crop, locale);
  const rowLight = lightFor(a.overall);
  const pct = a.overall === null ? 12 : Math.max(15, Math.min(100, Math.round((a.overall / 5) * 100)));
  const alertCount = a.pestPrecautions.length + (a.repeats ? 1 : 0);
  const techSubtitle = supervisor
    ? (a.cycleDays > 0
      ? `${locale === "en" ? "Cycle" : "Ciclo"} ~${a.cycleDays} d · ${a.kcDays} Kc·d`
      : `${locale === "en" ? "Permanent" : "Permanente"} · ${a.kcDays} Kc·d`)
    : null;
  return <li className={top ? "crop-row top" : "crop-row"}>
    <CropIdentity name={name} crop={a.crop} recommended={top && a.overall !== null} action={<CropSourceButton name={name} onClick={onSources}/>}>
      {techSubtitle && <small className="crop-tech-meta">{techSubtitle}</small>}
    </CropIdentity>
    {!a.viable && <span className="planting-note">{text.noIrrigation}</span>}
    <div className="crop-row-rating">
      <Stars score={a.overall} size={18} />
      {supervisor && a.overall !== null && <strong className="rating-numeric">{a.overall.toFixed(1)}</strong>}
      <div className="crop-row-meter" aria-hidden="true"><span className={`crop-row-fill ${rowLight}`} style={{ width: `${pct}%` }} /></div>
    </div>
    <PlantingPillars advice={a} showScores={supervisor}/>
    {alertCount > 0 && <details className="visual-details crop-row-alert"><summary><AlertTriangle aria-hidden="true" size={13} /> {text.precautions} ({alertCount})</summary><PestOverview advice={a}/></details>}
  </li>;
}

export function AdvisorCard(p: Props) {
  const locale = useLocale();
  const text = messages[locale].advisor;
  const voiceText = messages[locale].voice;
  const [sources, setSources] = useState<CropAdvice | null>(null);
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  const repeat = advice.find(item => item.repeats);
  const historical = top ? profitFor(top.crop, 1, p.irrigation) : null;
  const loss = historical && !("unavailable" in historical) && historical.profit.mid < 0;
  const now = new Date();
  const sowYear = now.getFullYear() + Number(p.sowMonth <= now.getMonth());
  const harvestYear = top ? sowYear + Math.floor((p.sowMonth - 1 + Math.round(top.cycleDays / 30)) / 12) : sowYear;
  const sentence = localizedAdviceSentence(top, p.previous, locale);
  const reason = top?.scores.pests === 5 ? text.reasonIdiaf : (top?.scores.water ?? 0) >= 3.34 ? text.reasonWater : text.reasonBest;
  const notes = top ? [...localizedWarnings(top, locale), ...localizedPestPrecautions(p.previous, top.crop, locale)] : [];
  const summary = [sentence, ...notes, text.checkTechnician].join(" ");
  const { reading, read, stop } = useReadAloud();
  const supervisor = Boolean(p.supervisor);
  const light = lightFor(top?.overall ?? null);
  const greenCount = advice.filter(a => lightFor(a.overall) === "green").length;
  const amberCount = advice.filter(a => lightFor(a.overall) === "amber").length;
  const redCount = advice.filter(a => lightFor(a.overall) === "red").length;
  const lightWordMap = { green: text.worth, amber: text.possible, red: text.unsuitable, gray: text.missing } as const;
  return <section className="card advisor planting-overview" aria-label={text.sow} aria-live="polite">
    <div className="profile-line">
      <span className="profile-loc"><MapPin aria-hidden="true" size={18} /> {p.province ?? text.noProvince} · {text[p.irrigation]}</span>
      <div className="profile-actions">
        {p.onSowMonth && (
          <div className="inline-month-pick">
            <span>{messages[locale].onboarding.sowMonth}</span>
            <CustomSelect ariaLabel={messages[locale].onboarding.sowMonth} value={String(p.sowMonth)} options={Array.from({ length: 12 }, (_, idx) => ({ value: String(idx + 1), label: monthLabel(idx + 1, locale) }))} onChange={val => p.onSowMonth?.(Number(val))} />
          </div>
        )}
        <button type="button" className="ob-link" onClick={p.onEdit}>{text.change}</button>
      </div>
    </div>
    <HeroRecommendation tone={"tone-" + light} actions={<>
      <button type="button" className="listen" onClick={() => void read(summary)}><FarmIcon name="sound" size={18} /> {text.hear}</button>
      {top && <button type="button" className="src-button" onClick={() => setSources(top)}><Info aria-hidden="true" size={18} /> {text.why}</button>}
    </>}>
      {top && top.overall !== null ? <>
        <div className="recommendation-heading">
          <div>
            <span className="recommendation-caption">{text.sow}</span>
            <h2>{cropLabel(top.crop, locale)}</h2>
            {p.previous !== "unknown" && <p className="previous-crop">{text.after.replace("{crop}", cropLabel(p.previous, locale).toLowerCase())}</p>}
          </div>
          <span className="crop-illustration" aria-hidden="true"><FarmIcon name={top.crop} size={60} /></span>
          <div className="recommendation-score">
            <Stars score={top.overall} />
            <span>{lightWordMap[light]}{supervisor ? ` · ${top.overall.toFixed(1)}/5` : ""}</span>
          </div>
        </div>
        <p className="advisor-reason">{reason}</p>
        <div className="recommendation-meta">
          <span><Wheat aria-hidden="true" size={17} /> <strong>{monthLabel(top.harvestMonth, locale)} {harvestYear}</strong><small>{text.harvest}</small></span>
          {supervisor && <span className="tech-meta-pill">FAO-56: {top.cycleDays > 0 ? `${top.cycleDays} d` : (locale === "en" ? "Permanent" : "Permanente")} · {top.kcDays} Kc·d</span>}
          <SourceChip href={climate.source.url}>NASA POWER</SourceChip>
        </div>
        <RiskPill>{loss ? text.riskLoss : notes[0]?.split(". ")[0] || text.confirmWater}</RiskPill>
      </> : <p>{sentence}{repeat ? text.noRecommendationRepeat : ""}</p>}
    </HeroRecommendation>
    {top && <div className="metric-tiles" role="group" aria-label={text.whyPillars.replace("{crop}", cropLabel(top.crop, locale))}>
      {pillarInfo.map(({ id, icon }) => {
        const c = top.lights[id];
        const score = top.scores[id];
        const label = text[id];
        return (
          <MetricTile key={id} label={supervisor && score !== null ? `${label} · ${score.toFixed(1)}/5` : label}
            icon={<FarmIcon name={icon} size={18} />} tone={"metric-" + id + " tile-" + c}
            value={localizedPillarTitle(id, top.scores[id], locale)} detail={localizedPillarWord(top, id, locale)}>
            {id === "water" && <WaterGauge value={top.scores.water} />}
          </MetricTile>
        );
      })}
    </div>}
    {reading && <div className="decision-reading"><p role="status">{reading.status}</p><p>{reading.text}</p>{reading.generated && <p>{voiceText.generated}</p>}{(reading.phase === "loading" || reading.phase === "playing") && <button type="button" className="src-button" onClick={stop}>{text.stopReading}</button>}</div>}

    <PlantingReview province={p.province} irrigation={p.irrigation} previous={p.previous} sowMonth={p.sowMonth} priority={p.priority} crops={p.crops} />

    <PlantingPanel id="crop-comparison" title={`${text.allCrops} (${p.crops.length})`} icon={CalendarDays} className="crop-comparison" tools={<span className="crops-dist-pills">
      {greenCount > 0 && <em className="dist-pill green">{greenCount} {text.worth}</em>}
      {amberCount > 0 && <em className="dist-pill amber">{amberCount} {text.possible}</em>}
      {redCount > 0 && <em className="dist-pill red">{redCount} {text.unsuitable}</em>}
    </span>}>
      <div className="crops-dist-bar" aria-hidden="true">
        {greenCount > 0 && <span className="dist-seg green" style={{ flex: greenCount }} />}
        {amberCount > 0 && <span className="dist-seg amber" style={{ flex: amberCount }} />}
        {redCount > 0 && <span className="dist-seg red" style={{ flex: redCount }} />}
      </div>
      <ul className="crop-list" data-count={p.crops.length} aria-label={text.compareCrops}>
        {advice.map(a => <CropRow key={a.crop} a={a} top={a === top} supervisor={supervisor} onSources={() => setSources(a)} />)}
        {p.crops.filter(crop => !advice.some(item => item.crop === crop)).map(crop => (
          <li key={crop} className="crop-row crop-row-empty">
            <CropIdentity name={cropLabel(crop, locale)} crop={crop}/>
            <p className="planting-note">{text.noData}</p>
          </li>
        ))}
      </ul>
    </PlantingPanel>

    {sources && <SourcesSheet advice={sources} all={advice} province={p.province} previous={p.previous} irrigation={p.irrigation} sowMonth={p.sowMonth} onClose={() => setSources(null)} />}
  </section>;
}

export function PlantingReview(p: Pick<Props, "province" | "irrigation" | "previous" | "sowMonth" | "priority" | "crops">) {
  const locale = useLocale();
  const text = messages[locale].advisor;
  const advice = useMemo(() => adviseNextCrop({ province: p.province, irrigation: p.irrigation, previous: p.previous, sowMonth: p.sowMonth, priority: p.priority, crops: p.crops }), [p.province, p.irrigation, p.previous, p.sowMonth, p.priority, p.crops]);
  const top = recommendedCrop(advice);
  if (!top) return null;
  const repeat = advice.find(item => item.repeats);
  const historical = profitFor(top.crop, 1, p.irrigation);
  const loss = historical && !("unavailable" in historical) && historical.profit.mid < 0;
  const notes = [...localizedWarnings(top, locale), ...localizedPestPrecautions(p.previous, top.crop, locale)];
  return <details className="compare-fold planting-review"><summary><AlertTriangle aria-hidden="true" /> {text.whatToCheck}</summary>
    <p>{text.checkWater}</p>
    <ul className="decision-risks">
      {loss && <li>{text.riskLoss}</li>}
      {notes.map(note => <li key={note}>{note}</li>)}
      {repeat && <li>{text.repeatRisk.replace("{crop}", cropLabel(repeat.crop, locale).toLowerCase())}</li>}
    </ul>
    <p className="note">{text.climateSource}</p>
  </details>;
}
