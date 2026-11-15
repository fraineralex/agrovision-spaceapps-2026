/* AI: OpenAI, 2026-11-15. Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic) and Codex (OpenAI), 2026-11-14; SVG crop icons, radial gauge, pillar bars & animated timeline by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
"use client";
import { AlertTriangle, CalendarDays, Info, MapPin, Wheat } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { cropLabel, localizedAdviceSentence, localizedPestPrecautions, localizedPillarTitle, localizedPillarWord, localizedWarnings, monthLabel } from "@/lib/i18n/advice";
import { HeroRecommendation, MetricTile, RiskPill, SourceChip, Stars, WaterGauge } from "@/components/field-ui";
import { CustomSelect } from "@/components/custom-select";
import { FarmIcon } from "@/components/farm-icon";
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
  onEdit: () => void; onTop?: (crop: CropId) => void; onSowMonth?: (month: number) => void;
};

function CropRow({ a, top, previous, onSources }: { a: CropAdvice; top: boolean; previous: PreviousCrop; onSources: () => void }) {
  const locale = useLocale();
  const text = messages[locale].advisor;
  const name = cropLabel(a.crop, locale);
  const precautions = localizedPestPrecautions(previous, a.crop, locale);
  const rowLight = lightFor(a.overall);
  const pct = a.overall === null ? 12 : Math.max(15, Math.min(100, Math.round((a.overall / 5) * 100)));
  const alertCount = a.pestPrecautions.length + (a.repeats ? 1 : 0);
  return <li className={top ? "crop-row top" : "crop-row"}>
    <div className="crop-row-head">
      <span className="crop-medallion sm" aria-hidden="true"><FarmIcon name={a.crop} size={18} /></span>
      <div className="crop-row-title">
        <strong>{name}</strong>
      </div>
      {top && a.overall !== null && <span className="badge top-badge">{text.recommended}</span>}
      {!a.viable && <span className="badge gray">{text.noIrrigation}</span>}
      <button type="button" className="src-button icon-only" onClick={onSources} aria-label={`Por qué ${name}: explicación y fuentes`} title="Explicación y fuentes">
        <Info aria-hidden="true" size={16} />
      </button>
    </div>
    <div className="crop-row-rating"><Stars score={a.overall} size={19} /><div className="crop-row-meter" aria-hidden="true"><span className={`crop-row-fill ${rowLight}`} style={{ width: `${pct}%` }} /></div></div>
    <div className="pillar-row">{pillarInfo.map(pi => { const c = a.lights[pi.id]; return <span key={pi.id} className={`pillar-chip ${c}`} title={`${text[pi.id]}: ${localizedPillarWord(a,pi.id,locale)}`}>
      <FarmIcon name={pi.icon} size={13} /><span>{text[pi.id]}</span></span>; })}</div>
    {alertCount > 0 && <details className="visual-details crop-row-alert"><summary><AlertTriangle aria-hidden="true" size={13} /> {text.precautions} ({alertCount})</summary>{a.repeats && <p className="warning">{text.repeatWarning.replace("{crop}", name.toLowerCase())}</p>}{precautions.map(note => <p key={note} className="warning"><span>{note}</span></p>)}</details>}
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
  const light = lightFor(top?.overall ?? null);
  const greenCount = advice.filter(a => lightFor(a.overall) === "green").length;
  const amberCount = advice.filter(a => lightFor(a.overall) === "amber").length;
  const redCount = advice.filter(a => lightFor(a.overall) === "red").length;
  return <section className="card advisor planting-overview" aria-label={text.sow} aria-live="polite">
    <div className="profile-line">
      <span className="profile-loc"><MapPin aria-hidden="true" size={18} /> {p.province ?? text.noProvince} · {text[p.irrigation]}</span>
      <div className="profile-actions">
        {p.onSowMonth && (
          <div className="inline-month-pick">
            <span>{messages[locale].onboarding.sowMonth}</span>
            <CustomSelect ariaLabel={messages[locale].onboarding.sowMonth} value={String(p.sowMonth)} options={Array.from({length:12}, (_, idx) => ({ value: String(idx + 1), label: monthLabel(idx + 1, locale) }))} onChange={val => p.onSowMonth?.(Number(val))} />

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
            <span>{{ green: text.worth, amber: text.possible, red: text.unsuitable, gray: text.missing }[light]}</span>
          </div>
        </div>
        <p className="advisor-reason">{reason}</p>
        <div className="recommendation-meta">
          <span><Wheat aria-hidden="true" size={17} /> <strong>{monthLabel(top.harvestMonth, locale)} {harvestYear}</strong><small>{text.harvest}</small></span>
          <SourceChip href={climate.source.url}>NASA POWER</SourceChip>
        </div>
        <RiskPill>{loss ? text.riskLoss : notes[0]?.split(". ")[0] || text.confirmWater}</RiskPill>
      </> : <p>{sentence}{repeat ? text.noRecommendationRepeat : ""}</p>}
    </HeroRecommendation>
    {top && <div className="metric-tiles" role="group" aria-label={text.whyPillars.replace("{crop}",cropLabel(top.crop,locale))}>
      {pillarInfo.map(({ id, icon }) => {
        const c = top.lights[id];
        return (
          <MetricTile key={id} label={text[id]}
            icon={<FarmIcon name={icon} size={18} />} tone={"metric-" + id + " tile-" + c}
            value={localizedPillarTitle(id,top.scores[id],locale)} detail={localizedPillarWord(top,id,locale)}>
            {id === "water" && <WaterGauge value={top.scores.water} />}
          </MetricTile>
        );
      })}
    </div>}
    {reading && <div className="decision-reading"><p role="status">{reading.status}</p><p>{reading.text}</p>{reading.generated && <p>{voiceText.generated}</p>}{(reading.phase === "loading" || reading.phase === "playing") && <button type="button" className="src-button" onClick={stop}>{text.stopReading}</button>}</div>}

    <section className="compare-fold crop-comparison" aria-labelledby="crop-comparison-title">
      <div className="crop-comparison-head">
        <h2 id="crop-comparison-title" className="compare-summary-title"><CalendarDays aria-hidden="true" /> {text.allCrops} ({p.crops.length})</h2>
        <span className="crops-dist-pills">
          {greenCount > 0 && <em className="dist-pill green">{greenCount} {text.worth}</em>}
          {amberCount > 0 && <em className="dist-pill amber">{amberCount} {text.possible}</em>}
          {redCount > 0 && <em className="dist-pill red">{redCount} {text.unsuitable}</em>}
        </span>
      </div>
      <div className="crops-dist-bar" aria-hidden="true">
        {greenCount > 0 && <span className="dist-seg green" style={{ flex: greenCount }} />}
        {amberCount > 0 && <span className="dist-seg amber" style={{ flex: amberCount }} />}
        {redCount > 0 && <span className="dist-seg red" style={{ flex: redCount }} />}
      </div>
      <ul className="crop-list" aria-label={text.compareCrops}>{advice.map(a => <CropRow key={a.crop} a={a} top={a === top} previous={p.previous} onSources={() => setSources(a)} />)}{p.crops.filter(crop => !advice.some(item => item.crop === crop)).map(crop => <li key={crop}>{cropLabel(crop,locale)} · {text.noData}</li>)}</ul>
    </section>

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
      {repeat && <li>{text.repeatRisk.replace("{crop}",cropLabel(repeat.crop,locale).toLowerCase())}</li>}
    </ul>
    <p className="note">{text.climateSource}</p>
  </details>;
}
