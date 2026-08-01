# 01 — Technical Architecture

Foundational doc. Every other `SYSTEMS/*.md` doc assumes the LOD tiers,
streaming model, and rendering approach defined here — write those docs
against this one, not around it.

> **Flagged assumptions:** anything below marked ⚑ is a concrete number or
> call I picked to make the design decidable, not a requirement pulled from
> `GAME_VISION.md`. Correct any that are wrong before we build against them —
> they're cheap to change now and expensive once other systems depend on them.

---

## 1. Goals This Architecture Serves

* Seamless world: no loading screens, no separate "battle scene." A player
  walking toward a fight sees it resolve continuously as they close distance.
* 1:1 scale: a regiment is however many men it historically had, not a
  scaled-down token count.
* Thousands of simultaneously active combatants without the frame rate
  collapsing.
* Session-based co-op multiplayer (§9): a small group of players sharing one
  host-authoritative session, on top of the same LOD/data-oriented
  foundation single-player uses — not a bolted-on second architecture.

## 2. World Streaming

* The Thirteen Colonies + coastal waters are divided into a uniform grid of
  **cells** ⚑ (target size: 1km × 1km). Each cell owns its own terrain chunk,
  static geometry, vegetation, and a manifest of what armies/settlements/ships
  currently occupy it.
* Cells stream in based on distance from the *nearest connected player* in
  **rings**, not a single radius — different content types have different
  load distances. In multiplayer, each client only streams presentation
  around its own position; a cell can be presentation-loaded for one client
  and not another while still being simulated identically for both (§3, §9):
  * Terrain + collision: loads far out (needed for silhouettes, distant
    sightlines).
  * Static dressing (buildings, fences, foliage instances): loads at a
    shorter distance, unloads first when moving away.
  * Live entity data (units, ships, wagons) is **not** tied to visual
    streaming — see §3. An army can be simulated in a cell that has no
    graphical representation loaded at all.
* World state is authoritative on a central set of manager singletons (§5),
  not on the streamed scene nodes. Streaming loads/unloads *presentation*;
  it never owns simulation state, so combat correctness never depends on
  what happens to be graphically resident.
* Persistence: settlement economy state, faction army positions/strength,
  and world-changing events (a town captured, a supply depot destroyed)
  autosave on a timer ⚑ (e.g. every 2 minutes) plus on significant events, so
  a crash loses at most a couple minutes, not a session.

## 3. Entity Simulation: LOD Tiers

Every soldier, gun crew, and ship exists at all times as data (see §5) —
nothing is destroyed and recreated when the player approaches. What changes
between tiers is *how expensively* that data gets updated. This is what
makes combat "trigger dynamically wherever forces clash" without a scene
transition: an army crossing from Tier 3 into Tier 1 is a tier promotion on
existing data, not a spawn event.

**In multiplayer, tier assignment is a simulation-side concept, not a
per-client one.** The host runs one shared set of tiers for the whole
session — a cell's simulation tier is driven by proximity to the *nearest
of any connected player*, so an army near Player A gets simulated in full
even for Player B on the far side of the map. Each client then gets its own
independent *replication* filter on top of that (§9) — what a client is
sent to render is separate from how expensively the host is simulating it.

| Tier | Who's in it | Update rate | Simulation fidelity |
|---|---|---|---|
| **0 — Engaged** | Units in active combat within any connected player's immediate area ⚑ (~500m) | Every physics tick | Full: individual ballistics, per-unit morale/fatigue, formation physics, melee resolution |
| **1 — Nearby** | Visible or near-visible to any connected player, not yet in a fight ⚑ (~500m–2km) | Several times/sec ⚑ | Full state, reduced tick rate: marching/pathing, formation cohesion, no per-shot ballistics until they engage and get promoted to Tier 0 |
| **2 — Active-distant** | Marching, maneuvering, foraging — relevant to world state but far from every connected player ⚑ (2km–20km) | ~1x/sec or slower, batched | Aggregate: regiment treated as a single agent with strength/morale/position; casualties resolved by model, not per-shot sim |
| **3 — Dormant** | Everything else | On-demand / world-tick only | Pure data record: faction, strength, position on the road/sea graph, current order. No per-soldier data resident — Tier 2 promotion reconstructs it from the unit roster |

* **Promotion/demotion is automatic and continuous**, driven by distance to
  the nearest connected player (and, for AI-vs-AI fights no player is near,
  by distance to any other force they're engaging — two AI armies colliding
  at Tier 2 can resolve as an aggregate battle without ever touching Tier 0).
* Promotion never discards data: a Tier 3 regiment record carries enough
  (roster, casualties-to-date, morale, equipment) to reconstruct full Tier 0
  soldiers on promotion, and demotion collapses individual state back into
  the aggregate record rather than dropping it.
* Numeric thresholds above are starting points, not physics — they get tuned
  against real frame timing once Tier 0/1 are implemented and profilable.

## 4. Rendering

