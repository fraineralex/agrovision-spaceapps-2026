/* AI: Codex/OpenAI, 2026-11-14; expanded unified geometric icon set by Antigravity (Gemini), 2026-11-14. Frainer review pending. See AI_USAGE.md. */
import type { CSSProperties } from "react";

const cropAlias: Record<string, string> = {
  habichuela_roja: "beans",
  habichuela_negra: "beans",
  maiz: "maize",
  arroz: "rice",
  batata: "sweet-potato",
};

export function FarmIcon({
  name,
  size = 24,
  className,
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const key = cropAlias[name] ?? name;
  const paths: Record<string, React.ReactNode> = {
    // Pillars & core domain
    water: (
      <>
        <path d="M12 2.5S5.5 10 5.5 14.8a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z" />
        <path d="M9 15a3.5 3.5 0 0 0 3.5 3.2" />
      </>
    ),
    soil: (
      <>
        <path d="M3 19h18M5 22h14M12 19V9" />
        <path d="M12 12.5C5.5 12.5 5 5.5 5 5.5s6.5 0 7 7Z" />
        <path d="M12 10.5c0-6.5 7-6.5 7-6.5s0 6.5-7 6.5Z" />
      </>
    ),
    climate: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.5m0 15V22M2 12h2.5m15 0H22M4.9 4.9l1.8 1.8m10.6 10.6 1.8 1.8M4.9 19.1l1.8-1.8m10.6-10.6 1.8-1.8" />
      </>
    ),
    pests: (
      <>
        <path d="m12 2.5 7.5 3.5v6c0 4.8-7.5 9.2-7.5 9.2S4.5 16.8 4.5 12V6L12 2.5Z" />
        <ellipse cx="12" cy="12" rx="2.5" ry="3.2" />
        <path d="M9.5 10.5 7.5 9m7 1.5 2-1.5m-7 4-2 1.2m7-1.2 2 1.2M12 8.8V7" />
      </>
    ),
    market: (
      <>
        <path d="M3.5 9.5h17l-1.5-5H5l-1.5 5Z" />
        <path d="M5 9.5v10.5h14V9.5M9.5 20v-6h5v6" />
        <path d="M3.5 9.5a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.8 0 2.8 2.8 0 0 0 5.6 0" />
      </>
    ),

    // Weather & rain forecast
    "rain-heavy": (
      <>
        <path d="M6.5 15.5a4 4 0 0 1-.4-7.9A5.5 5.5 0 0 1 16.8 6a4 4 0 0 1 .7 7.9" />
        <path d="m8.5 17.5-1 3m4.5-3-1 3m4.5-3-1 3" />
      </>
    ),
    "rain-light": (
      <>
        <path d="M6.5 15.5a4 4 0 0 1-.4-7.9A5.5 5.5 0 0 1 16.8 6a4 4 0 0 1 .7 7.9" />
        <path d="m10 18-1 2.5m5-2.5-1 2.5" />
      </>
    ),
    heat: (
      <>
        <path d="M12 3a3 3 0 0 0-3 3v7.2a4.5 4.5 0 1 0 6 0V6a3 3 0 0 0-3-3Z" />
        <circle cx="12" cy="16.5" r="1.5" />
        <path d="M12 15v-5" />
      </>
    ),
    drought: (
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M12 2v1.5M5.5 8.5H4m16 0h-1.5M7.3 4l1 1m7.4-1-1 1" />
        <path d="M3 18.5c3-1.5 6 1.5 9 0s6 1.5 9 0M4 21.5h16" />
      </>
    ),

    // Crops (all 22 crops in cohesive geometric linework)
    rice: (
      <>
        <path d="M7.5 21.5 16.5 2.5" />
        <path d="M11.5 13.5c-5 0-6-4-6-4s5.5-.5 6 4Z" />
        <path d="M13.5 9c-4.5 0-5-4-5-4s5-.5 5 4Z" />
        <path d="M9.5 17.5c5.5 1.5 8.5-2.5 8.5-2.5s-6-1.5-8.5 2.5Z" />
        <path d="M14 11.5c5 .8 7-3 7-3s-5-.8-7 3Z" />
      </>
    ),
    maize: (
      <>
        <path d="M8.5 15V8a3.5 3.5 0 0 1 7 0v7" />
        <path d="M12 4.5v13M9 8.5h6M9 12h6" />
        <path d="M12 21.5C4 20.5 4 12.5 4 12.5s7.5 0 8 9Z" />
        <path d="M12 21.5c8-1 8-9 8-9s-7.5 0-8 9Z" />
      </>
    ),
    beans: (
      <>
        <path d="M16.5 3.5c-4.5-2.5-7 2-7.5 4.8-.5 2.2-1.2 3.2-3.5 4.8-4 3.5-.5 9.8 4.8 7 6.2-3.3 10.7-11.8 6.2-16.6Z" />
        <path d="M13.5 7.5c1.5 3.5-1.5 6.8-4.5 8.5" />
      </>
    ),
    "sweet-potato": (
      <>
        <path d="M5.5 10c4.5-5 14-6.5 14-1.5s-6.8 12.5-12 11.8S1.5 14.5 5.5 10Z" />
        <path d="m6 18.5-3 3m15-16 3-2.5M9.5 10.5l1.8.8m1.7 2.7 1.8.8" />
      </>
    ),
    yuca: (
      <>
        <path d="M12 3.5v8M12 8.5l-5-2.5m5 2.5 5-2.5" />
        <path d="M12 11.5c-1.5 3-5.5 5.5-5.5 7.5 0 1.5 2.5 2.2 4 1 1-.8 1.5-3.2 1.5-8.5Z" />
        <path d="M12 11.5c1.5 3 5.5 5.5 5.5 7.5 0 1.5-2.5 2.2-4 1-1-.8-1.5-3.2-1.5-8.5Z" />
      </>
    ),
    platano: (
      <>
        <path d="M6 17c4 2.8 11.5.5 13.5-8.5.4-1.8-.3-3.5-1.5-4.5-.5 4.5-4.5 10.5-12 11-.8.2-1 .9 0 2Z" />
        <path d="M17.5 4c.8-.8 1.5-1.2 2.5-1" />
      </>
    ),
    guineo: (
      <>
        <path d="M5.5 16.5c4 2.5 10.5 0 12.5-8 .3-1.5-.2-3-1.2-4-.5 4-4 9.5-10.5 10.2-.8.2-1 .8-.8 1.8Z" />
        <path d="M9 19c3.5 1.2 8-.5 10-5.5" />
      </>
    ),
    mani: (
      <>
        <path d="M8.5 15.5c-2-1.5-3-4-1.5-6.2 1.3-2 3.8-1.8 5-.5 1.2-1.3 3.7-1.5 5 .5 1.5 2.2.5 4.7-1.5 6.2-1.5 1.1-2.5 3.8-3.5 3.8s-2-2.7-3.5-3.8Z" />
        <path d="M10.5 11.5h3m-2 3h1" />
      </>
    ),
    tomate: (
      <>
        <circle cx="12" cy="13.5" r="7" />
        <path d="M12 6.5V3.5M9 7.5l3-1 3 1m-4.5 1 1.5-2 1.5 2" />
      </>
    ),
    cebolla: (
      <>
        <path d="M12 6.5c-4.5 2-6.5 5.5-6.5 8.5a6.5 6.5 0 0 0 13 0c0-3-2-6.5-6.5-8.5Z" />
        <path d="M12 6.5V3m-1.5 1L12 6.5 13.5 4M12 21.5v-1" />
      </>
    ),
    aji: (
      <>
        <path d="M12 6.5c-4 0-5.5 2.5-5.5 6 0 4.5 2 8 5.5 8s5.5-3.5 5.5-8c0-3.5-1.5-6-5.5-6Z" />
        <path d="M12 6.5V3.5c0-.5.8-1 2-1" />
        <path d="M9.5 10.5c0 3 .5 5.5 1.5 7.5" />
      </>
    ),
    auyama: (
      <>
        <ellipse cx="12" cy="13.5" rx="8" ry="6.5" />
        <ellipse cx="12" cy="13.5" rx="3.5" ry="6.5" />
        <path d="M12 7V4c0-.8.8-1.5 2-1.5" />
      </>
    ),
    papa: (
      <>
        <path d="M7.5 7.5C11 4.5 18 5.5 19.5 10s-2 9-7.5 9.5S4 15.5 4.5 11.5c.3-1.8 1.5-2.8 3-4Z" />
        <circle cx="9.5" cy="11" r=".7" />
        <circle cx="14.5" cy="12" r=".7" />
        <circle cx="11.5" cy="15" r=".7" />
      </>
    ),
    pepino: (
      <>
        <path d="M16.5 4.5c2.2 1.8 1.8 6-2 10.2s-8 7-10.2 5.2-1.8-6 2-10.2 8-7 10.2-5.2Z" />
        <path d="m17 4.5 2-1.5M9.5 11.5l1 1m2.5-3.5 1 1m-6.5 5 1 1" />
      </>
    ),
    berenjena: (
      <>
        <path d="M14 7.5c2.5 1.5 4.5 5 3.5 9-.8 3.2-3.5 5-6.5 4.5-3.5-.6-5.5-4-4-7.5 1.2-2.8 3.5-5 7-6Z" />
        <path d="M12 8.5 14 5l3 2.5m-3-2.5.5-2.5" />
      </>
    ),
    repollo: (
      <>
        <circle cx="12" cy="13" r="7.5" />
        <path d="M7.5 10.5c2.5-1.5 6.5-1 8.5 2.5m-7 5.5c2.5 0 5-2 5.5-5" />
      </>
    ),
    zanahoria: (
      <>
        <path d="M15 6.5c2 2 1.5 4.5-.5 7.5L8 20.5c-.8.8-2 .2-1.5-.8l3.2-9c1.2-3 3.3-5.2 5.3-4.2Z" />
        <path d="M15 6.5 18 3m-3 3.5L15 3m0 3.5 4.5-.5" />
      </>
    ),
    pina: (
      <>
        <ellipse cx="12" cy="14.5" rx="5.5" ry="6.5" />
        <path d="M12 8 9 3.5m3 4.5V2.5M12 8l3-4.5" />
        <path d="m8.5 12.5 7 4m-7 0 7-4" />
      </>
    ),
    cafe: (
      <>
        <ellipse cx="12" cy="12" rx="6" ry="8" transform="rotate(-18 12 12)" />
        <path d="M10.5 5c1.5 4.5 0 9 3 14" />
      </>
    ),
    cacao: (
      <>
        <path d="M12 3.5c4.5 1.5 6.5 5.5 5.5 10-.8 3.5-3 6-5.5 7-2.5-1-4.7-3.5-5.5-7-1-4.5 1-8.5 5.5-10Z" />
        <path d="M12 3.5v17M9 7.5c1.5 4 1.5 7 0 11m6-11c-1.5 4-1.5 7 0 11" />
      </>
    ),
    aguacate: (
      <>
        <path d="M12 3.5c2.5 0 4 3 5 6.5 1 3.5.5 9.5-5 10.5s-6-7-5-10.5c1-3.5 2.5-6.5 5-6.5Z" />
        <circle cx="12" cy="14.5" r="2.8" />
      </>
    ),

    // UI & Action Icons
    field: (
      <>
        <path d="M3 19.5 8.5 4.5h9l3.5 15H3Z" />
        <path d="M6.5 12h12.5M4.8 16h15.2M10 4.5l2 15M15 4.5l2 15" />
      </>
    ),
    map: (
      <>
        <path d="m3.5 6.5 5.5-2.5 6 2.5 5.5-2.5v13.5l-5.5 2.5-6-2.5-5.5 2.5V6.5Z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s6-5.5 6-10.5a6 6 0 1 0-12 0C6 15.5 12 21 12 21Z" />
        <circle cx="12" cy="10.5" r="2" />
      </>
    ),
    gps: (
      <>
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
        <path d="M12 2.5v3m0 13v3M2.5 12h3m13 0h3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      </>
    ),
    calculator: (
      <>
        <rect x="4.5" y="3" width="15" height="18" rx="2.5" />
        <path d="M8 7h8M8 11.5h1.5M11.5 11.5h1M15 11.5h1M8 15h1.5M11.5 15h1M15 15v3M8 18h4.5" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19.5h16M7 16v-4m5 4V8m5 8v-6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    share: (
      <>
        <path d="M12 15V4.5m0 0-4 4m4-4 4 4" />
        <path d="M5 14v4.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V14" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5Z" />
        <path d="M9.5 9.5c.3 2 2.8 4.5 5 5l1.2-1.2 1.8.8c-.2 1.1-1.3 1.9-2.5 1.9-3.2 0-6.5-3.3-6.5-6.5 0-1.2.8-2.3 1.9-2.5l.8 1.8-1.7.7Z" />
      </>
    ),
    mic: (
      <>
        <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" />
        <path d="M5 10.5V12a7 7 0 0 0 14 0v-1.5M12 19v3M8.5 22h7" />
      </>
    ),
    sound: (
      <>
        <path d="M4 9.5h4l5-4.5v14l-5-4.5H4v-5Z" />
        <path d="M16.5 8.5a5 5 0 0 1 0 7m2.5-9.5a8.5 8.5 0 0 1 0 12" />
      </>
    ),
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    warning: (
      <>
        <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
        <path d="M12 10v4m0 3h.01" />
      </>
    ),
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    tap: (
      <>
        <path d="M10 11V5.5a1.5 1.5 0 0 1 3 0V11l4.2 1.2a2 2 0 0 1 1.4 2.2l-.7 4.6a2 2 0 0 1-2 1.7H9.5a2 2 0 0 1-1.7-1L5.2 15a1.5 1.5 0 0 1 2.2-1.8L10 15" />
      </>
    ),
    box: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 2" />
      </>
    ),
    draw: (
      <>
        <path d="m4 20 4.5-1 10-10a2 2 0 0 0-2.8-2.8l-10 10L4 20Z" />
        <path d="m13.5 7.5 3 3" />
      </>
    ),
    undo: (
      <>
        <path d="M8 7 4 11l4 4" />
        <path d="M4 11h10a5 5 0 0 1 0 10h-2" />
      </>
    ),
    document: (
      <>
        <path d="M6.5 3.5h8l4 4v13h-12v-17Z" />
        <path d="M14.5 3.5v4h4M9.5 11.5h5M9.5 15.5h5" />
      </>
    ),
    history: (
      <>
        <path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.5" />
        <path d="M4 4v4.5h4.5M12 7.5V12l3 2" />
      </>
    ),
    satellite: (
      <>
        <path d="m13.5 6.5 4 4m-9 1 4 4m-5-8 2-2 6 6-2 2-6-6Z" />
        <path d="m4 14 4-4m6 6-4 4M5.5 18.5a4 4 0 0 1 0-5.7" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="2" />
        <circle cx="15" cy="17" r="2" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ flexShrink: 0, ...style }}
    >
      {paths[key] ?? paths.soil}
    </svg>
  );
}
