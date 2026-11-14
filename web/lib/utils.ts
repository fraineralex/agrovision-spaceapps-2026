/* AI: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
