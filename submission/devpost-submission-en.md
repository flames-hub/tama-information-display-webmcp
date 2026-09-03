# TAMA Information Display

## Tagline

A calm ambient display that people touch—and agents can safely recompose—without overriding human intent.

## One-line pitch

TAMA turns a permanent OLED information display into a shared surface where people retain direct control while an agent can show weather, transport, and timely messages through structured WebMCP tools.

## Inspiration

Always-on displays are useful only when they stay calm. A wall display should be beautiful from across the room, immediately understandable when approached, and still usable by touch when no agent is available. At the same time, asking an agent to “show Nara’s weather” should not require brittle coordinate guessing or DOM scraping.

TAMA Information Display explores a simple idea: the same physical screen can serve both people and agents, as long as human intent remains the final authority.

## What it does

TAMA normally runs as an ambient 4K OLED display with a curated background library, clock, weather context, and burn-in-aware motion. A person can swipe or tap into Weather, Information OS, Web, and Settings.

With WebMCP available, an agent discovers seven structured tools and can:

- inspect the current display state;
- switch between Ambient, Weather, Web, and Information;
- show Nara weather using the existing weather view;
- open the approved NARA/GO transport page, including its simple view;
- show a short priority message for a requested duration;
- return to the viewer’s selected ambient scene; and
- undo only the most recent agent display action.

The public demo requires no login and does not need an API key.

## Why WebMCP

A display is a poor fit for visual click automation. The UI is intentionally cinematic, gesture-driven, and optimized for a distant viewer—not for an agent trying to infer which pixels are actionable. WebMCP exposes the application’s real intentions as named, schema-validated actions. The agent can ask the app to show weather or a transport view directly, while the visible UI still changes through the same application logic a human uses.

This makes the result faster and more reliable than DOM guessing, while keeping the application useful in every browser that has no WebMCP support.

## How WebMCP is implemented

The optional adapter feature-detects `document.modelContext`. When available, it registers seven tools with `document.modelContext.registerTool(...)`. When unavailable—or when registration fails—it exits safely and the normal UI continues unchanged.

The adapter contains schemas and error boundaries, but no duplicate product logic. Tool callbacks delegate to a shared `DisplayController`, which in turn uses the existing router, ambient controller, weather controller, and web-view controller. Removing the adapter leaves the human interface functional.

Security and control boundaries are explicit:

- web URLs are mapped only from configured HTTPS sources to a same-origin local copy;
- agent-provided titles and messages are rendered with `textContent`;
- remote display synchronization is disabled, so the feature adds no background state overwrite or sync traffic;
- debug controls appear only with `?webmcp-debug=1`; and
- WebMCP errors are isolated from application startup.

## What humans and agents can do together

An agent can prepare the shared screen in seconds: show Nara’s weather, open a readable transport timetable, or place a meeting notice where everyone can see it. A person can immediately touch, swipe, or use the existing controls to change the screen.

The priority is deliberate:

`human manual operation > agent operation > automatic/default state`

If a person interacts after an agent action, TAMA invalidates the agent’s timed restore and undo. The screen never unexpectedly snaps back over the person’s choice. This turns WebMCP from remote control into collaboration.

## How we built it

The application uses dependency-free HTML, CSS, and JavaScript with a small PHP weather proxy. WebMCP was added as a removable integration layer. Node’s built-in test runner verifies registration, unsupported-browser behavior, failure isolation, text-safe information rendering, URL allowlisting, undo behavior, and the manual-priority invariant.

The app also contains a local, iframe-friendly copy of NARA/GO. The original NARA/GO application remains unchanged, while its normal/simple display switch is preserved inside TAMA.

## Challenges

The hardest problem was not registering tools; it was defining ownership of a physical screen. Timed information and undo are convenient until a person has already changed the display. We introduced a manual revision guard so delayed agent work cannot overwrite newer human intent.

The second challenge was progressive enhancement. WebMCP is experimental, so every registration path had to fail closed without turning an optional agent feature into an application dependency.

## Accomplishments

- Seven non-trivial tools reuse the real application controllers.
- Tool execution produces immediate, visible screen changes.
- Non-WebMCP browsers retain the complete manual experience.
- Human input safely supersedes agent timers and undo.
- The debug and Agent Activity UI stay out of the normal viewing experience.
- The app remains login-free and uses no submitted credentials or API keys.

## What we learned

The best browser tool is not a second API bolted beside the interface. It is a narrow adapter over the same intentions already used by the interface. We also learned that collaboration needs an explicit conflict policy: temporal order alone is not enough when a delayed action can affect a shared screen.

## What’s next

Next steps include optional authenticated multi-display coordination, user-approved schedules, richer location support, and a durable audit history. Any remote synchronization will remain opt-in and will preserve the same human-first conflict rule.

## Links

- Live URL: https://tama-hub.xvps.jp/tama-info/
- Public repository: https://github.com/flames-hub/tama-information-display-webmcp
- Demo video: **YOUTUBE_PUBLIC_URL_PENDING**
- Testing instructions: open the live URL in ChatGPT’s in-app browser, ask it to show Nara weather, NARA/GO, a short information message, and then Ambient. No account or credentials are required.

## Challenge-period work

The original human-operated display behavior remains intact. The Challenge extension adds the WebMCP adapter, shared display facade, Information screen, Agent Activity indicator, safe undo, human-priority restoration guard, tool tests, and submission documentation. Dated commits on September 3, 2026 distinguish this work in the public history.

## Built with

WebMCP, JavaScript, HTML, CSS, PHP, Open-Meteo, Progressive Web App, Node.js test runner
