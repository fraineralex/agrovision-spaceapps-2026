/* AI: Claude (Anthropic), 2026-11-14 — collapsible section so the phone view leads with the recommendation. Frainer review pending. */
"use client";
import { useState } from "react";
export function Fold({ icon, title, teaser, children, onOpen, id }: { icon: string; title: string; teaser?: React.ReactNode; children: React.ReactNode; onOpen?: () => void; id?: string }) {
  const [open, setOpen] = useState(false);
  return <details id={id} className="card fold" open={open} onToggle={e => { const o = (e.currentTarget as HTMLDetailsElement).open; setOpen(o); if (o) onOpen?.(); }}>
    <summary><span className="fold-icon" aria-hidden="true">{icon}</span><span className="fold-text"><strong>{title}</strong>{teaser && <small>{teaser}</small>}</span><span className="fold-chevron" aria-hidden="true">›</span></summary>
    {open && <div className="fold-body">{children}</div>}
  </details>;
}
