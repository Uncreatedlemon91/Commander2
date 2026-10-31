# Project Hub — Claude instructions

This repo is the hub: `kit/` (template installed into each project repo) and
`dashboard/` (static web app over every project's `PROJECT/` folder).

## Project tracking

Follow `kit/PROJECT/CLAUDE_PROTOCOL.md` for every session: load
`PROJECT/overview.md` first and keep `PROJECT/` up to date. The hub tracks itself
with the same kit; its templates live only in `kit/PROJECT/`.

## Rules

* Changes to the kit format (front matter fields, file layout) must be mirrored in
  `dashboard/src/parse.ts`, its tests, and `kit/PROJECT/README.md`, in the same PR.
* The dashboard never calls Claude to display data, and never stores secrets
  anywhere but the viewer's browser.
* Before pushing dashboard changes, run in `dashboard/`: `npm test` and `npm run build`.
  Verify UI changes in a browser at phone width (390px) and desktop width.
