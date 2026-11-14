/* AI: Codex (OpenAI), 2026-11-14. Frainer review pending; see AI_USAGE.md. */
import { pestCatalog, pestLimit, pestSources } from "@/lib/pests";

export function PestList({ pests }: { pests: readonly { name: string; taxon?: string; external?: boolean }[] }) {
  return <ul>{pests.map(pest => <li key={pest.taxon ?? pest.name}>
    {pest.name}{pest.taxon && <> (<i>{pest.taxon}</i>{!pest.taxon.includes(" ") && " spp."})</>}{pest.external && " †"}
  </li>)}</ul>;
}

export function PestCatalog() {
  return <details className="evidence-details">
    <summary>Plagas que conviene vigilar por cultivo</summary>
    <p>{pestLimit}</p>
    {Object.values(pestCatalog).sort((a, b) => a.name.localeCompare(b.name, "es")).map(entry => <details key={entry.name}>
      <summary>{entry.name}</summary>
      <PestList pests={entry.pests} />
      <ul>{entry.sources.map(id => {
        const [name, url] = pestSources[id];
        return <li key={id}><a href={url} target="_blank" rel="noreferrer">{name}</a></li>;
      })}</ul>
    </details>)}
  </details>;
}
