# PROJECT/ — Project Tracking

The single place for this project's state. Humans and Claude both read and
write it, and the Project Hub dashboard renders it. Plain Markdown with YAML
front matter, so it's readable on GitHub, diffable, and machine-parseable.
Claude's working rules: [`CLAUDE_PROTOCOL.md`](CLAUDE_PROTOCOL.md).

| Path | What it holds | Who updates it |
|---|---|---|
| `project.yml` | Name, type, engine, status, play link. Read by the dashboard. | Claude + owner |
| `overview.md` | Compact summary + system status. **Default context for every Claude session** (~1k tokens). | Claude, when status changes |
| `roadmap.md` | Milestones, each with a playable proof of done | Owner (Claude proposes) |
| `tasks/T-###-slug.md` | One file per unit of work | Claude + owner |
| `decisions/D-###-slug.md` | Settled decisions. Don't re-argue them without new info. | Claude proposes, owner accepts |
| `devlog/YYYY-MM-DD-slug.md` | One entry per work session | Claude, at the end of each session |
| `inbox.md` | Raw ideas + `- [ ]` questions waiting on the owner | Anyone |
| `media/` | Screenshots and clips, named `M<n>-<slug>.<ext>` | Claude |

Files starting with `_` are templates. The dashboard ignores them.

## Task lifecycle

```
inbox → backlog → ready → in-progress → review → done
                                  ↘ blocked
```

* **ready** means fully specified (context list + done-when), so Claude may pick it up without asking.
* **review** means a PR is open and waiting for the owner. Claude never merges its own work.
* `owner: human` marks decisions or actions only the owner can take. The
  dashboard shows these under "Needs you".

Formats: see `tasks/_template.md`, `decisions/_template.md`, `devlog/_template.md`.
