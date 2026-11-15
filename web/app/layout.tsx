/* AI assistance: Codex (OpenAI), 2026-11-14; typography update by Antigravity (Gemini), 2026-11-14. Frainer review pending; see AI_USAGE.md. */
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./planting.css";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "AgroVision | Dominican Republic",
  icons: { icon: "/icon.svg" },
  description: "Check rainfall, plan your planting, and calculate the minimum price needed to cover your farm costs in the Dominican Republic.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0B120D", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-US" className={plusJakarta.variable} suppressHydrationWarning><head>
    <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('agrovision:theme')==='sun')document.documentElement.dataset.theme='sun'}catch{}" }} />
  </head><body>{children}</body></html>;
}
