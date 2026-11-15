/* AI: Antigravity (Gemini), 2026-11-14 — accessible plain-language help popover/toggle for non-technical users. Frainer review pending. See AI_USAGE.md. */
"use client";

import { HelpCircle, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/client";
import { messages } from "@/lib/i18n/messages";
import { useId, useState } from "react";

export function HelpTip({ label, text }: { label: string; text: string }) {
  const textLabels = messages[useLocale()].helpTip;
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="help-tip-wrap">
      <button
        type="button"
        className={open ? "help-tip-btn is-open" : "help-tip-btn"}
        aria-expanded={open}
        aria-controls={id}
        aria-label={textLabels.whatFor.replace("{label}", label)}
        title={textLabels.whatFor.replace("{label}", label)}
        onClick={() => setOpen(v => !v)}
      >
        <HelpCircle size={17} aria-hidden="true" />
        <span>{textLabels.what}</span>
      </button>
      {open && (
        <span id={id} role="region" aria-label={`${textLabels.about} ${label}`} className="help-tip-box">
          <span className="help-tip-text">{text}</span>
          <button type="button" className="help-tip-close" aria-label={textLabels.close} onClick={() => setOpen(false)}>
            <X size={16} aria-hidden="true" />
          </button>
        </span>
      )}
    </span>
  );
}
