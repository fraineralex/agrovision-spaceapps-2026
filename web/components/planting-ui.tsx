/* AI: Codex/OpenAI with Impeccable, 2026-11-15; i18n integration, 2026-11-15. */
"use client";
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { SectionPanel, type SectionPanelProps } from "@/components/ui/section-panel";
import { FarmIcon } from "@/components/farm-icon";
import { useLocale } from "@/lib/i18n/client";
import { cropLabel, localizedAdvicePillarTitle, localizedPillarWord } from "@/lib/i18n/advice";
import { messages } from "@/lib/i18n/messages";
import type { CropAdvice } from "@/lib/advisor";

export function PlantingPanel(props: SectionPanelProps) {
  return <SectionPanel {...props} className={`planting-panel ${props.className ?? ""}`} />;
}

export function CropIdentity({ name, crop, recommended = false, action, children }: {
  name: string; crop: string; recommended?: boolean; action?: ReactNode; children?: ReactNode;
}) {
  const locale = useLocale();
  return <div className="planting-crop-identity">
    <span className="planting-crop-icon" aria-hidden="true"><FarmIcon name={crop} size={26}/></span>
    <div className="planting-crop-copy"><h3>{name}</h3>{recommended && <span className="planting-recommended">{messages[locale].advisor.recommended}</span>}{children}</div>
    {action}
  </div>;
}

export function CropSourceButton({ name, onClick }: { name: string; onClick: () => void }) {
  const locale = useLocale();
  const label = messages[locale].advisor.explanation;
  const aria = locale === "en" ? `Why ${name}: explanation and sources` : `Por qué ${name}: explicación y fuentes`;
  return <button type="button" className="planting-source-button" onClick={onClick}
    aria-label={aria} title={label}><Info size={18} aria-hidden="true"/></button>;
}

export function PlantingPillars({ advice, showScores = false }: { advice: CropAdvice; showScores?: boolean }) {
  const locale = useLocale();
  const labels = messages[locale].advisor;
  const pillars = [
    { id: "water", label: labels.water },
    { id: "climate", label: labels.climate },
    { id: "pests", label: labels.pests },
    { id: "market", label: labels.market },
  ] as const;
  const crop = cropLabel(advice.crop, locale);
  const aria = locale === "en" ? `Indicators for ${crop}` : `Indicadores de ${crop}`;
  return <ul className="planting-pillars" aria-label={aria}>
    {pillars.map(({ id, label }) => {
      const score = advice.scores[id];
      return <li key={id} className={`planting-pillar is-${advice.lights[id]}`} title={localizedPillarWord(advice, id, locale)}>
        <span><FarmIcon name={id} size={15}/>{label}{showScores && score !== null && <em className="pillar-score">{score.toFixed(1)}/5</em>}</span>
        <strong>{localizedAdvicePillarTitle(advice, id, locale)}</strong>
      </li>;
    })}
  </ul>;
}
