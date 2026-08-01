# 03 — Tactical Battalion AI

Governs how individual soldiers, formations, and regiments fight — ballistics,
morale, line tactics, and the AI driving everyone the player doesn't control
directly. Built on the LOD tiers and data architecture in
`01_technical_architecture.md`; read that first, especially §3 and §5.

> ⚑ marks a concrete number/mechanic I picked to make this decidable. Correct
> freely — these are first-pass balance targets, not commitments.

---

## 1. Scope by Tier

This doc's fidelity split follows `01_technical_architecture.md` §3 directly:

* **Tier 0 (Engaged):** everything below in full — per-soldier ballistics,
  formation slot physics, individual morale contribution.
* **Tier 1 (Nearby):** formation/movement/cohesion simulated per §3-5 below,
  but no per-shot ballistics — units here haven't opened fire yet.
* **Tier 2 (Active-distant):** none of the per-soldier model applies. A
  regiment is one agent with aggregate strength/morale/ammo; combat between
  two Tier-2 forces resolves via the **aggregate combat model** (§7), not by
  running a statistical soldier-by-soldier sim. This is what lets two AI
  armies fight each other far from any player without spending Tier-0
  compute on it.
* **Tier 3 (Dormant):** no combat resolution at all; a Tier 3 force can't be
  attacked because nothing is close enough to attack it — it gets promoted
  to Tier 2 first (per §3 of the architecture doc) the moment that changes.

## 2. Formation System

* Formation types ⚑: **Line** (max firepower, min frontage protection),
  **Column** (fast march, vulnerable to fire — historically the "caught in
  column" disaster), **Skirmish order** (open, hard to hit, low firepower
  density, used to screen), **Square** (anti-cavalry, immobile, very low
  firepower — infantry only, formed reactively).
* Each Tier 0/1 soldier occupies a **formation slot**: an offset from the
  unit's anchor point, resolved by the formation type. Individual soldiers
  path to their slot rather than being teleported into it — visible drill,
  not a snap.
* **Formation changes take time** ⚑ (20+ seconds baseline, faster with a
  disciplined officer — matches `GAME_VISION.md`'s emphasis on authentic
  drill). A formation mid-change is in a degraded state: reduced firepower,
  no cohesion bonus, vulnerable — this is what makes catching an enemy
  transitioning formation tactically meaningful rather than cosmetic.
* **Cohesion**: how tightly a unit's actual soldier positions match their
  ideal slots. Casualties, terrain, and fatigue degrade cohesion; cohesion
  below a threshold ⚑ suppresses fire rate and accelerates morale loss (§4)
  — a ragged line fights worse than a dressed one, without needing a
  separate "quality" stat to hand-wave it.
* **Wheeling** (pivoting a line about an anchor point) is a formation
  maneuver like any other, gated by the same drill-time rule, not an
  instant rotation.

## 3. Ballistics

* **Weapons are data**, not hardcoded — a `Resource`-based table (range,
  accuracy, reload time/step count, reliability, damage) per
  `CLAUDE_RULES.md` §2 `scripts/data/`. Historical weapon stat tables are
  a content task, not an architecture one; this doc defines the model they
  plug into.
* **Multi-step manual reload** (per `GAME_VISION.md` pillar): reload is a
  sequence of discrete steps (bite cartridge, prime pan, pour charge, ram
  ball, prime/present) — see `06_player_character_ui.md` for the
  player-facing input sequence. AI soldiers run the same step sequence and
  timing internally (for consistent rate-of-fire pacing across a line) even
  though they don't need per-step player input.
* **Accuracy model**: range falloff (accuracy drops with distance, per-weapon
  curve), degraded by target's cover (woods, terrain), degraded further by
  the *firing* unit's cohesion/fatigue/morale state (§2, §4). Historical
  black-powder muskets are wildly inaccurate at range by design — this
  isn't a hitscan-precision shooter model.
