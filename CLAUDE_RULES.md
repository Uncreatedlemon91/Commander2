# CLAUDE_RULES.md — GDScript Standards & Claude Code Instructions

Rules for anyone (human or Claude) writing code in this repo. `GAME_VISION.md`
is the design authority; this doc is the engineering authority. When they seem
to conflict, ask rather than guessing.

---

## 1. Engine & Language

* **Godot 4.x**, latest stable minor unless a specific feature pins us to one.
* **GDScript only** at the gameplay layer. Reach for **C++/GDExtension** only
  for sub-systems that profiling shows GDScript can't hold at scale (mass unit
  AI ticking, ballistics raycast batches, physics batching) — see §4.
* **Strict typing is mandatory**, no exceptions:
  ```gdscript
  # Bad
  var speed = 5.0
  func take_damage(amount):
      health -= amount

  # Good
  var speed: float = 5.0
  func take_damage(amount: float) -> void:
      health -= amount
  ```
  Untyped `var`, untyped params, and untyped return values are not allowed to
  merge. `Variant` is acceptable only at true polymorphic boundaries (e.g. a
  generic event bus payload), and must be narrowed immediately.
* Every non-trivial script that's referenced by class name gets a
  `class_name` and extends the narrowest useful base class (not `Node` when
  `Node3D`/`CharacterBody3D`/etc. is correct).

## 2. Project Structure

```
scenes/     .tscn files — composition roots, kept thin (see §3)
scripts/
  autoload/       singletons registered in project.godot
  world/          open-world streaming, chunk/cell management
  units/          soldier/unit sim — data, AI, formations
  naval/          ship sim — sail physics, wind, broadsides
  economy/        contracts, payroll, trade, town supply/demand
  player/         first-person controller, camera, weapon handling
  ui/             HUD, menus, command interface
  data/           resource definitions (weapons, unit stats, faction data)
addons/           GDExtension build output + third-party plugins
SYSTEMS/          design specs (not code)
```
Match new scripts to this layout. If a new script doesn't fit, that's a sign
the structure needs a new folder — raise it rather than dropping the file
wherever's convenient.

## 3. Scenes vs. Code

* Scenes are composition + authored placement (meshes, collision shapes,
  authored levels/ships). Avoid building large runtime hierarchies by hand in
  code when a scene will do — but avoid giant monolithic scenes for anything
  that's spawned/streamed at runtime (units, cannonballs, debris): use
  packed scenes instantiated from a pool instead.
* No `get_node("../../Foo/Bar")`-style path climbing. Use `@onready var` with
  `%UniqueName` scene-unique nodes, exported `NodePath`/direct references, or
  signals. If a script needs to reach far outside its own subtree, that's an
  autoload/signal-bus problem, not a `get_node` problem.
* One script per scene root unless the scene is trivial (pure visual/no
  logic).

## 4. Performance Rules (read before touching units, AI, or naval sim)

The vision commits to *thousands of simultaneous combatants* and *1:1 scale*.
That's not achievable with default Godot node-per-soldier patterns. Rules:

* **Rendering:** any repeated visual element with a population that can climb
  into the hundreds (soldiers, cannonballs, debris, foliage) renders via
  `MultiMeshInstance3D`, not one node per instance. Individual `Node3D`s are
  for things that are always few in number (player, ships, officers,
  buildings).
* **Simulation LOD is mandatory, not an optimization pass added later.**
  Every system that scales with unit count must be designed against LOD tiers
  from day one (tiers defined in `SYSTEMS/01_technical_architecture.md`).
  Don't write a "simulate everyone every frame" version and plan to add LOD
  after — the data layout differs and retrofitting it is a rewrite.
* **Data-oriented for hot paths.** Bulk unit state (position, health, morale,
  ammo, formation slot) lives in flat arrays/`PackedArray`s owned by a
  manager, not scattered across hundreds of individual node instances with
  their own `_process()`. Individual per-soldier `Node`s for units outside
  the near-LOD tier are a performance bug.
