/* AI assistance: Codex (OpenAI), 2026-11-14; typography & theme-color alignment by Antigravity (Gemini), 2026-11-15; i18n layout integration, 2026-11-15. */
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import { isLocale, localeTag } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import "../globals.css";
import "../planting.css";
import "../workspace.css";
import "../theme-dark.css";

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

export function generateStaticParams() { return [{ locale: "en" }, { locale: "es" }]; }
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { title: messages[locale].common.title, description: messages[locale].common.description, icons: { icon: "/icon.svg" } };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b120d", viewportFit: "cover" };

export default async function RootLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <html lang={localeTag(locale)} className={`${ibmPlex.variable} ${bricolage.variable}`} suppressHydrationWarning><head>
    <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('agrovision:theme')==='sun')document.documentElement.dataset.theme='sun'}catch{}" }} />
  </head><body>{children}</body></html>;
}