* **`MultiMeshInstance3D`** is the default renderer for any population that
  scales with unit count: soldiers, muskets/bayonets, cannonballs, smoke
  puffs, debris. One `MultiMeshInstance3D` per (unit type × faction ×
  animation-pose bucket), transforms written from Tier 0/1 unit data each
  frame (or at reduced rate for Tier 1).
* Animation: individually-skinned soldiers aren't affordable at this scale.
  Plan on **GPU texture-baked animation** ⚑ (bone transforms baked to a
  texture, sampled per-instance in a custom vertex shader keyed by instance
  ID + animation phase) rather than per-instance `AnimationPlayer`/skeletons.
  This is a real engineering task, not a default — call it out early when
  building the unit renderer.
* Individual `Node3D`s/`CharacterBody3D`s are reserved for entities that are
  always few in number and need full engine-level physics/interaction: the
  player, officers/named characters, ships, buildings, wagons.
* Terrain: standard Godot terrain/heightmap approach with cell-based LOD
  meshing; not naval-specific (naval terrain = coastal cells + open-water
  cells with no meshing needed beyond a sea-level plane and wave shader).

## 5. Data Architecture

* Data-oriented, manager-owned. No per-soldier `Node`. Managers (autoloads,
  see `CLAUDE_RULES.md` §2):
  * `UnitManager` — flat arrays of soldier state (position, health, morale,
    ammo, formation slot, weapon) for Tier 0/1 units, plus the Tier 2/3
    aggregate regiment records.
  * `ArmyManager` — regiment/brigade/army composition, chain of command,
    faction ownership, current orders, world-graph position.
  * `ShipManager` — vessel state, crew assignment, cargo, damage.
  * `WorldGrid` — cell registry, streaming state, settlement/economy links
    per cell.
* Cross-references between managers are by integer ID/handle, not node
  reference — Tier transitions and streaming can invalidate node existence,
  they can never invalidate a data record.

## 6. AI: Line-of-Sight & Logic

* LOS checks are the classic AI cost at this scale — never per-unit-per-frame
  raycasts. Batch them: group pending LOS queries by tier and run them as a
  single batched job (candidate for GDExtension — see §7) on a cadence tied
  to that unit's tier update rate, not every frame.
* Spatial partitioning (grid, matching the world streaming cells or a finer
  sub-grid) narrows LOS/detection candidates before any raycast runs —
  broad-phase culling by cell distance, then fine raycast only for what
  survives the broad phase.
* Tier 0/1 units run individual behavior-tree/state-machine AI. Tier 2/3
  regiments run a much simpler strategic AI (march toward objective, engage
  if opposed, retreat if morale collapses) — this is the same
  aggregate-vs-individual split as §3, applied to decision-making instead of
  physics.

## 7. GDExtension Boundary (concrete candidates)

Per `CLAUDE_RULES.md` §5 — GDScript first, move to C++ only once profiled.
Likely first candidates, in rough priority order once profiling confirms:
1. Batched LOS/ballistics raycasting (§6) — highest volume, tightest inner
   loop.
2. Tier 0/1 per-unit physics/movement integration — position updates,
   formation-slot resolution, collision-avoidance for hundreds of bodies.
3. `MultiMeshInstance3D` transform buffer writes for large instance counts,
   if GDScript-side buffer construction shows up as a bottleneck.
* AI *decisions* (what a unit should do) stay in GDScript even after their
  *execution* (physics, raycasts) moves to C++ — keeps behavior tunable and
  debuggable without a recompile.

## 8. Threading

* Tier 1/2/3 updates (and batched LOS jobs) are designed to run on
  `WorkerThreadPool` from the start: compute reads a snapshot of relevant
  state, produces a result buffer, and the main thread applies results in a
  single pass. No Node-tree access from worker threads, ever.
* Tier 0 (engaged combat near a player) is latency-sensitive and stays
  main-thread/physics-tick, at least until profiling says otherwise.
* On the host, per-client snapshot building (§9) runs as its own worker-pool
  job per connected client — computing what each client's interest set
  contains is itself a batchable, off-main-thread task.

## 9. Multiplayer & Networking

Session-based co-op: a small group of players ⚑ (target 2–16) join one
host's session over **ENet**. No dedicated server binary, no persistent
shared world, no matchmaking backend — the host *is* the session, same as
the old prototype, scaled up to the full open world instead of one battle.

* **Host-authoritative.** The host runs the entire simulation — all LOD
  tiers, all factions, the full world — exactly as it would in single-player.
  Clients are thin: they render, capture input, and send *requests*. The
  host is the only place game state is decided.
* **Client-side prediction, host reconciliation** applies specifically to
  each client's own player character (movement, aiming, reload timing) —
  the one place raw host round-trip latency would otherwise be felt directly
  as input lag. Everything else (AI units, other players, ballistics
  outcomes) a client only ever *observes* via replication; it never predicts
  another entity's simulation.
* **Interest management.** Each client has an interest set — roughly, Tier
  0/1 entities within its own streaming rings (§2) plus anything it's
  been explicitly told about (e.g. a courier order in flight to it). The
  host computes this per client and only replicates what's in it. A fight
  happening across the map that no client is near still runs at full Tier 0
  fidelity on the host (§3) but sends nothing over the wire until a client's
  interest set reaches it.
