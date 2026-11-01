# Project Hub

A gateway for running game projects with Claude. You get one place to see every
project's status, tasks, decisions, devlogs, screenshots, PRs and CI, on
phone or desktop. Claude does the work in each repo and keeps that record up to date.

> This repo was previously the Commander2 game. That project is retired and
> its design docs were removed (they remain in git history).

## How it works

```
 project repo A ─┐   each has PROJECT/ (installed from kit/)
 project repo B ─┼─► GitHub API ─► dashboard (static web app, your browser)
 project repo C ─┘                    ▲
                                      │ projects.json (this repo) lists the repos
```

* **The repo is the database.** Each project keeps its state in `PROJECT/` as
  Markdown + YAML: overview, roadmap, tasks, decisions, devlog, inbox, media.
  Claude reads and updates it every session by following `PROJECT/CLAUDE_PROTOCOL.md`.
* **The dashboard is only a view.** It reads those files plus open PRs and CI
  runs. It never calls Claude, so checking status costs no tokens.

## Add a project

```bash
# from this repo, with the game repo cloned next to it
kit/install.sh ../my-game "My Game"
```

Then:
1. Ask Claude in that repo to "fill in PROJECT/ from the codebase and docs"
   (overview, roadmap, first tasks). Or fill it in yourself.
2. Add the repo to [`projects.json`](projects.json).

## Run the dashboard

```bash
cd dashboard
npm install
npm run dev        # http://localhost:5173, demo mode by default
npm test           # parser and attention unit tests
npm run build      # static site in dashboard/dist/
```

It opens in **demo mode** with sample data. To use real data, open ⚙ Settings,
turn off demo mode, and enter:
* **Hub repository:** this repo (`owner/name`), where `projects.json` lives.
* **GitHub token:** a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new)
  with access to the hub and project repos and **read-only** permissions for Contents, Pull
  requests, Actions and Metadata. It's stored only in that browser.

### Hosting (GitHub Pages)

Every push to `main` builds, tests and deploys the dashboard to
`https://<owner>.github.io/<repo>/` (`.github/workflows/dashboard.yml`).
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The page is set to `noindex`, and it shows nothing real until a token is entered on
that device. On a phone, use "Add to Home Screen" to get an app icon.

`dist/` is plain static files with relative paths, so any other static host works too.

## What the dashboard shows

* **Needs you:** failing CI, PRs to review, open decisions, your tasks,
  playtests, blocked tasks, across all projects.
* **Per project:** overview + roadmap, task board (tap a task for its
  done-when list, the context Claude loads, and an "Edit on GitHub" link), devlog with
  screenshots, decisions, inbox, media gallery, PRs with CI status, and a Play button
  when `project.yml` has a `play_url`.

## Roadmap

See [`PROJECT/roadmap.md`](PROJECT/roadmap.md). Next: write actions from the dashboard
(capture ideas, answer decisions), then "Send to Claude" for ready tasks.
