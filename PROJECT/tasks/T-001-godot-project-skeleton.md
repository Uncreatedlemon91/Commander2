---
id: T-001
title: Create the Godot 4 project skeleton
status: blocked
milestone: M0
system: tooling
owner: claude
context:
  - CLAUDE_RULES.md §1–§3
  - PROJECT/overview.md
done_when:
  - project.godot exists at repo root, pinned to the agreed Godot version
  - Folder layout matches CLAUDE_RULES.md §2 (empty dirs kept with .gitkeep)
  - Empty, typed autoload stubs registered for UnitManager, ArmyManager, ShipManager, WorldGrid
  - .gitignore covers .godot/ and export output
  - Project opens in the editor and runs an empty main scene with no errors
pr:
---

Blocked on the "Godot version to pin" question in `inbox.md`.

- 2026-10-31: created.
