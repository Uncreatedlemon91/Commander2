# Commander2 — Overview

> Default session context. Keep this file under ~1,000 tokens. Load the
> detailed docs only when a task's `context:` list names them.

**Pitch:** First-person, open-world Revolutionary War simulator. The player
rises from a freelance mercenary to colonel of a private regiment and naval
fleet across a seamless 1:1 Thirteen Colonies. Session-based co-op (2–16
players, host-authoritative).

**Engine:** Godot 4.x, strictly typed GDScript. C++/GDExtension only for
profiled hot paths. Engineering rules: `CLAUDE_RULES.md`.

**Phase:** Design complete for first pass. No code yet. Current milestone: **M0 — Bootstrap** (`roadmap.md`).

## System status

Stages: Designed → Prototyped → Implemented → Tested

| System | Spec | Stage |
|---|---|---|
| Technical architecture (streaming, LOD tiers, data, networking) | `SYSTEMS/01_technical_architecture.md` | Designed |
| Mercenary economy | `SYSTEMS/02_mercenary_economy.md` | Designed |
| Tactical battalion AI (formations, ballistics, morale) | `SYSTEMS/03_tactical_battalion_ai.md` | Designed |
| Seamless world sim | `SYSTEMS/04_seamless_world_sim.md` | Designed |
| Naval simulation | `SYSTEMS/05_naval_simulation.md` | Designed |
| Player character & UI | `SYSTEMS/06_player_character_ui.md` | Designed |
| Art style (low-poly) | `SYSTEMS/07_art_style.md` | Designed |

## Load-bearing concepts (summary of 01)

* **LOD tiers:** every unit always exists as data. Tier 0 Engaged (~500m, per tick,
  full ballistics), Tier 1 Nearby (~2km, reduced rate), Tier 2 Active-distant
  (aggregate regiment, ~1Hz), Tier 3 Dormant (record only). Promotion and demotion
  never lose data.
* **Data-oriented:** state lives in flat arrays on manager autoloads
  (`UnitManager`, `ArmyManager`, `ShipManager`, `WorldGrid`), cross-referenced by
  integer ID. No per-soldier Nodes.
* **Rendering:** `MultiMeshInstance3D` for anything numerous, GPU texture-baked
  animation for soldiers.
* **World:** 1km × 1km cells streamed in rings. Streaming affects only presentation,
  never simulation state.
* **Networking:** ENet. The host simulates everything; clients send requests and
  receive per-client interest-filtered snapshots. Portable player-owned company saves.

## Settled decisions

See `decisions/`. Don't reopen these without new information.
D-001 Godot + typed GDScript · D-002 Data-oriented LOD sim · D-003 Host-authoritative
session co-op · D-004 Portable companies · D-005 Low-poly flat-shaded art ·
D-006 Project tracking lives in `PROJECT/`.

## Open

Questions waiting on the owner are listed in `inbox.md` under "Needs a decision".
