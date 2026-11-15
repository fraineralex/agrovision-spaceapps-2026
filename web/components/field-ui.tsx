/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending. */
import { AlertTriangle, Satellite } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricTile({ label, value, detail, icon, children, tone }: {
  label: string; value: string; detail: string; icon: ReactNode; children?: ReactNode; tone: string;
}) {
  return <div className={cn("metric-tile", tone)}>
    <span className="metric-label"><span aria-hidden="true">{icon}</span> {label}</span>
    <strong>{value}</strong>
    <small>{detail}</small>
    {children}
  </div>;
}

export function WaterGauge({ value }: { value: number | null }) {
  return <span className="water-tank" aria-hidden="true">
    {value !== null && <span style={{ height: `${Math.max(0, Math.min(5, value)) * 20}%` }} />}
  </span>;
}

export function ScoreRing({ score, label }: { score: number; label: string }) {
  const offset = 100 - Math.max(0, Math.min(5, score)) * 20;
  return <div className="score-figure" role="img" aria-label={`${label}: ${score.toFixed(1).replace(".", ",")} de 5 puntos`}>
    <svg aria-hidden="true" viewBox="0 0 88 88" width="88" height="88">
      <circle cx="44" cy="44" r="38" />
      <circle cx="44" cy="44" r="38" pathLength="100" strokeDasharray="100" strokeDashoffset={offset} />
    </svg>
    <div aria-hidden="true"><strong>{score.toFixed(1).replace(".", ",")}</strong><small>de 5 pts</small></div>
  </div>;
}

export function RiskPill({ children }: { children: ReactNode }) {
  return <span className="risk-pill"><AlertTriangle size={15} aria-hidden="true" /> {children}</span>;
}

export function SourceChip({ children, href }: { children: ReactNode; href: string }) {
  return <a className="source-chip" href={href}><Satellite size={16} aria-hidden="true" /> {children}</a>;
}

export function StepProgress({ step, total }: { step: number; total: number }) {
  return <div className="step-progress">
    <span>Paso {step} de {total}</span>
    <progress aria-label="Progreso" max={total} value={step} />
  </div>;
}

export function HeroRecommendation({ children, actions, tone }: { children: ReactNode; actions: ReactNode; tone: string }) {
  return <Card className={cn("recommendation-hero", tone)}>
    <CardContent className="p-0 recommendation-content">{children}</CardContent>
    <CardFooter className="p-0 verdict-actions">{actions}</CardFooter>
  </Card>;
}

export function FieldMapCard({ children }: { children: ReactNode }) {
  return <section className="picker-stage" aria-label="Mapa para marcar la finca">{children}</section>;
}
