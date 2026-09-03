# WebMCP Challenge submission checklist

Verified against the official OpenAI Challenge page, Devpost Official Rules, and Devpost Challenge FAQ on **2026-09-03 JST**.

Deadline: **2026-09-03 13:00 PDT / 20:00 UTC / 2026-09-04 05:00 JST**
Judging ends: **2026-09-21 17:00 PT**

| Requirement | Required | Ready | Needs human action | Evidence / URL |
| --- | --- | --- | --- | --- |
| Eligible entrant and no disqualifying conflict | Yes | Not machine-verifiable | Yes — entrant must confirm | [Official Rules §3](https://webmcp.devpost.com/rules) |
| Joined the challenge on Devpost | Yes | Not verified | Yes — log in / join if needed | [Challenge page](https://webmcp.devpost.com/) |
| Working WebMCP-powered web app | Yes | Yes locally; production verification pending | No | `js/webmcp-adapter-v0.4.js`, `tests/` |
| Working live URL | Yes | Pending deployment verification | No | <https://tama-hub.xvps.jp/tama-info/> |
| Accessible in ChatGPT in-app browser or WebMCP-enabled Chrome 149+ | Yes | Local in-app browser verified; public verification pending | No | `IMPLEMENTATION_REPORT.md` |
| Judges can test free of charge through judging | Yes | Yes; no authentication is designed | No | Live URL above |
| `document.modelContext.registerTool(...)` implementation | Yes | Yes — 7 tools | No | `js/webmcp-adapter-v0.4.js` |
| Tool call visibly changes the real app UI | Yes for claimed functionality | Yes locally; public verification pending | No | `show_weather`, `open_web_page`, `show_information`, `show_ambient` |
| Normal UI works without WebMCP | Challenge compatibility expectation | Yes — feature detection and failure isolation tested | No | `tests/webmcp-adapter.test.mjs` |
| Public source repository | Yes | Clean Challenge repository in preparation | No | <https://github.com/flames-hub/tama-information-display-webmcp> |
| Repository contains source, assets, and setup instructions | Yes | Yes locally | No | `README.md`, source tree |
| Detectable open-source license | Yes | MIT file ready; GitHub detection pending | No | `LICENSE` |
| Challenge-period work clearly distinguished | Required for pre-existing projects | Yes in docs; final commit links pending | No | `CHANGELOG.md`, `WEBMCP_CHALLENGE.md`, Git history |
| Secrets / credentials absent | Yes under IP/security requirements | Local scan passed; final tracked-file scan pending | No | External action ledger |
| English project description covering WebMCP fit, UX, collaboration, and implementation | Yes | Yes | No | `devpost-submission-en.md` |
| Demo video under 3 minutes | Yes | In production | No | `challenge-demo-final.mp4` |
| Video clearly shows the project functioning | Yes | In production | No | Demo sequence in video pack |
| Video audio explains the project and WebMCP | Yes | In production | No | English TTS narration + captions |
| Video publicly visible on YouTube | Yes | No | Yes — account/visibility confirmation and Public publish | YouTube URL pending |
| YouTube URL entered in Devpost | Yes | No | Yes — paste issued URL | `youtube-title-description.md` |
| No unlicensed music or third-party material in video | Yes | Planned: no BGM; original app visuals only | Human review recommended | Final MP4 |
| Submission materials are English or include English translation | Yes | Yes | No | English Devpost text, English narration and captions |
| Devpost required fields completed | Yes | Copy-ready pack complete; authenticated form not verified | Yes — login, personal eligibility fields, terms | `devpost-field-map.md` |
| Terms / Official Rules accepted | Yes | No | Yes — personal legal consent | Devpost form |
| Final Submit before deadline | Yes | No | Yes — final personal action | Devpost form |
| Freeze submitted repo/live site/submission after deadline | Yes per official FAQ | Procedure documented | Yes — observe freeze | `submission/README.md` |

## Official-source notes

- Official Rules control if the OpenAI landing page, FAQ, or helper material conflicts.
- Rules list the submission period as starting **August 25, 2026 at 11:00 AM PT**. The OpenAI landing page says noon. The dated Git history makes the Challenge work independently inspectable either way.
- A public YouTube video is specifically required; an unlisted video does not satisfy the written rule.
- Judges are not required to run the app. The description and video therefore stand on their own.

Sources: [OpenAI Challenge](https://openai.com/webmcp-challenge/), [Devpost Official Rules](https://webmcp.devpost.com/rules), [Challenge FAQ](https://webmcp.devpost.com/resources), [Devpost submission steps](https://help.devpost.com/article/126-know-your-submission-steps).
