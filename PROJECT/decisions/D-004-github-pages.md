---
id: D-004
title: Host the dashboard on GitHub Pages, deployed from main by Actions
status: accepted
date: 2026-11-01
source: owner, 2026-11-01 session
---

**Decision:** The `dashboard` workflow builds and tests on every PR, and on
`main` it deploys `dashboard/dist` to GitHub Pages. It's not embedded in the
Ravenfall site.

**Why:** Simplest option, free while the repo is public, no extra accounts.
It also gets its own origin, so no other site's scripts share the stored token.
