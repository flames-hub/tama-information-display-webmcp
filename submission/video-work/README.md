# Challenge demo video pipeline

This folder contains the deterministic capture sources for the WebMCP Challenge demo. It uses the real TAMA application, the real seven WebMCP tool definitions, and a small Playwright host shim that implements the current `document.modelContext.registerTool()` contract for automated capture.

The recording deliberately uses a deterministic same-origin WebMCP test host instead of presenting a simulated chat window as a real logged-in ChatGPT session. The public URL is independently verified in ChatGPT's in-app browser; the recorded tool results come from the application’s own registered tool definitions and `DisplayController`.

For the submission capture, local review state rejects the three legacy abstract backgrounds whose repository-local generation provenance is unavailable and accepts the documented generated `town-01` image. This keeps every visible video asset inside the public-source provenance boundary without changing the deployed user's choices.

The capture runner types the four requested Japanese commands, invokes the registered tools, and records the resulting Weather, NARA/GO Web, Information, and Ambient screens. No third-party music, logo, stock video, or artwork is added.

Run from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-challenge-video.ps1
```

The default output is `submission/challenge-demo-final.mp4`. The narration is generated with an installed English Windows voice, and the exact narration text is burned in as English subtitles.
