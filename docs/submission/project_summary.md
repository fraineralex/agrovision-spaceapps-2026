<!-- AI assistance: Codex (OpenAI), 2026-11-14. Frainer review: pending. -->
# AgroVision — project submission draft

Editorial status: pending Frainer review and final build verification. Field categories follow the [GO Team clarification](https://github.com/nasa/spaceapps/discussions/1858); exact portal labels and character limits are unverified. Use the [submission checklist](README.md) before pasting. Do not copy this editorial note into a public summary.

## Project title

AgroVision: Exploring Crop Rotations with NASA Data

## Selected challenge

[Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/)

## High-level project summary

AgroVision is a crop-rotation decision-support prototype for farmers and agricultural technicians in the Valle de San Juan, Dominican Republic. It brings NASA environmental evidence and local agricultural references into a comparison of the current rotation and illustrative alternatives across water and soil, climate, pests, and market conditions. The central AI task is image analysis: identifying bare-field periods and signals consistent with irrigation or rainfed conditions in Landsat imagery, subject to validation. Official wholesale prices provide a market reference with transparent gaps. The goal is to make trade-offs and missing evidence visible so farmers and technicians can discuss options together. AgroVision does not promise yields, predict pests or guarantee profit.

## Link to project demo

**PENDING — upload the final recorded demo or slides, then paste its publicly accessible URL.** See [video script](video_script.md) and [slides outline](slides_outline.md). The script and outline are production materials, not a finished demo link.

## Link to final project

Repository: [AgroVision source](https://github.com/fraineralex/agrovision-spaceapps-2026). Anonymous access and the final merged branch are pending verification. The market/submission work is prepared on `feature/submission-and-market` until integration.

Live application: **PENDING — insert the tested deployment URL.** Do not infer a URL from a project name.

## Detailed project description

### The decision we support

A rotation must make sense across several constraints at once. AgroVision focuses on one pilot area, the Valle de San Juan, and one discussion: how does the current crop sequence compare with two or three alternatives under the user's priorities? Every alternative is illustrative and requires local agronomic review. The baseline itself must be confirmed with the farmer or a local technician; a documented regional example is not proof of an individual farm's practice.

### How the prototype is designed to work

The user selects an approximate demonstration parcel, indicates the previous crop and known irrigation conditions, and compares scenarios across four pillars. Water and soil considerations combine environmental context with documented crop requirements. Climate evidence describes historical conditions, rather than forecasting yield. Pest considerations use sourced crop-rotation rules, rather than predicting outbreaks. The market pillar summarizes official wholesale prices and reports where a comparable seasonal index cannot be calculated.

NASA data have defined roles: POWER provides regional meteorological context; IMERG is the intended rainfall source; Landsat/HLS supports vegetation time series and the central classification task; terrain data can add slope context after ingestion. The final submitted build must identify the products actually included and their periods. Coarse environmental grids are not farm measurements, and a satellite irrigation signal is not verified irrigation infrastructure. See [NASA data and implementation status](nasa_data_used.md).

The image-analysis design identifies bare-field periods and signals compatible with irrigation or rainfed conditions. Classification results must display their sensor, period, method, confidence and validation status. No accuracy result or field validation is claimed in this draft. If labels are insufficient, any displayed classification must be described as preliminary or deferred. An optional language model may explain already calculated metrics; it is secondary to data analysis.

The updated main branch implements Next.js, React and TypeScript, Python data preparation and local JSON artifacts; its documented checks cover the offline comparison. This market task did not rerun the application suite. The app's offline path must use cached data. Availability of the final interface, classifier and optional explanation service must be checked against the frozen build before submission.

### What this branch demonstrably delivers

The market pipeline downloads the Ministry of Agriculture's original wholesale CSV covering August 2017–October 2026 and reproduces the export without network access. It selects red beans, maize, pigeon peas, sweet potatoes and rice, retaining the published names, forms, grades, units and source rows. The artifact includes 4,037 observations and 926 monthly summaries. Seven comparable series meet the conservative seasonal coverage rule; pigeon-pea prices are present, but their seasonal indices remain missing. These are dataset-processing counts from `data/derived/market_prices.json`, generated from the November 14, 2026 snapshot, not agricultural impact metrics.

An ordinal week is retained as published; no exact observation day is invented. Zero and blank prices are missing. Explicit sack weights can be normalized, while quintal prices retain the original unit. Conflicting duplicate weeks are excluded from summaries. Seasonal ratios use complete comparable years and remain preliminary. The source describes Santo Domingo wholesale markets; the CSV does not identify an individual market, and these are not prices paid to farmers in San Juan. Integration of this artifact into the application is pending in this branch. See [reproduction and methodology](../../scripts/market/README.md).

A local POWER cache is also present in the repository, with daily temperature, corrected precipitation and relative humidity for a regional query point over 2016–2025. Main now documents integration of this regional context, 18 Landsat point responses from six 2024 scenes, cached GIBS imagery, a FAO-56 Kc·day proxy, and optional evidence selection through Gateway with OpenAI `openai/gpt-4.1-mini`. Landsat signals use exploratory thresholds; there is no trained model, irrigation inference or measured classifier accuracy. See the updated data-source record and main methodology; no farm-level accuracy is established.

### Farmer app features in `main` (14 Nov 2026)

- **Onboarding and farms:**
  - The farmer marks the farm on a satellite map. They can tap 50 m grid cells, approximate satellite parcels (SAM or Sentinel-2 units), drag a box over several cells, or draw a polygon.
  - The area is shown in tareas and hectares (1 tarea = 628.86 m²).
  - Farms are named and saved on the phone only, and each has its own recommendation. A switcher at the top lets the farmer add, edit or delete farms.
  - Outlines are labelled "Parcelas aproximadas detectadas por satélite, no catastrales".
- **Advisor:** compares 22 common Dominican crops on water (FAO-56), drought (FAO GIEWS), a cited IDIAF pest rule and wholesale price at harvest (Ministry of Agriculture). It explains each point in a "¿De dónde sale esto?" panel.
- **Oversupply warning:** shown when national sowing over the last 12 months is at least 15% above the previous years (Ministry sowing data), or when the harvest month historically has low prices. Provincial sowing data is not published, so the warning says "en el país".
- **7-day rain alert per farm:** Open-Meteo forecast, with recent NASA POWER days as a fallback. It gives a plain sentence such as "No riegues el jueves: viene lluvia".
- **"¿Cuánto me deja?":**
  - Gives a low/medium/high range per crop and number of tareas.
  - Costs come from the Ministry's 2019 production costs, scaled by the Banco Central CPI (January 2026 = 137.74, base Oct 2019–Sep 2020 = 100).
  - Uses the Ministry's yields and the lowest, latest and highest wholesale price of the last 12 months.
  - Wholesale is not the farm-gate price, and this is stated in the app.
- **Sharing by WhatsApp:** the farm card is shared as an image through the Web Share API, with a text fallback via `wa.me`.
- **Voice assistant:** realtime and conversational. It knows the farm, rain alert, profit range and oversupply warning, and never invents numbers.

### Benefits, limitations and next steps

The intended benefit is a more informed conversation about rotation trade-offs. No water saving, income gain, pest reduction or yield improvement has been measured in farms. Next steps are to confirm baseline rotations locally, review crop and pest references, validate image labels by spatially independent samples, verify market licensing and data anomalies, and test the frozen comparison interface with a technician. Expansion to other areas requires local evidence and calibration. Sensors are a future extension outside this demo.

### Work completed during the hackathon

This branch's November 14 contribution is the reproducible official-price pipeline, cached export, validation checks and submission drafts. **PENDING — add other team members' verified hackathon contributions, final commit/build identifier and actual integration results.** Distinguish prior research and team context from work completed during the event; do not attribute all repository history to this weekend.

## NASA data resources

Use the verified-local-data section of [nasa_data_used.md](nasa_data_used.md). Before submission, confirm at least one actually used dataset appears in Field Shift's Resources tab. Do not list planned datasets as already consumed.

## Space agency and other data resources / references

Use [nasa_data_used.md](nasa_data_used.md), retaining agency attribution and implementation status. The Ministry of Agriculture is the source of market observations; Codex assisted the pipeline, not the original price collection. The price artifact records the download URL, snapshot checksum, periods, units and quality limitations.

## Use of AI / SI tools

Use [ai_disclosure.md](ai_disclosure.md). Codex/OpenAI assistance is recorded. Main configures OpenAI `openai/gpt-4.1-mini` through Vercel AI Gateway; actual invocation history and Grok contribution details remain to be confirmed. Prior Claude assistance is retained from the team's existing log. Frainer review of this contribution remains pending.

## Terms and conditions / team details

**PENDING — a registered team member must read and accept the active terms in the portal, confirm the team's registered members and Local Event, and submit.** This file does not record consent or a successful submission.
