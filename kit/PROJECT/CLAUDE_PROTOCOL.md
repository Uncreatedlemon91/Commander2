# Claude Session Protocol

How Claude works in any repo that uses the project kit. `PROJECT/` is the
project's state. Every session keeps it current, which is what replaces
re-explaining context and asking "where are we?". This file covers *process*.
The project's own coding rules live wherever the project keeps them
(e.g. `CLAUDE.md`).

## Starting a session

* Load `PROJECT/overview.md` first. For a task, load the task file and **only**
  the docs in its `context:` list. Don't read every design doc to
  orient yourself. Open another doc only when the work actually hits it, and
  add it to the task's `context:` list so the next session knows.
* Check `PROJECT/decisions/` before proposing an approach. Don't reopen an
  `accepted` decision without new information. If you have some, raise it as
  a question in `inbox.md` and don't act on it.
* Only pick up tasks with `status: ready` and `owner: claude` unless the owner
  directs otherwise. Set the task to `in-progress` when starting.
* Files whose names start with `_` are templates. Copy them; don't edit them.

## Ending a session (part of the work, not optional)

* Update the task: status (`review` when a PR is open, `blocked` with the
  reason), `pr:` link, and a dated line in its notes.
* Write one short `PROJECT/devlog/YYYY-MM-DD-slug.md` entry from
  `devlog/_template.md`.
* New settled choices go in `PROJECT/decisions/` as `status: proposed` until
  the owner accepts them. Questions for the owner go under "Needs a decision"
  in `inbox.md` as `- [ ]` items.
* Update `overview.md` (system stages, current milestone) if they changed.
  Keep that file under ~1,000 tokens.
* Update `project.yml` `status` / `milestone` if they changed.

## Games: show, don't tell

* Milestones in `roadmap.md` end in a **playable or runnable proof**.
  Something you can launch and see, not just merged code.
* When a milestone's proof is reached, or a task changes something visible,
  save a screenshot or short clip to `PROJECT/media/` named
  `M<n>-<slug>.png|gif|webm|mp4` (headless or engine-scripted capture where
  possible). Reference it in the devlog entry. The dashboard shows these.
* Don't claim that feel-dependent work (controls, camera, HUD, game feel)
  works from reading code. Say it needs an in-editor playtest and add a
  `- [ ] Playtest: …` item to `inbox.md`.
* Record performance numbers (frame time, entity counts) in the devlog when
  a task touches a hot path. Budgets live in `roadmap.md`.

## Limits for unattended or scheduled runs

* At most one task per run unless the run's instructions say otherwise.
* If the first approach fails (tests stay red, or a spec gap appears), stop:
  mark the task `blocked`, write the devlog entry, and don't attempt a second
  approach unsupervised.
* Never merge your own PR. Never change design intent or an accepted
  decision without the owner's approval.
