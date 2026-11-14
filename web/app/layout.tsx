/* AI assistance: Codex (OpenAI), 2026-11-14. Frainer review pending; see AI_USAGE.md. */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroVision | San Juan Valley",
  icons: { icon: "/icon.svg" },
  description: "Explore evidence and illustrative crop rotation scenarios for the San Juan Valley.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
