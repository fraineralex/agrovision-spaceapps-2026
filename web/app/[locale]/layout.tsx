/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { isLocale, localeTag } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import "../globals.css";
import "../planting.css";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export function generateStaticParams() { return [{ locale: "en" }, { locale: "es" }]; }
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { title: messages[locale].common.title, description: messages[locale].common.description, icons: { icon: "/icon.svg" } };
}
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0B120D", viewportFit: "cover" };
export default async function RootLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <html lang={localeTag(locale)} className={plusJakarta.variable} suppressHydrationWarning><head>
    <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('agrovision:theme')==='sun')document.documentElement.dataset.theme='sun'}catch{}" }} />
  </head><body>{children}</body></html>;
}
