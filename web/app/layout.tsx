/* AI assistance: Codex (OpenAI), 2026-11-14; typography & theme-color alignment by Antigravity (Gemini), 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import "./planting.css";
import "./workspace.css";
import "./theme-dark.css";

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgroVision | República Dominicana",
  icons: { icon: "/icon.svg" },
  description: "Consulta la lluvia, organiza tu siembra y calcula el precio mínimo para cubrir tus gastos en el campo dominicano.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b120d", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-DO" className={`${ibmPlex.variable} ${bricolage.variable}`} suppressHydrationWarning><head>
    <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('agrovision:theme')==='sun')document.documentElement.dataset.theme='sun'}catch{}" }} />
  </head><body>{children}</body></html>;
}
