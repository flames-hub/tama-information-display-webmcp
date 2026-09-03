# NARA/GO public sample provenance

This Challenge repository contains a runnable copy of the NARA/GO interface for
demonstrating TAMA Information Display's normal and simple iframe modes.

- Interface snapshot date: 2026-09-03
- Public sample data: `data/timetables-public.json`
- Dataset marker: `synthetic-challenge-sample`
- Original live service: <https://tama-hub.xvps.jp/nara-go/>

The timetable bundled here is fictional demonstration data created specifically
for this public repository. It is not copied from the live timetable and must not
be used for travel. The private operational dataset and its history are not part
of this repository.

Changes made for the Information Display copy:

- added `embed.css` and `embed.js`
- notified the parent display when the iframe is operated
- kept the normal/simple display switch inside the copied interface
- registered the parent TAMA service worker rather than an independent worker
- added a persistent synthetic-data warning to both display variants

The original `/nara-go/` application remains separate and unchanged.
