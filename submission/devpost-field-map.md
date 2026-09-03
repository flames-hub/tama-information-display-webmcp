# Devpost field map

Challenge-specific labels must be confirmed after the entrant logs in. The following map covers the official requirements and Devpost’s standard submission fields.

## Project details

**Project name**
TAMA Information Display

**Tagline**
A calm ambient display that people touch—and agents can safely recompose—without overriding human intent.

**Thumbnail**
Upload `submission/project-thumbnail.png`.

**Project story / Description**
Paste the content of `submission/devpost-submission-en.md` from “Inspiration” through “What’s next”.

**Built with**
`webmcp`, `javascript`, `html`, `css`, `php`, `open-meteo`, `pwa`, `nodejs`

## Links

**Try it out / Live demo**
https://tama-hub.xvps.jp/tama-info/

**Code repository**
https://github.com/flames-hub/tama-information-display-webmcp

**Demo video**
https://youtu.be/wFJha9o_dk4

## Challenge questions

**Why is this a strong fit for WebMCP?**
A cinematic, gesture-driven wall display is a poor target for coordinate guessing. WebMCP exposes the application’s real display intentions as seven structured, schema-validated tools. Agents act reliably while people keep the complete touch interface.

**How does it create a better user experience?**
An agent can immediately place weather, transport, or a short announcement on the shared screen. If a person touches the display afterward, TAMA cancels delayed agent restoration and invalidates undo so the person’s newer choice is never overwritten.

**What can people and agents do together that was difficult before?**
An agent can prepare a physical information surface from natural-language intent while people remain free to change it directly. The display becomes a negotiated shared surface instead of a one-way remote control.

**How did you implement WebMCP?**
An optional adapter feature-detects `document.modelContext` and registers seven tools with `document.modelContext.registerTool(...)`. Every callback delegates to a shared DisplayController over the existing router, ambient, weather, and web-view logic. Unsupported browsers and registration errors safely fall back to the original UI.

**What was added during the Challenge period?**
The Challenge extension added the WebMCP adapter and seven tools, a shared DisplayController, the Information screen, Agent Activity, safe undo, a manual-revision guard that enforces human priority, input validation, failure-isolation tests, and the complete English submission pack. Dated September 3, 2026 commits identify the work.

**Testing instructions**
No login is required. Open https://tama-hub.xvps.jp/tama-info/ in ChatGPT’s in-app browser or Chrome 149+ with WebMCP testing enabled. Ask the agent to show Nara weather, open NARA/GO, show a short meeting message, and return to Ambient. The page also exposes a reviewer-only debug panel at `?webmcp-debug=1` that lists registration status and invokes the exact same tool callbacks.

## Personal fields — entrant must complete

- Team members / Representative
- Submitter type
- Country or countries of residence
- Eligibility and conflict-of-interest confirmations
- Any profile/contact fields requested by Devpost
- Official Rules and Terms consent
- Final Submit

Do not place passwords or personal credentials in public story fields. The application itself requires none.
