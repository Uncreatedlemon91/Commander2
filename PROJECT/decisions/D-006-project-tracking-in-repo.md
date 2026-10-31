---
id: D-006
title: Project tracking lives in the repo under PROJECT/
status: accepted
date: 2026-10-31
source: owner request, 2026-10-31 session
---

**Decision:** Roadmap, tasks, decisions, devlog and inbox are Markdown
files in `PROJECT/`. Any dashboard is a view over these files plus GitHub
and never the source of truth. Claude maintains them as part of every session
(CLAUDE_RULES.md §10).

**Why:** Claude reads and updates the repo natively, with no syncing. Everything
is versioned. Compact, curated context (overview.md plus per-task context lists)
cuts the tokens spent re-reading the full design docs (~20k tokens) every session.
