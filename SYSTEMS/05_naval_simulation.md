# 05 — Naval Simulation

Age-of-Sail ship physics, wind, broadsides, and boarding. Reuses the LOD
tiers (`01_technical_architecture.md` §3), ballistics/morale model
(`03_tactical_battalion_ai.md`), and command/order model
(`03_tactical_battalion_ai.md` §5, `06_player_character_ui.md` §3) rather
than inventing parallel systems — a ship engagement is the same kind of
event as a land battle, on water.

> ⚑ marks a first-pass number/mechanic, not a commitment.

---

## 1. Scope & Tier Mapping

* A **ship** is a Tier 0 entity whenever a player is aboard or nearby, same
  rule as officers in `01_technical_architecture.md` §4 — always
  individually simulated at that point, never abstracted mid-engagement.
* A **fleet** away from any player behaves like an army in
  `04_seamless_world_sim.md` §2: Tier 2/3 aggregate (strength, condition,
  position on the world's sea-lane graph — the maritime extension of
  `04_seamless_world_sim.md` §1's road/river graph), promoted to Tier 0/1
  the same way a land force is when a player or opposing force closes
  distance.
* Open water gets a **coarser world-streaming grid** ⚑ than land cells
  (`01_technical_architecture.md` §2) — mostly featureless, no static
  dressing to stream, so cell size there can be much larger without cost.

## 2. Wind Model

* A **wind field**: direction + strength, regionally varying and seeded
  per session/weather state (`04_seamless_world_sim.md` §3) so it's
  identical for every connected client, not per-client random.
* Wind isn't just a naval flourish — it feeds directly into §3 (a ship's
  actual speed/heading options depend on it) and should update on a slow
  drift/tick ⚑ (real-time but gradual — sudden flips would fight the sail
  micro-management in §3 rather than create interesting decisions).

## 3. Sail Physics

* **Points of sail**: standard Age-of-Sail model — speed/handling depend on
  heading relative to wind (running, reaching, close-hauled), with head-on
  "in irons" as a real dead zone a ship can get stuck in, not smoothed
  over. This is the mechanical payoff of §2's wind model actually mattering.
* **Sail trim** is a real, adjustable state per ship (how much canvas is
  set), not just a speed slider — a player crews this manually
  (`06_player_character_ui.md` §5); an AI-crewed or Tier 1+ ship runs the
  same trim logic autonomously via its AI (§7).
* **Tacking/wearing** (changing heading through or away from the wind)
  takes real time and can be fumbled by a poorly-crewed ship — same
  "maneuvers take time and can go wrong" philosophy as formation changes
  in `03_tactical_battalion_ai.md` §2, applied to ships.
* Ships are data-defined (`scripts/data/`, per `CLAUDE_RULES.md` §2): hull
  class, sail area, top speed by point of sail, turning rate, cannon
  count/broadside arrangement, crew requirement, hull integrity.

## 4. Broadsides & Ship Combat

* Cannon crews reuse the crew-served-weapon model from
  `06_player_character_ui.md` §5 — multi-step loading, aimable within the
  gun's firing arc, player-crewable or AI-crewed.
* Damage model extends `03_tactical_battalion_ai.md` §3's ballistics
  approach to hulls: range/accuracy falloff, hit location mattering (hull
  vs. rigging vs. crew-exposed deck), with **rigging damage** reducing sail
  effectiveness (ties back into §3 — a dismasted or torn-up ship loses
  real maneuverability, not just an abstract "damage %") and **hull
  damage** risking sinking at some threshold ⚑.
* Broadside timing (a full side firing together vs. individual gun timing)
  mirrors the volley-vs-individual-fire distinction in
  `03_tactical_battalion_ai.md` §3 — a well-crewed ship can fire as a
  disciplined broadside; a battered/undercrewed one degrades to ragged
  individual gunfire.

## 5. Boarding

* Boarding is a **tier-local transition**, not a separate minigame system:
  once ships are grappled/adjacent, crew become Tier 0 individual
  combatants and fight using the exact melee/firearms model from
  `06_player_character_ui.md` §2 and `03_tactical_battalion_ai.md` — a
  ship's deck is just cramped, formation-less terrain for that fight.
* Crew complement (how many defenders/attackers are available) comes
  directly from the ship's crew data (§3) minus casualties already taken
  in the engagement — no separate boarding-party pool invented outside
  the ship's actual roster.
* Morale (`03_tactical_battalion_ai.md` §4) applies identically — a crew
  can strike their colors and surrender rather than fighting to the last
  man, same rout/rally logic as land combat, re-skinned as surrender.

## 6. Fleet Command

* Same command-radius/courier model as land
  (`03_tactical_battalion_ai.md` §5), adapted to maritime signaling: close
  ships respond to voice/speaking-trumpet range commands (the naval
  equivalent of §3's "voice" channel in `06_player_character_ui.md`),
  **signal flags** stand in for drum signals (fleet-wide maneuver commands,
  visible at range but requiring line of sight and a moment to read/hoist
  — a real delay, not instant), and a boat/courier ship fills the
  long-distance courier role for out-of-signal-range orders.

## 7. Naval AI

* Tier 0/1 AI-crewed ships run point-of-sail-aware navigation (using §3's
  model, not a simplified naval-specific movement system) plus a combat
  behavior state machine mirroring
  `03_tactical_battalion_ai.md` §7's unit states (approach, maneuver for
  broadside angle, exchange fire, close to board, flee/strike colors).
* Tier 2/3 fleet AI plugs into the same strategic layer as land armies
  (`04_seamless_world_sim.md` §2) — goals like blockade, escort, raid
  shipping, transport troops — using the sea-lane graph (§1).

## 8. Multiplayer

* No naval-specific exception to `01_technical_architecture.md` §9 — ships
  are host-simulated, client-predicted only for the local player's own
  immediate control input (helm/sail trim/gun aim they're personally
  working), same boundary as land movement in
  `06_player_character_ui.md` §1.

## 9. Open Questions for Later Passes

* Exact hull-damage/sinking thresholds and rigging-damage-to-speed curve —
  balance work once §3/§4 have a first playable implementation.
* How large a "coarse open-water cell" (§1) should be — needs real
  profiling data the same way land cell size does
  (`01_technical_architecture.md` §9).
* Whether weather (storms) can meaningfully endanger ships independent of
  combat (period-authentic, but a scope decision) — flagged, not
  committed, pending `04_seamless_world_sim.md`'s weather system maturing.
