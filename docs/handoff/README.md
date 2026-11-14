# Handoff (2026-11-14, 12:40 PM AST)

`main` is in production on Vercel, which deploys every push to `main` automatically.

Work in progress. Each branch is a WIP checkpoint; its prompt is in this folder.

| Branch | Task | Prompt |
| --- | --- | --- |
| `wip/farmer-cards` | One recommendation per parcel; real data for clima, plagas and mercado | prompt_cards.txt |
| `feature/fao-giews` | FAO GIEWS: drought alert, historical risk, planting season | prompt_fao.txt |
| `feature/market-dominican-sources` | Price forecast, oversupply risk, margin per tarea, press cases for the pitch | prompt_market.txt |
| `feature/field-boundaries` | Farm boundaries in San Juan (SAM on Esri imagery) | prompt_fields.txt |

To continue:
1. `git checkout <branch>`.
2. Give the prompt to your agent, adding: "continue from the existing WIP commit".
3. Run `cd web && npm run lint && npm run build`.
4. `git pull --rebase origin main && git push origin HEAD:main`.

Rules (see AGENTS.md):
- Small Conventional Commits, in English.
- UI text in Spanish.
- Cite all AI use in AI_USAGE.md.
