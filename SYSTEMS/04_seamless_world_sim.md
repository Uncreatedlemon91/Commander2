# 04 — Seamless World Sim

The strategic layer: why armies are where they are, how the world keeps
moving whether or not a player is watching, and how the world persists.
Sits above `03_tactical_battalion_ai.md` (which owns *how* a fight plays
out) and drives the settlement/supply state in `02_mercenary_economy.md`.
Built on `01_technical_architecture.md`'s cells and LOD tiers.

> ⚑ marks a first-pass number/mechanic, not a commitment.

---

## 1. The World Graph

* Layered on top of the 1:1 open world (`01_technical_architecture.md` §2):
  a **road/river/coastal-route graph** connecting settlements, ports, and
  rail-era-equivalent junctions — the same network the old prototype's
  campaign map used for AI routing, but now the *actual terrain*, not an
  abstracted map screen. Players walk/ride the real ground; the graph is
  what AI armies path along and what §2's routing logic reasons over.
* Roads/rivers grant march speed bonuses (matches
  `GAME_VISION.md`'s "faster on the roads" precedent) and are why armies
  cluster along historically real corridors instead of beelining through
  wilderness.
* The graph is authored/derived data (`scripts/data/`), not something
  armies build at runtime — content work, not an architecture task.

## 2. Army Routing & Strategic AI

* Every army (Tier 2/3 aggregate, per `01_technical_architecture.md` §3)
  has a **strategic goal** ⚑ assigned by its faction AI: garrison a
  location, seize a junction/port, raid enemy supply, reinforce, or drive
  on an objective — the same goal categories the old prototype's campaign
  AI used, generalized from a fixed map to the open world.
* Pathing follows the world graph (§1) at the strategic layer; an army only
  leaves the graph for actual terrain-accurate movement once promoted to
  Tier 1/0 near a player or another force (`01_technical_architecture.md`
  §3) — this is the seam that makes "seamless" true: there's no mode
  switch, just a fidelity change on the same position data.
* **Faction-level AI** (above individual armies) allocates goals to armies
  based on the strategic picture — contested settlements, front lines,
  supply state from `02_mercenary_economy.md` §4 — on a slower tick ⚑ (this
  is Tier-3-adjacent in cost: it reasons over aggregate records, not
  per-soldier data, so it doesn't need per-frame or even per-second
  updates).

## 3. Dynamic Events

* **Encounters**: two opposing armies whose paths cross resolve via
  `03_tactical_battalion_ai.md` §7's Tier 2 aggregate combat model if no
  player is nearby, or promote to a live Tier 0 fight if one is — no
  separate "encounter system," it's the same tier-promotion mechanism
  applied to AI-vs-AI contact.
* **Scripted/historical events** (a specific battle's historical date,
  weather, or arrival of reinforcements) are data-driven triggers layered
  on top of the live simulation — content authored against this system,
  not a parallel scripted-sequence engine. Whether/how strictly historical
  battles are pinned to real dates/locations vs. emergent from faction AI
  is a content-design choice for later, not resolved here.
* **Weather**: per-region conditions affecting visibility (feeds
  `03_tactical_battalion_ai.md` §6 fog-of-war spotting ranges) and possibly
  march speed/naval wind (`05_naval_simulation.md`) — seeded and
  server/host-authoritative like the old prototype's approach, so it's
  identical for every connected client.

## 4. World-Scale Fog of War

* Same principle as `03_tactical_battalion_ai.md` §6, applied at the
  strategic layer: a faction's knowledge of enemy army positions/strength
  is per-faction and decays/is refreshed by actual friendly
  units/settlements nearby — not omniscient AI, and not omniscient for the
  player either. Matches the old prototype's "enemy columns visible only
  near your armies and towns" precedent.
* This is what makes raiding/interdiction (cutting supply routes,
  ambushing marching columns) meaningful — an enemy player or AI faction
  genuinely doesn't know a raiding force is coming until something of
  theirs spots it.

## 5. Persistence

There are **two separate save scopes** (`01_technical_architecture.md`
§9a) — don't conflate them:

* **World save** (host-owned): settlement ownership/economy state
  (`02_mercenary_economy.md` §6), faction army rosters/positions/strength,
  contract state, world-graph-derived event history. Per
  `01_technical_architecture.md` §2, this autosaves on a timer plus
  significant events, and lives on the host's machine — there's no central
  server copy. Rejoining a session means rejoining that host's saved
  world, not pulling from a persistent backend; this should be stated
  clearly to players (the world, and its state, is only as available as
  the host is), not left implicit.
* **Company save** (player-owned): each player's own character and
  company state (`02_mercenary_economy.md` §1) is *not* part of the world
  save — it's checked in/out of whatever world they're playing in, per
  `01_technical_architecture.md` §9a, and persists independently of any
  particular host. A player who never returns to a given friend's world
  keeps their character/company progress regardless — it isn't stranded
  in that world's save file.
* A host's own company (when they're playing their own world) is really
  just the local-host special case of the same company-save mechanism —
  there's one save format for "my company," whether I'm hosting or
  guesting.
* Terrain/static world content isn't saved (it's authored/generated, not
  simulated); only the dynamic layer (§2's armies, §1... no — armies and
  settlements, not the graph itself, which is static content) needs to
  round-trip through a save.

## 6. Open Questions for Later Passes

* How tightly historical events/dates are pinned vs. left emergent (§3) —
  a content-design call, revisit once faction AI (§2) is playable enough
  to judge how well it produces historically-flavored outcomes on its own.
* Whether faction AI needs to be deterministic/replayable for debugging at
  this scale, given it's aggregate-level and host-authoritative anyway
  (likely not required, but worth confirming once §2 exists).
* Save file format/versioning strategy as the world-graph/settlement data
  set grows — a production concern once §5 has a first implementation to
  version.
