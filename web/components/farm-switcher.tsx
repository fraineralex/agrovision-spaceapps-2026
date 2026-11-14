/* AI: Claude (Anthropic), 2026-11-14 — switch, add, edit and delete saved farms. Frainer review pending. See AI_USAGE.md. */
"use client";
import { useState } from "react";
import { areaLabel, piecesAreaM2, type Farm } from "@/lib/farms";

export function FarmSwitcher({ farms, activeId, onSelect, onAdd, onEdit, onDelete }: { farms: Farm[]; activeId: string | null; onSelect: (id: string) => void; onAdd: () => void; onEdit: (f: Farm) => void; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const active = farms.find(f => f.id === activeId) ?? farms[0];
  const area = active ? piecesAreaM2(active.pieces) : 0;
  return <nav className="farm-switcher" aria-label="Mis fincas">
    <div className="farm-tabs" role="tablist">
      {farms.map(f => <button key={f.id} role="tab" aria-selected={f.id === active?.id} className={f.id === active?.id ? "farm-tab on" : "farm-tab"} onClick={() => onSelect(f.id)}>🏡 {f.name}</button>)}
      <button type="button" className="farm-tab add" onClick={onAdd}>＋ Agregar finca</button>
    </div>
    {active && <div className="farm-meta">
      <span>{active.province} · {area ? areaLabel(area) : "sin marcar en el mapa"}</span>
      <span className="farm-actions">
        <button type="button" className="ob-link" onClick={() => onEdit(active)}>Editar</button>
        {confirm === active.id
          ? <><button type="button" className="ob-link danger" onClick={() => { onDelete(active.id); setConfirm(null); }}>Sí, borrar</button><button type="button" className="ob-link" onClick={() => setConfirm(null)}>No</button></>
          : <button type="button" className="ob-link" onClick={() => setConfirm(active.id)}>Borrar</button>}
      </span>
    </div>}
  </nav>;
}
