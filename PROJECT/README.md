# PROJECT/ — Project Tracking

The single place for the project's state: what's planned, what's in progress,
what was decided, and what happened. Humans and Claude both read and write it,
and a future dashboard will render it. Plain Markdown with YAML front matter,
so it's readable on GitHub, diffable, and machine-parseable.

| Path | What it holds | Who updates it |
|---|---|---|
| `overview.md` | Compact project summary + system status. **Default context for every Claude session** (~1k tokens). | Claude, when status changes |
| `roadmap.md` | Milestones, each with a playable proof of done | Owner (Claude proposes) |
| `tasks/T-###-slug.md` | One file per unit of work | Claude + owner |
| `decisions/D-###-slug.md` | Settled decisions. Don't re-argue these without new information. | Claude records, owner approves |
| `devlog/YYYY-MM-DD-slug.md` | One entry per work session: what changed, what's next | Claude, at the end of each session |
| `inbox.md` | Raw ideas + questions waiting on the owner | Anyone |

## Task lifecycle

```
inbox → backlog → ready → in-progress → review → done
                                  ↘ blocked
```

* **ready** means the task is fully specified (context list + done-when) and
  Claude may pick it up without asking.
* **review** means a PR is open and waiting for the owner. Claude never merges its own work.
* Tasks with `owner: human` are decisions or actions only the owner can take.

## Task file format

```markdown
---
id: T-000
title: Short imperative title
status: ready          # inbox | backlog | ready | in-progress | review | done | blocked
milestone: M0
system: tooling        # tooling | architecture | economy | tactical-ai | world-sim | naval | player-ui | art
owner: claude          # claude | human
context:               # the ONLY docs a session needs to load for this task
  - CLAUDE_RULES.md §2
done_when:
  - Concrete, checkable outcome
pr:                    # filled in when a PR exists
---

Notes, approach, links. Append a dated line when status changes.
```

## Devlog entry format

```markdown
---
date: 2026-10-31
tasks: [T-001]
pr:
---

**Did:** …
**Decided:** … (link new decisions/ files)
**Blocked / questions:** … (also added to inbox.md)
**Next:** suggested next task(s)
```

Keep entries short. The diff and PR hold the detail; the devlog is the readable summary.
