# Project Hub — Overview

> Default session context for this repo. Keep under ~1,000 tokens.

**What:** A gateway for running game projects with Claude. There are two parts:
1. **`kit/`**: a template (`PROJECT/` folder plus `CLAUDE_PROTOCOL.md`) installed
   into each project repo with `kit/install.sh`. The repo is the source of truth.
2. **`dashboard/`**: a static, mobile-friendly web app that reads `PROJECT/`
   plus PRs and CI from every repo listed in `projects.json`, through the GitHub API.

**Tech:** React 18 + TypeScript + Vite. No backend: the GitHub API is called from
the browser with the owner's fine-grained token (stored only on their device).
Demo mode renders bundled sample data with no token.

**Current milestone:** **H1 — Read-only dashboard** (`roadmap.md`).

## System status

| System | Location | Stage |
|---|---|---|
| Project kit + install script | `kit/` | Implemented |
| Session protocol | `kit/PROJECT/CLAUDE_PROTOCOL.md` | Implemented |
| Dashboard: read-only views | `dashboard/` | Prototyped |
| Dashboard: actions (capture, dispatch to Claude) | — | Idea |
| Scheduled autonomy + reports | — | Idea |

## Key constraints

* The dashboard never calls Claude just to *display* data. Status costs zero tokens.
* Blobs are cached by git SHA (content-addressed), so a refresh re-fetches only changed files.
* Template files start with `_` and are ignored by the dashboard.

## Settled decisions

D-001 Repo is the database · D-002 Static dashboard, no backend · D-003 Games-first features.
