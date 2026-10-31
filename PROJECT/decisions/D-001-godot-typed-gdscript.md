---
id: D-001
title: Godot 4 with strictly typed GDScript; GDExtension only after profiling
status: accepted
date: 2026-10-31
source: GAME_VISION.md §5, CLAUDE_RULES.md §1, §5
---

**Decision:** Godot 4.x. All gameplay code is strictly typed GDScript. A
sub-system moves to C++/GDExtension only when profiling shows it's a hot-path
bottleneck that scales with entity count. GDScript keeps ownership of state and decisions.

**Why:** Fast iteration and debuggability, while keeping a known escape hatch for mass simulation.