* **Channels:**
  * *Unreliable, high-frequency:* transform snapshots for Tier 0/1 entities
    in a client's interest set (target snapshot rate ⚑ 10–20 Hz — separate
    from the host's internal Tier 0 physics-tick rate).
  * *Reliable, event-driven:* shots fired, casualties, morale breaks/routs,
    orders issued (voice/drum/courier — see `06_player_character_ui.md`),
    players joining/leaving, ownership/command changes.
* **Command authority.** Each player owns their own company (§9a) and is
  its default commander. If players choose to share a single company
  instead (one host-created regiment, multiple players commanding pieces
  of it), who can issue orders to what is host-arbitrated state (role/rank
  assignment, not a client-side assumption) — full rules belong in
  `06_player_character_ui.md`, but the host is where authority checks
  happen, same as order *validity* is checked in single-player against
  command radius/courier delivery.
* **What doesn't change from single-player:** the LOD tiers, data
  architecture (§5), and GDExtension boundary (§7) are identical in both
  modes. Multiplayer adds a replication layer on top of the same simulation
  — it is not a second simulation model to keep in sync with the first.

### 9a. Portable Player Companies

Each player's character and company (regiment/fleet roster, personal
ledger — `02_mercenary_economy.md` §1) are **owned by that player, not by
any host's world.** A player builds this up over any session — solo or as
a host — and brings the same company into a friend's session later. This
is a second, orthogonal kind of persistence alongside the host's own world
save (`04_seamless_world_sim.md` §5):

* **World save** (host-owned): settlement/economy state, faction AI armies,
  contract offers, terrain-level events — everything that describes *that
  world*. Stays on the host's machine, per `04_seamless_world_sim.md` §5.
* **Company save** (player-owned): that player's character, their
  regiment/fleet roster and its current condition (strength, morale,
  equipment, casualties-to-date), and personal ledger — everything that
  describes *that player's progress*, independent of which world it was
  earned in. Lives on the player's own machine.
* **Join flow:** connecting to a host uploads the player's company record.
  The host imports it into its live `ArmyManager`/`ShipManager` (§5) as a
  normal army/fleet entity — same data shape as a faction AI army, just
  tagged with an owning-player ID instead of a faction. From that point the
  host simulates it exactly like anything else (§3-§8) — no special-cased
  "guest unit" combat path.
  * A joining player's company is superimposed onto the host's world at a
    sensible entry point ⚑ (e.g. the host's current position, or a
    designated muster point) — it isn't retroactively part of that world's
    history (its earlier battles happened in a different world/session).
* **Export flow:** on graceful disconnect or session end, the host sends
  the player's entity back to them with its current state (survivors,
  casualties, morale, equipment/loot gained), and the client overwrites its
  local company save — this is what makes losses in a friend's world "real"
  for that player's regiment, not a sandboxed loaner copy.
* **Crash/ungraceful disconnect** ⚑: rather than depending on the export
  handshake completing, the host periodically checkpoints each connected
  player's company state back to that client during the session (same
  cadence as the world autosave, §2) — a hard crash loses at most that
  checkpoint window, not the whole session's progress. First-pass, not
  committed — see open questions below.
* **What's per-world vs. portable, precisely:** roster/equipment/personal
  cash/character are portable (above). Faction standing/reputation and
  active contracts are **host-world-local** ⚑ — they describe a
  relationship with *that world's* faction AI state
  (`02_mercenary_economy.md` §2, §7), so a player's reputation in their own
  game and in a friend's world are independently tracked, not merged. This
  keeps "who I am" (character/company) portable while "what's happened in
  this world" (politics, contracts, settlement state) stays that world's
  own history.

## 10. Open Questions for Later Passes

* Target minimum spec / platform — affects every ⚑ number above.
* Save-file format and scope (is the whole world state saved, or only
  deltas from a static baseline?) — depends on `04_seamless_world_sim.md`.
  In co-op, whose machine/save the session state lives on between sessions
  (the host's) also needs stating explicitly somewhere player-facing.
* How naval Tier assignment works when a fleet is mid-ocean far from any
  cell with meaningful content — likely a coarser grid for open water,
  detailed in `05_naval_simulation.md`.
* Exact player-count ceiling and whether it's fixed or tunable — affects
  interest-management cost (§9) and is worth revisiting once Tier 0/1 have
  real profiling data. Note this now scales with *guest company size* too
  (§9a) — several players each bringing a full regiment into one session
  is a bigger Tier 0/1 load than the same session with host-only forces.
* Company-save checkpoint cadence and conflict handling (§9a) — what
  happens if a player's local save is stale/edited relative to the host's
  last checkpoint of them (e.g. they crashed, then rejoin later with an
  older local copy). Needs a concrete reconciliation rule once §9a has a
  first implementation.
* Entry point/muster logic for a joining player's company (§9a) — a UX
  question for `06_player_character_ui.md` as much as an architecture one.