* **No per-frame allocation in hot loops.** No `.duplicate()`, array
  literals, or `Array`/`Dictionary` construction inside code that runs per
  unit per frame. Pre-allocate and reuse.
* **`_process`/`_physics_process` discipline:** don't put per-unit logic on
  individual node `_process()` callbacks once unit count is non-trivial —
  that reintroduces the per-node overhead LOD is meant to avoid. Batch-tick
  from a manager instead.
* **Threading:** long-running batch work (AI decision ticks for the mid/far
  LOD tiers, pathing, LOS batch checks) should be structured so it *can* run
  on worker threads via `WorkerThreadPool`, even before it needs to. Keep
  per-tick work free of Node-tree mutation so it's thread-safe to compute off
  the main thread and cheap to apply back on it.

## 5. GDExtension Boundary

Default to GDScript. Move a sub-system to C++/GDExtension only when:
1. It's been profiled (not guessed) as a bottleneck, **and**
2. It's on a hot path that scales with unit/entity count (mass AI ticking,
   ballistics/LOS raycast batching, formation physics batching) — not one-off
   or UI-adjacent code, which stays in GDScript regardless of profiling.

When a system does move to GDExtension, the GDScript side keeps ownership of
game state and decisions; the extension does the numeric heavy lifting and
hands back results (e.g. "these N raycasts resolved to these hits"), so the
system stays debuggable and testable from GDScript first.

## 6. Networking

Session-based co-op over **ENet**, **host-authoritative** — a small group of
players (not a persistent dedicated-server world; see
`SYSTEMS/01_technical_architecture.md` §9 for the full model). Rules:

* The host is the single source of truth. Clients never simulate outcomes
  locally and call it fact — they send input/order *requests*, the host
  validates and simulates, and broadcasts results.
* Don't hand-roll replication ad hoc per feature. New networked state goes
  through the same interest-management/snapshot path described in
  `01_technical_architecture.md` §10, not a one-off RPC bolted onto a
  single script.
* Unreliable channel for continuous state (positions, transforms);
  reliable channel for discrete events (a shot fired, a unit routed, an
  order issued, a player joining/leaving). Don't send high-frequency state
  reliably — that's how networking code silently turns into the frame-rate
  bottleneck.
* The LOD/data-oriented architecture in `01_technical_architecture.md` §3
  is what makes this affordable: replication only has to cover what a
  given client's interest set actually contains, not the whole world.

## 7. Comments & Docs

* Default to no comments. Only write one when it captures a non-obvious
  *why* (a hidden constraint, a workaround, a subtle invariant) — never a
  restatement of what the code does.
* No doc-comment blocks on every function. Godot's own type hints and clear
  naming carry that weight.
* Design intent belongs in the relevant `SYSTEMS/*.md` doc, not scattered in
  code comments — keep code and design docs each authoritative for their own
  concern.

## 8. Testing & Validation

* Prefer headless, scriptable smoke tests over manual click-through
  verification wherever a system can be driven without a player present
  (e.g. `godot --headless` runs gated by an env var, in the style the old
  prototype used). Add these as systems come online rather than bolting them
  on afterward.
* For anything UI/first-person/feel-dependent, verify by actually running
  the scene in-editor — don't claim a control scheme or HUD works from
  reading the code.

## 9. Claude Code Instructions

* Treat `GAME_VISION.md` and the `SYSTEMS/*.md` docs as the design source of
  truth. If an implementation request conflicts with them, flag the
  conflict rather than silently picking one.
* Don't invent scope. If a `SYSTEMS` doc doesn't cover a case you've hit,
  stop and raise it rather than improvising a design decision that belongs
  in the doc.
* Follow the global repo conventions (no unrequested abstractions, no
  speculative error handling, no backwards-compat shims) — this project has
  no legacy users to be compatible with.
