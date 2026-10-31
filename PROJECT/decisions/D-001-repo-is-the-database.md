---
id: D-001
title: Each project's repo is the database; PROJECT/ is the source of truth
status: accepted
date: 2026-10-31
source: owner, 2026-10-31 session
---

**Decision:** Project state lives as Markdown and YAML in each repo's `PROJECT/`.
The dashboard is only a view over it plus GitHub PR and CI data.

**Why:** Claude reads and updates repo files natively with no sync layer.
Everything is versioned, and the dashboard can be replaced without losing anything.
Compact curated context (`overview.md` plus per-task `context:` lists) cuts tokens per session.