* **Volleys**: Tier 0 units fire as a formation event (a line's soldiers
  fire within a short window of each other, not independently on their own
  timers) once formation-fire discipline allows it — individual fire
  (skirmish order, or a line that's lost cohesion) is per-soldier timed
  instead.
* **Damage/hit resolution modifiers**: flank and rear fire multipliers
  ⚑ (e.g. 1.5×/2× — a line has essentially no frontal armor advantage but a
  huge exposure difference by facing), column-vs-line vulnerability (a
  column presents a deep, narrow target — casualties concentrate instead of
  spreading across a firing line), cover reduction in woods/behind terrain.
* **Artillery**: same weapon-data model, plus canister at close range
  (multiple simultaneous hit resolutions per shot rather than one), and a
  visible/audible shell arc for indirect fire — ties into `battle_audio`-style
  synthesized positional sound from the old prototype's approach, worth
  carrying forward as a technique even though the prototype itself is gone.

## 4. Morale

* Per-soldier morale (Tier 0/1) aggregates to a **unit morale state**:
  *Steady → Wavering → Breaking → Routed*, plus *Rallying* as a recovery
  path back from Routed.
* Inputs to morale loss ⚑: casualties taken (rate matters more than total —
  a fast bloody volley hurts morale more than the same losses over a long
  fight), flank/rear fire, losing the commanding officer (see below),
  fatigue, being outnumbered/outflanked, friendly units nearby routing
  (morale is contagious along a line).
* Inputs to morale *holding*: officer leadership trait (§5), being on the
  attack and winning, friendly units nearby holding, terrain (defenders in
  cover hold better).
* **Routed** units stop obeying orders, flee away from the threat, and
  can't be directly commanded until they rally — matches the old
  prototype's "leaderless brigade issues no orders" precedent, generalized:
  routing is itself a form of losing command, not just a stat debuff.
* **Officer casualties**: officers (Tier 0 named entities, not aggregate
  soldiers) can be hit like anyone else. A unit that loses its officer goes
  leaderless for a recovery window ⚑ (order propagation stalls, rally is
  harder) until a successor takes over — this is a deliberate risk of
  leading from the front, for both AI officers and player characters
  acting as officers.

## 5. Officers, Orders & Command Propagation

* Every Tier 0/1 unit belongs to a chain of command (regiment → brigade →
  army), tracked in `ArmyManager` (`01_technical_architecture.md` §5).
* **Command radius**: units near their commanding officer's actual position
  respond to orders quickly; distant units receive orders via **courier**
  — physically simulated, can be intercepted/shot down in transit, arrives
  with a delay proportional to distance and terrain. This mechanic is
  simulation-side and applies identically whether the officer giving the
  order is AI or a player — see `06_player_character_ui.md` for how a
  *player* issues an order (voice/drum/courier) and
  `01_technical_architecture.md` §9 for how order-issuing authority is
  arbitrated among multiple players sharing a command.
* Courier routing avoids known enemy positions (per each side's fog of war
  — §6) but an unseen ambush can still catch one; a killed/captured courier
  means the order never arrives, not that it arrives late.

## 6. Fog of War & Detection

* Detection is **per-faction**, driven by the batched LOS system in
  `01_technical_architecture.md` §6: a unit is "spotted" for a faction once
  any of that faction's units has line of sight within spotting range.
* Spotting range is reduced by terrain (woods screen until close range),
  reduced further by accumulated battle haze (§3's fired-weapon smoke — see
  the visual/atmosphere note below), and by light level (dusk/dark, if a
  day/night or weather system is layered in later — flagged, not committed,
  pending `04_seamless_world_sim.md`).
* Firing gives away a unit's position for a duration ⚑ (~25s) even if it
  would otherwise be unspotted — you can hide, but not while shooting.
* AI decision-making (§7) only ever reacts to what its *own faction* has
  spotted, never to true state — this is what makes ambushes and flanking
  actually work instead of AI omnisciently reacting to the player.

## 7. AI Behavior

* **Tier 0/1 (individual unit AI):** a state machine per unit ⚑ (states:
  *Marching, Forming, Holding, Firing, Charging, Falling Back, Routed,
  Rallying*), driven by orders from its chain of command plus local
  triggers (enemy in range, taking heavy fire, officer down). Individual
  soldiers within a unit don't each run independent AI — they follow their
  unit's state and formation slot; only the unit-level state machine makes
  decisions.
* **Tier 2 (aggregate combat model):** when two Tier-2 forces come into
  contact, resolve the engagement on a tick ⚑ (not instantaneously) using
  the same *shape* of inputs as Tier 0 — relative strength, weapon quality,
  terrain, morale — collapsed into a formula instead of a physical sim.
  Casualties, morale shift, and outcome (hold/retreat/rout) get applied to
  the aggregate regiment record. If a player or any Tier-0/1 force closes
  distance mid-engagement, the fight promotes to Tier 0 with the aggregate
  state as its starting point (current strength/morale carried over) rather
  than resetting.
* **Strategic-layer decisions** (where an army marches, what it's trying to
  take) belong to `04_seamless_world_sim.md`, not here — this doc covers
  "how a fight plays out," not "why an army is where it is."

## 8. Open Questions for Later Passes

* Exact morale/cohesion formulas (weights for each input in §4) — needs a
  content/balance pass once there's a playable Tier 0 to tune against.
* Whether Tier 2 aggregate resolution needs to be replayable/deterministic
  for multiplayer consistency, or whether host-authoritative resolution
  (host computes once, broadcasts the outcome) is sufficient — likely the
  latter per `01_technical_architecture.md` §9, but worth confirming once
  §7's tick model is implemented.
* Cavalry-specific behavior (scouting doctrine, charge rules against
  formed vs. broken infantry) — the old prototype had a strong version of
  this; worth revisiting as a concrete reference once this doc's core loop
  is built.
