/* AI: OpenAI GPT-6, 2026-11-15. Frainer review pending; see AI_USAGE.md. */
import { NextRequest, NextResponse } from "next/server";
import { browserLocale, isLocale, LOCALE_COOKIE } from "@/lib/i18n/locale";

export function proxy(request: NextRequest) {
  const preference = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(preference) ? preference : browserLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${url.pathname === "/" ? "" : url.pathname}`;
  const response = NextResponse.redirect(url);
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}
export const config = { matcher: ["/", "/fuentes"] };
