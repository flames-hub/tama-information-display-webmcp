# YouTube upload text

## Video title

TAMA Information Display — Human-First WebMCP Demo

## Description

TAMA Information Display is a calm ambient OLED display that people can control directly while an agent safely shows weather, transport, and timely information through WebMCP.

This demo shows the complete flow:

1. A typed request to show Nara weather
2. A structured WebMCP tool call
3. The real display changing to Weather
4. NARA/GO opening in the Web view
5. A 1:00 PM meeting notice appearing in Information
6. The display returning to the viewer’s selected Ambient scene

Human input always has priority over agent actions and automatic restoration. WebMCP is an optional adapter: browsers without `document.modelContext` retain the complete manual interface.

Project URL: https://tama-hub.xvps.jp/tama-info/

Source code: https://github.com/flames-hub/tama-information-display-webmcp

Built for the OpenAI WebMCP Challenge: https://openai.com/webmcp-challenge/

Credits:

- Application, demo visuals, narration script, and generated ambient assets: TAMA Information Display project
- Weather data: Open-Meteo (https://open-meteo.com/)
- Narration: operating-system text-to-speech
- Music: none

No login or API key is required to test the public demo.

## Visibility

The Official Rules require **Public**, not Unlisted. The entrant should confirm the final Public setting personally.
