/* AI: Claude (Anthropic), 2026-11-14 — always-open section panel with a heading and optional help tip. Frainer review pending. */
import { CloudRain, Coins, Map, MessageCircle, Sprout, Sun, Thermometer, Wallet, type LucideIcon, Leaf } from "lucide-react";
import { HelpTip } from "@/components/help-tip";

const icons: Record<string, LucideIcon> = { "🌱": Sprout, "🍂": Leaf, "🌧️": CloudRain, "💵": Wallet, "💰": Coins, "🗺️": Map, "☀️": Sun, "🌡️": Thermometer, "🎙️": MessageCircle };
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Kept the old name so callers stay simple; every section is expanded (farmer feedback, 14-11-2026). */
export function Fold({ icon, title, help, children, id }: { icon: string; title: string; teaser?: React.ReactNode; help?: string; children: React.ReactNode; onOpen?: () => void; id?: string }) {
  const Icon = icons[icon] ?? Map;
  const hid = `${id ?? slug(title)}-titulo`;
  return <section id={id ?? slug(title)} className="card panel" aria-labelledby={hid}>
    <div className="panel-head-row">
      <h2 id={hid} className="panel-title"><Icon aria-hidden="true" className="panel-icon" />{title}</h2>
      {help && <HelpTip label={title} text={help} />}
    </div>
    <div className="panel-body">{children}</div>
  </section>;
}
