/* AI: Antigravity (Gemini), 2026-11-15. Frainer review pending. See AI_USAGE.md. */
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Selecciona",
  ariaLabel,
  className,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function stepOption(delta: number) {
    const enabled = options.filter((opt) => !opt.disabled);
    if (!enabled.length) return;
    const idx = enabled.findIndex((opt) => opt.value === value);
    const nextIdx = idx < 0 ? 0 : (idx + delta + enabled.length) % enabled.length;
    onChange(enabled[nextIdx].value);
  }

  return (
    <div ref={wrapRef} className={className ? `ag-select ${className}` : "ag-select"} data-open={open ? "true" : "false"}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        className="ag-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) setOpen(true);
            else stepOption(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) setOpen(true);
            else stepOption(-1);
          }
        }}
      >
        <span className={selected ? "ag-select-value" : "ag-select-value is-placeholder"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className="ag-select-chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul className="ag-select-menu" role="listbox" aria-label={ariaLabel ?? placeholder}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={opt.disabled}
                  className={isSelected ? "ag-select-option is-selected" : "ag-select-option"}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={15} className="ag-select-check" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
