/* AI: Codex/OpenAI with Impeccable, 2026-11-15. Shared application section. Frainer review pending. */
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { HelpTip } from "@/components/help-tip";

export type SectionPanelProps = {
  id: string;
  title: string;
  icon: LucideIcon;
  help?: string;
  tools?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function SectionPanel({ id, title, icon: Icon, help, tools, className = "", children }: SectionPanelProps) {
  return <section id={id} className={`section-panel ${className}`} aria-labelledby={`${id}-title`}>
    <header className="section-panel-heading">
      <h2 id={`${id}-title`}><Icon aria-hidden="true" />{title}</h2>
      {tools}
      {help && <HelpTip label={title} text={help} />}
    </header>
    <div className="section-panel-content">{children}</div>
  </section>;
}
