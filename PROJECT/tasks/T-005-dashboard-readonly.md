---
id: T-005
title: Build the read-only project dashboard (web, mobile + desktop)
status: backlog
milestone: X1
system: tooling
owner: claude
context:
  - PROJECT/README.md
  - PROJECT/devlog/2026-10-31-project-tracking-setup.md
done_when:
  - A responsive web app (installable PWA) shows roadmap, system status, task board, devlog feed, inbox, and open PRs or CI status
  - Reads PROJECT/ and GitHub through the GitHub API using the owner's GitHub login. No server-side secrets, and the private repo stays private.
  - Makes zero Claude calls. It only displays data.
  - Usable on a phone screen
  - Hosting chosen and deployed (Cloudflare Pages, Vercel or similar)
pr:
---

Stack and hosting not yet chosen (to be proposed when the task starts). Lives
under `tools/dashboard/` so it never mixes with game code.

- 2026-10-31: created.
