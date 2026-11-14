<!-- AI assistance: Codex (OpenAI), 2026-11-14. Frainer review: pending. -->
# Submission pack — AgroVision

Prepared on November 14, 2026 for **Field Shift: Adapting Farms with NASA Data**, Santo Domingo. These are editable submission drafts, not evidence of submission or of completed application integration. Frainer must review scientific claims, licenses, AI attribution and the final recording.

| Artifact | Purpose |
|---|---|
| [Project summary](project_summary.md) | Text mapped to submission fields; unresolved URLs visibly marked |
| [Video script](video_script.md) | Scene-by-scene 29-second production target |
| [Slides outline](slides_outline.md) | Seven-slide alternative, including title and credits |
| [NASA data used](nasa_data_used.md) | Verified local evidence separated from planned datasets |
| [AI disclosure](ai_disclosure.md) | Tools, roles, evidence and unresolved model details |
| [Award alignment](award_alignment.md) | Evidence to show for judging, without invented weights |

## Rule verification log

Sources checked November 14, 2026:

- [2026 event page](https://www.spaceappschallenge.org/2026/): submission November 14, 09:00 through November 15, 23:59 local time. [GO Team answer #1916](https://github.com/nasa/spaceapps/discussions/1916): use the Project tab; timezone follows the Team Owner's Local Event. Confirm that the team is assigned to Santo Domingo/AST (UTC−04:00), rather than relying on the computer timezone.
- [GO Team answer #1858](https://github.com/nasa/spaceapps/discussions/1858), Chris-GO-Team, November 9: confirms project title, summary, demo link, final project link, detailed description, NASA and other agency resources, AI/SI tools and terms acceptance. This is an organizer clarification to another challenge; exact Field Shift portal labels, mandatory flags and character limits still require inspection.
- [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/): retrieval failed (web fetch HTTP 502; direct request TLS certificate verification failure). No recovered 2026 guide/PDF in this pack. Do not claim its duration or character limits have been verified.
- [Discussion #1973](https://github.com/nasa/spaceapps/discussions/1973) and [#1991](https://github.com/nasa/spaceapps/discussions/1991) describe 30-second video / seven slides, but the cited answers were not verified as GO Team guidance. They support a conservative working format, not a confirmed global rule. The [2022 guide](https://spaceapps-prod.s3.amazonaws.com/media/documents/Space_Apps_2022_Project_Submission_Guide.pdf) is historical only. This pack targets **29 seconds and seven slides** pending the active portal's instruction.
- [GO Team answer #1849](https://github.com/nasa/spaceapps/discussions/1849), Nick-GO-Team, November 6: at least one NASA dataset from the selected challenge's resources for global awards; AI use must be disclosed. AI-generated visuals need a visible watermark, audio acknowledgment in descriptive text/metadata, and code/data acknowledgment in descriptive text/metadata. Do not use AI to generate or alter NASA branding. Confirm applicability against the current guide and Field Shift resource list.
- [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/): unavailable in this check. Award descriptions in this repository reference [2025 awards](https://www.spaceappschallenge.org/2025/awards/); 2026 names, weights and local nomination counts remain unverified.
- [2026 terms](https://www.spaceappschallenge.org/legal/): retain sources, license checks and permissions for any third-party material; the repository's [rules](../00_reglas_envio_y_evaluacion.md) record the earlier terms review. This session recovered the indexed 2026 terms but could not retrieve the live page directly.

## Before submitting

- [ ] Open the team's active form; record labels, character limits, demo duration/slide limit and timezone here. Shorten drafts if required.
- [ ] Review the selected challenge's Resources tab and identify at least one listed NASA dataset actually used in the submitted build.
- [ ] Replace pending demo/deployment/team URLs. Test final links without sign-in or access requests. Public repository URL is known; anonymous accessibility has not been verified here.
- [ ] Update implementation claims from the frozen build, including classifier validation status, actual model IDs and NASA product versions/granules/periods.
- [ ] Review market exclusions and redistribution license. Do not present missing seasonal indices as neutral scores.
- [ ] Record video duration including credits and fades. Use only owned/licensed visuals and permitted identifiable adults; avoid private producer data.
- [ ] Frainer signs off on text, data and AI disclosures. Record actual review in `AI_USAGE.md`; pending is not approval.
- [ ] Submit in the portal before its displayed cutoff; save confirmation. Internal freeze is November 15, 18:00 AST, not the official deadline.

## Base update during preparation

The branch was reconciled with main commit `9ac7972` after the initial drafts. Main adds documented POWER/Landsat/GIBS/FAO demo artifacts and an optional Gateway endpoint configured for OpenAI `openai/gpt-4.1-mini`. The data and AI disclosures reflect this evidence. No `web/` or `scripts/ml/` files were edited by this contribution; the market export is still not wired into the app. Main’s existing UI tests are reported by its contributor, not rerun by this task.
