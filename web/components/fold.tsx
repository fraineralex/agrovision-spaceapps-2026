/* AI: Codex/OpenAI with Impeccable, 2026-11-15. Application composition and shared UI; Frainer review pending. See AI_USAGE.md. */
/* AI: Claude (Anthropic), 2026-11-14 — always-open section panel with a heading and optional help tip. Frainer review pending. */
import { CloudRain, Coins, Map, MessageCircle, Sprout, Sun, Thermometer, Wallet, type LucideIcon, Leaf, Bug } from "lucide-react";
import { SectionPanel } from "@/components/ui/section-panel";

const icons: Record<string, LucideIcon> = { "🌱": Sprout, "🍂": Leaf, "🐛": Bug, "🌧️": CloudRain, "💵": Wallet, "💰": Coins, "🗺️": Map, "☀️": Sun, "🌡️": Thermometer, "🎙️": MessageCircle };
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Kept the old name so callers stay simple; every section is expanded (farmer feedback, 14-11-2026). */
export function Fold({ icon, title, help, tools, children, id, className = "" }: { icon: string; title: string; teaser?: React.ReactNode; help?: string; tools?: React.ReactNode; children: React.ReactNode; onOpen?: () => void; id?: string; className?: string }) {
  const Icon = icons[icon] ?? Map;
  return <SectionPanel id={id ?? slug(title)} icon={Icon} title={title} help={help} tools={tools} className={className}>{children}</SectionPanel>;
}
