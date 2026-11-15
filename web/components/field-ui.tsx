/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending. */
"use client";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { AlertTriangle, Satellite, Star } from "lucide-react";
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

export function Stars({ score, size = 22 }: { score: number | null; size?: number }) {
  const text = messages[useLocale()].fieldUi;
  const n = score === null ? 0 : Math.max(1, Math.min(5, Math.round(score)));
  return <span className="stars" role="img" aria-label={score === null ? text.noStars : text.stars.replace("{count}", String(n))}>
    {[1, 2, 3, 4, 5].map(i => <Star key={i} aria-hidden="true" size={size} className={i <= n ? "star on" : "star"} />)}
  </span>;
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
  const text = messages[useLocale()].fieldUi;
  return <section className="picker-stage" aria-label={text.farmMap}>{children}</section>;
}
