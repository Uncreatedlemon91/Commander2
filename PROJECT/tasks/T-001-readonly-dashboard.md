---
id: T-001
title: Read-only multi-project dashboard
status: review
milestone: H1
system: dashboard
owner: claude
context: [PROJECT/overview.md, kit/PROJECT/README.md, dashboard/src/parse.ts]
done_when:
  - Lists every repo in projects.json with status, milestone, task counts, CI and cover media
  - "Needs you" aggregates CI failures, PRs, open decisions, human tasks, playtests and blocked tasks
  - Per-project overview, task board with task detail, devlog, decisions, inbox, media, PRs
  - Works at phone and desktop widths, light and dark
  - Demo mode works with no token; GitHub mode works with a fine-grained read-only token
pr:
---

- 2026-10-31: built and verified with unit tests plus a browser run (demo data and a mocked GitHub API). Waiting on owner review.
