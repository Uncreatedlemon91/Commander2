---
id: T-002
title: Add a headless smoke-test harness
status: backlog
milestone: M0
system: tooling
owner: claude
context:
  - CLAUDE_RULES.md §8
  - PROJECT/tasks/T-001-godot-project-skeleton.md
done_when:
  - A runner script executed via `godot --headless` loads the main scene, ticks N frames, and exits 0 on success, non-zero on failure
  - Test mode is gated by an env var or command-line flag, so normal runs are unaffected
  - One trivial test (autoloads present and typed) proves the harness catches a failure
  - A one-command local invocation is documented in README.md
pr:
---

Depends on T-001. Keep it dependency-free (no GUT or other addon) unless a
real need shows up.

- 2026-10-31: created.
