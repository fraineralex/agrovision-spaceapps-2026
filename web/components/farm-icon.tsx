/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. Original code-native icons. */
import type { CSSProperties } from "react";
export function FarmIcon({ name, size = 32, style }: { name: string; size?: number; style?: CSSProperties }) {
  const paths: Record<string, React.ReactNode> = {
    water: <><path d="M12 2S5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2Z"/><path d="M8 15a4 4 0 0 0 4 4"/></>,
    soil: <><path d="M3 18h18M3 22h18M12 18V8M12 12C3 12 3 3 3 3s9 0 9 9ZM12 9c0-7 9-7 9-7s0 9-9 9"/></>,
    climate: <><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>,
    pests: <><path d="m12 2 8 4v7c0 5-8 9-8 9S4 18 4 13V6l8-4Z"/><path d="M9 9h6v6H9zm3-3v3m0 6v3m-6-7h3m6 0h3"/></>,
    market: <><path d="M3 9h18l-2-6H5L3 9Zm1 0v12h16V9M8 21v-7h8v7M2 9c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0"/></>,
    rice: <><path d="M8 22 16 2M11 14c-6 0-7-5-7-5s7 0 7 5Zm2-5c-5 0-5-5-5-5s5 0 5 5Zm-4 9c6 2 10-3 10-3s-7-2-10 3Zm5-8c6 1 8-4 8-4s-6-1-8 4Z"/></>,
    maize: <><path d="M7 15V8a5 5 0 0 1 10 0v7M12 4v14M8 8h8M8 12h8M12 22C2 21 2 12 2 12s9 0 10 10Zm0 0c10-1 10-10 10-10s-9 0-10 10Z"/></>,
    beans: <><path d="M17 3c-6-4-8 3-8 5s-1 3-4 5c-5 5 0 12 6 8 7-4 13-13 6-18Z"/><path d="M14 7c2 4-2 8-5 10"/></>,
    "sweet-potato": <><path d="M5 9c5-6 16-8 16-2s-8 15-14 14S0 15 5 9Zm1 10-4 3M18 5l3-3M9 10l2 1m2 3 2 1"/></>,
    mic: <><rect x="8" y="2" width="8" height="13" rx="4"/><path d="M4 10v2a8 8 0 0 0 16 0v-2M12 20v3M8 23h8"/></>,
    sound: <><path d="m3 9 5 0 5-5v16l-5-5H3V9Zm14-3c5 3 5 9 0 12m-1-9c2 1 2 5 0 6"/></>,
    stop: <rect x="5" y="5" width="14" height="14" rx="2"/>,
    field: <><path d="M2 20 9 3h9l4 17H2ZM6 12h14M4 16h17M9 3l3 17M15 3l3 17"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name] ?? paths.soil}</svg>;
}
