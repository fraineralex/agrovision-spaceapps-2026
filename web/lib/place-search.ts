/* AI: Codex (OpenAI), 2026-11-14. Frainer review pending. */
import { useEffect, useState } from "react";
import { provinceAt, provinces, type Location } from "./geography";

type Row = [number, string, number, number, string, string];
type Place = Location & { id: string | number; name: string; province: string; kind?: string };
const normalize = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const kinds: Record<string, string> = { ADM2: "Municipio", ADM3: "Distrito o zona", ADM4: "Sección", ADM5: "Barrio o paraje", PPLX: "Sector" };
const priority: Record<string, number> = { ADM2: 0, ADM3: 1, ADM4: 2, ADM5: 3 };
let catalog: Promise<Row[]> | undefined;

export function usePlaceSearch(query: string, limit: number) {
  const term = normalize(query);
  const [rows, setRows] = useState<Row[]>();
  const [unavailable, setUnavailable] = useState(false);
  const shouldLoad = term.length >= 2;
  useEffect(() => {
    if (!shouldLoad || rows) return;
    let ignore = false;
    catalog ??= fetch("/data/places-do.json").then(response => {
      if (!response.ok) throw new Error("Place catalog unavailable");
      return response.json() as Promise<Row[]>;
    }).catch(error => { catalog = undefined; throw error; });
    void catalog.then(result => { if (!ignore) { setRows(result); setUnavailable(false); } }, () => { if (!ignore) setUnavailable(true); });
    return () => { ignore = true; };
  }, [shouldLoad, rows, term]);

  const matches: { place: Place; score: number }[] = [];
  if (!shouldLoad) return { places: [], loading: false, unavailable: false };
  const score = (name: string) => name === term ? 0 : name.startsWith(term) ? 10 : 20;
  for (const province of provinces) {
    const name = normalize(province.name);
    if (name.includes(term)) matches.push({ place: { ...province, id: province.name, province: province.name }, score: score(name) });
  }
  const candidates = (rows ?? []).flatMap(([id, name, longitude, latitude, code]) => {
    const key = normalize(name);
    return key.includes(term) ? [{ id, name, longitude, latitude, code, score: score(key) + 1 + (priority[code] ?? 4) }] : [];
  }).sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "es"));
  for (const { score, code, ...point } of candidates.slice(0, limit * 3)) {
    const province = provinceAt(point);
    if (province) matches.push({ place: { ...point, province, kind: kinds[code] ?? "Localidad" }, score });
  }
  return { places: matches.sort((a, b) => a.score - b.score).slice(0, limit).map(entry => entry.place), loading: !rows && !unavailable, unavailable };
}
