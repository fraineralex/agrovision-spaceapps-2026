/* AI: Claude (Anthropic), 2026-11-14 — switch, add, edit and delete saved farms. Frainer review pending. See AI_USAGE.md. */
"use client";
import { Home, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { areaLabel, piecesAreaM2, type Farm } from "@/lib/farms";

export function FarmSwitcher({ farms, activeId, onSelect, onAdd, onEdit, onDelete }: { farms: Farm[]; activeId: string | null; onSelect: (id: string) => void; onAdd: () => void; onEdit: (f: Farm) => void; onDelete: (id: string) => void }) {
  const locale = useLocale();
  const text = messages[locale].common;
  const [confirm, setConfirm] = useState<string | null>(null);
  const active = farms.find(f => f.id === activeId) ?? farms[0];
  const area = active ? piecesAreaM2(active.pieces) : 0;
  return <nav className="farm-switcher" aria-label={text.myFarms}>
    <div className="farm-tabs"><div role="tablist" aria-label={text.chooseFarm} className="farm-tablist">
      {farms.map(f => <button key={f.id} role="tab" aria-selected={f.id === active?.id} className={f.id === active?.id ? "farm-tab on" : "farm-tab"} onClick={() => onSelect(f.id)}><Home aria-hidden="true" size={20} /> {f.name}</button>)}</div>
      <button type="button" className="farm-tab add" onClick={onAdd}><Plus aria-hidden="true" size={20} /> {text.addFarm}</button>
    </div>
    {active && <div className="farm-meta">
      <span>{active.placeName ? `${active.placeName}, ` : ""}{active.province} · {area ? areaLabel(area, locale) : text.unmapped}</span>
      <span className="farm-actions">
        <button type="button" className="farm-action-button" onClick={() => onEdit(active)}><Pencil size={16} aria-hidden="true" /> {text.edit}</button>
        {confirm === active.id
          ? <><button type="button" className="farm-action-button danger" onClick={() => { onDelete(active.id); setConfirm(null); }}>{text.confirmDelete}</button><button type="button" className="farm-action-button" onClick={() => setConfirm(null)}>{text.no}</button></>
          : <button type="button" className="farm-action-button" onClick={() => setConfirm(active.id)}><Trash2 size={16} aria-hidden="true" /> {text.delete}</button>}
      </span>
    </div>}
  </nav>;
}
