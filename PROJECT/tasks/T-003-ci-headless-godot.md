---
id: T-003
title: Run the headless smoke tests in GitHub Actions
status: backlog
milestone: M0
system: tooling
owner: claude
context:
  - PROJECT/tasks/T-002-headless-smoke-test.md
done_when:
  - A workflow runs on every PR and push to main, downloading the pinned headless Godot binary (cached)
  - The workflow runs the T-002 harness and fails the check on test failure
  - Proven by one deliberately failing run and one passing run
pr:
---

Depends on T-002. CI is what lets the future dashboard show "green or red per
PR" without spending any Claude tokens.

- 2026-10-31: created.
