# Asset and data notices

## License scope

The source code and project-created visual assets in this public Challenge repository are released under the MIT License in `LICENSE`.

The names and marks of OpenAI, Google, NARA/GO, Open-Meteo, transit operators, and other referenced services belong to their respective owners. Their names are used only to identify compatibility, inspiration categories, links, or data providers. No endorsement, employment relationship, or affiliation is claimed.

## Generated ambient images

The public image library contains project-requested ImageGen outputs whose generation prompts are recorded in `assets/backgrounds/PROMPTS.md`. People shown in the OpenAI- and Google-themed categories are fictional; the prompts specifically exclude real employees, logos, trademarks, and readable brand text.

Three earlier abstract images without a repository-local provenance record (`nara-dawn.webp`, `tidal-ink.webp`, and `glass-reeds.webp`) are intentionally excluded from this public snapshot. The public defaults use documented generated images instead.

## NARA/GO demonstration data

`web/nara-go/data/timetables.json` in this public repository contains an explicitly fictional, synthetic schedule. It exists only so the normal/simple interface and WebMCP navigation can be run locally. **Do not use it for travel.**

The live service can be opened separately at <https://tama-hub.xvps.jp/nara-go/>. Third-party timetable data is not copied into this public Git history.

## Runtime data

The Weather screen fetches current data through the included PHP proxy from Open-Meteo. Review Open-Meteo’s current terms and attribution requirements before operating a derivative service.
