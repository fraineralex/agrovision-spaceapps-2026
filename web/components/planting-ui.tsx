/* AI: Codex/OpenAI with Impeccable, 2026-11-15. Frainer review pending. */
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { SectionPanel, type SectionPanelProps } from "@/components/ui/section-panel";
import { FarmIcon } from "@/components/farm-icon";
import type { CropAdvice } from "@/lib/advisor";

export function PlantingPanel(props: SectionPanelProps) {
  return <SectionPanel {...props} className={`planting-panel ${props.className ?? ""}`} />;
}

export function CropIdentity({ name, crop, recommended = false, action, children }: {
  name: string; crop: string; recommended?: boolean; action?: ReactNode; children?: ReactNode;
}) {
  return <div className="planting-crop-identity">
    <span className="planting-crop-icon" aria-hidden="true"><FarmIcon name={crop} size={26}/></span>
    <div className="planting-crop-copy"><h3>{name}</h3>{recommended && <span className="planting-recommended">Recomendado</span>}{children}</div>
    {action}
  </div>;
}

export function CropSourceButton({ name, onClick }: { name: string; onClick: () => void }) {
  return <button type="button" className="planting-source-button" onClick={onClick}
    aria-label={`Por qué ${name}: explicación y fuentes`} title="Explicación y fuentes"><Info size={18} aria-hidden="true"/></button>;
}

const pillars = [
  { id: "water", label: "Agua" }, { id: "climate", label: "Sequía" },
  { id: "pests", label: "Plagas" }, { id: "market", label: "Precio" },
] as const;

export function PlantingPillars({ advice, showScores = false }: { advice: CropAdvice; showScores?: boolean }) {
  return <ul className="planting-pillars" aria-label={`Indicadores de ${advice.name}`}>
    {pillars.map(({ id, label }) => {
      const score = advice.scores[id];
      return <li key={id} className={`planting-pillar is-${advice.lights[id]}`} title={advice.words[id]}>
        <span><FarmIcon name={id} size={15}/>{label}{showScores && score !== null && <em className="pillar-score">{score.toFixed(1)}/5</em>}</span>
        <strong>{advice.titles[id]}</strong>
      </li>;
    })}
  </ul>;
}
