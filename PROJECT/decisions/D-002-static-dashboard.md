---
id: D-002
title: Static dashboard with no backend; GitHub API from the browser
status: accepted
date: 2026-10-31
source: 2026-10-31 session
---

**Decision:** The dashboard is a static single-page app (hash routing, relative
base path) that calls the GitHub API directly, authenticated with a
fine-grained personal access token kept in the viewer's browser storage.

**Why:** It can be hosted for free anywhere, there are no secrets on a server, and it works on
mobile and desktop. A backend becomes necessary only for H3 and H4 (dispatching
Claude runs), and is deferred until then.
