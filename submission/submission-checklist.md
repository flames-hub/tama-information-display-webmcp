# WebMCP Challenge submission checklist

Final verification against the official OpenAI Challenge page, Devpost Official Rules, and Challenge FAQ on **2026-09-03 JST**.

Deadline: **2026-09-03 13:00 PDT / 20:00 UTC / 2026-09-04 05:00 JST**
Judging ends: **2026-09-21 17:00 PT**

| Requirement | Required | Ready | Needs human action | Evidence / URL |
| --- | --- | --- | --- | --- |
| Eligible entrant and no disqualifying conflict | Yes | Not machine-verifiable | Yes — entrant confirms in Devpost | [Official Rules §3](https://webmcp.devpost.com/rules) |
| Joined the challenge on Devpost | Yes | Yes — project draft reached finalization | No | [Challenge page](https://webmcp.devpost.com/) |
| Working WebMCP-powered web app | Yes | Yes — production verified | No | [Live app](https://tama-hub.xvps.jp/tama-info/), `js/webmcp-adapter-v0.4.js` |
| Working live URL | Yes | Yes — HTTP 200 | No | <https://tama-hub.xvps.jp/tama-info/> |
| ChatGPT in-app browser or WebMCP-enabled Chrome 149+ access | Yes | Yes — ChatGPT in-app browser verified | No | Native browser report: `AVAILABLE / 7/7` |
| Free, unrestricted judging access | Yes | Yes — no app login or API key | No | Live URL above |
| `document.modelContext.registerTool(...)` implementation | Yes | Yes — 7 tools | No | [WebMCP adapter](https://github.com/flames-hub/tama-information-display-webmcp/blob/main/js/webmcp-adapter-v0.4.js) |
| Tool call visibly changes the real app UI | Yes for claimed functionality | Yes — Weather, Web, Information, Ambient | No | Public in-app-browser verification; demo metadata |
| Normal UI works without WebMCP | Compatibility expectation | Yes — feature detection and failure isolation tested | No | `tests/webmcp-adapter.test.mjs` |
| Public source repository | Yes | Yes — Public | No | <https://github.com/flames-hub/tama-information-display-webmcp> |
| Source, assets, setup instructions | Yes | Yes | No | `README.md`, source tree |
| Detectable open-source license | Yes | Yes — GitHub detects MIT | No | [LICENSE](https://github.com/flames-hub/tama-information-display-webmcp/blob/main/LICENSE) |
| Challenge-period work distinguished | Required for pre-existing projects | Yes — clean dated commits and docs | No | [Commit history](https://github.com/flames-hub/tama-information-display-webmcp/commits/main/), `CHANGELOG.md` |
| Secrets / credentials absent | Yes | Yes — reachable-history and tracked-file scan passed | No | Clean five-commit Challenge history |
| English description covers fit, UX, collaboration, implementation | Yes | Yes | No | `submission/devpost-submission-en.md` |
| Demo video under 3 minutes | Yes | Yes — **2:18.02** | No | Local deliverable `submission/challenge-demo-final.mp4`; SHA-256 `D08E86E3…02069` |
| Video clearly shows the project functioning | Yes | Yes — 4 typed requests and 5 successful real tool calls | No | Weather → NARA/GO → 13:00 meeting → Ambient |
| Video audio explains project and WebMCP | Yes | Yes — English TTS, AAC 48 kHz | No | `challenge-demo-narration-en.md` |
| Video publicly visible on YouTube | Yes | Yes — Public, playable, not Unlisted | No | <https://youtu.be/wFJha9o_dk4> |
| YouTube URL entered in Devpost | Yes | Yes — draft reached finalization | No | <https://youtu.be/wFJha9o_dk4> |
| No unlicensed music or third-party video material | Yes | Yes — no BGM/logos/stock; documented generated background only | No | Video QA and `ASSET_AND_DATA_NOTICES.md` |
| English submission or English translation | Yes | Yes | No | English story, narration, burned captions, SRT |
| Devpost fields completed | Yes | Yes — required draft fields accepted and finalization reached | Yes — final review only | `devpost-field-map.md`, `project-thumbnail.png` |
| Terms / Official Rules accepted | Yes | **No** | **Yes — personal legal consent** | Devpost form |
| Final Submit before deadline | Yes | **No** | **Yes — final personal action** | Devpost form |
| Freeze submission/repo/live site after deadline | Yes per official FAQ | Procedure documented | Yes — observe freeze after Submit | `submission/README.md` |

## Final machine-verifiable evidence

- Production: HTTP 200; Caddy active; Weather, NARA/GO normal/simple, Information, and Ambient visibly changed.
- Native WebMCP: public URL reported `AVAILABLE 7/7` in ChatGPT’s in-app browser.
- Fallback: WebMCP-unsupported browser retained the complete manual UI; 1920×1080 and 375×812 checks had no horizontal overflow or console errors.
- Tests: 35 required files, 14 JavaScript syntax checks, 10/10 Node tests, PHP syntax PASS.
- Repository: Public, default branch `main`, MIT detected, no credentials, clean Challenge-only history.
- Video: 2:18.02, H.264 High 1920×1080 30fps, AAC-LC 48kHz stereo, English TTS and matching burned captions; the synthetic NARA/GO warning and selected `town-01` Ambient are visible.
- Data boundary: public NARA/GO schedule is explicitly fictional and synthetic; private operational timetable history is excluded; retired copy paths return 404 while the original `/nara-go/` remains unchanged.
- Asset boundary: 95 documented generated images; legacy unprovenanced backgrounds are excluded from the public repository and final video.
- Weather attribution: a visible Open-Meteo link is adjacent to the forecast; CC BY 4.0 and transformation/cache details are documented.

## Official-source notes

- Official Rules control if other Challenge material conflicts.
- Rules list the submission start as August 25, 2026 at 11:00 AM PT; the dated September 3 commits are safely inside either published start time.
- The Rules specifically require a **Public YouTube** video; Unlisted does not satisfy the written requirement.
- After final submission/deadline, do not change the Devpost entry, submitted repository, or live site through judging.

Sources: [OpenAI Challenge](https://openai.com/webmcp-challenge/), [Devpost Official Rules](https://webmcp.devpost.com/rules), [Challenge FAQ](https://webmcp.devpost.com/resources), [Devpost submission steps](https://help.devpost.com/article/126-know-your-submission-steps).
