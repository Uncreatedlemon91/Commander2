# 02 — Mercenary Economy

Contracts, payroll, supply, trade, recruiting, and equipment — the systems
behind `GAME_VISION.md`'s progression from lone mercenary to regiment-and-
fleet commander. Built on the data architecture in
`01_technical_architecture.md` §5 and feeds unit quality/morale into
`03_tactical_battalion_ai.md`.

> ⚑ marks a first-pass number/mechanic, not a commitment.

---

## 1. Player Economic State

* **Personal ledger**: cash on hand, owned equipment/ships, and (once above
  lone-mercenary scale) a **company treasury** separate from personal cash
  — payroll and supply draw from the company treasury, not the player's
  pocket directly, so running a regiment at a loss is a real failure state,
  not just a number going down.
* **This ledger is company data — it's player-owned and portable**, per
  `01_technical_architecture.md` §9a: it travels with the player into
  whatever session/world they join, independent of any specific host's
  world. **Faction standing/reputation is the one exception** — it's
  tracked per-world (§7), since it describes a relationship with that
  world's specific faction AI state, not a property of the character.
* Progression gates (per `GAME_VISION.md` §4) are economic thresholds as
  much as narrative ones: hiring a squad, commissioning a first sloop, and
  eventual regiment/fleet command are things the economy has to actually
  make affordable-but-hard at the right pace — this doc's balance
  responsibility, not just a stat unlock.

## 2. Contracts

* Each faction (`GAME_VISION.md` §3: Continental Army, Crown, Indigenous
  Nations, local militias/privateers) offers contracts: escort, garrison,
  raid, supply-running, direct-battle subcontracting. A contract specifies
  payment terms, duration/objective, and standing consequences for success,
  failure, or breach.
* **Contracts are data-driven** (`scripts/data/`, per `CLAUDE_RULES.md`
  §2), generated from templates against current world state (a faction
  under pressure near a given town offers defense contracts there) rather
  than hand-placed one-offs — this is what keeps the economy live across a
  1:1-scale, seamless world instead of a fixed quest list.
* **Reputation is per-faction and consequential**: taking a contract
  against a faction you're also contracted to, or breaching terms, damages
  standing with that faction and (situationally) its allies. Simultaneously
  holding contracts with opposed factions should be *possible* (mercenary
  sandbox pillar) but not free of tension — the game shouldn't quietly
  prevent contradictions, it should let them create consequences.

## 3. Payroll & Morale Link

* Recruited troops draw wages on a cadence ⚑ (weekly, in-world time) from
  the company treasury. Unpaid wages aren't just a debt counter — feed
  unpaid status directly into the morale model
  (`03_tactical_battalion_ai.md` §4) as a holding-morale penalty, so a
  mercenary company that can't make payroll actually gets worse at
  fighting, not just narratively "unhappy."
* **Disease and rations** (per `GAME_VISION.md` §2/§3) work the same way:
  an under-supplied regiment accrues attrition (non-combat losses) and a
  fatigue/morale penalty over time, tied to the supply-chain state in §4 —
  this is a second lever besides pay that keeps a standing force expensive
  to maintain, matching the "hour-to-hour: managing troop payroll,
  rations, disease" loop from the vision doc.

## 4. Supply Chains & Settlement Economy

* Core tracked goods ⚑: black powder, iron, food, medicine (per
  `GAME_VISION.md` §3) — enough to drive meaningful scarcity without
  needing a deep trade-sim goods list on day one; more goods (rum, cloth,
  horses, etc.) can extend this table later without changing the model.
* Each settlement (owned by `WorldGrid`/cell data,
  `01_technical_architecture.md` §5) has production and consumption rates
  per good, producing a local price that drifts with the balance
  (shortage → price up, surplus → price down) — real-time, not
  turn-based, matching the seamless-world pillar.
* **Supply is spatial, not abstract**: goods move between settlements along
  the same road/sea network armies use (feeds `04_seamless_world_sim.md`),
  so a road cut by enemy raiding or a captured port has a real, visible
  effect on prices and availability downstream — not a hidden global
  formula.
* War pressures this system directly: an army camped near/occupying a
  settlement consumes local supply (feeds §3's ration mechanic for that
  army), and battles damage/disrupt production (a burned depot, a captured
  warehouse) with lasting effect until rebuilt, not an instant-reset stat.

## 5. Trade & Recruiting

* **Trading** goods and arms happens at settlements, priced per §4's live
  supply/demand — buy low where a good is in surplus, sell/use it where
  scarce. No fixed global price list.
* **Recruiting**: settlements draw from a finite local manpower pool (per
  the old prototype's precedent, carried forward as a proven mechanic) —
  recruiting drains it, and it regenerates slowly, so raising a large
  force is a real drain on the region it's raised from, not a free action
  gated only by cash.
* **Equipment purchases**: weapons/kit availability is itself tied to §4's
  supply model (a settlement low on iron/black powder can't fully arm
  recruits) rather than a separate always-available shop — keeps the
  "purchase arms" loop from `GAME_VISION.md` §2 connected to the rest of
  the economy instead of floating free of it.
* **Ship commissioning** (sloops/schooners early, larger vessels later per
  `GAME_VISION.md` §4): built/bought at coastal settlements with shipyard
  capacity, gated by cost and (for larger ships) settlement
  size/infrastructure — detailed hull/rigging specifics belong to
  `05_naval_simulation.md`; this doc owns only the economic
  acquisition/maintenance side.

## 6. Data & Simulation Ownership

* A new manager, `EconomyManager` (extends the set in
  `01_technical_architecture.md` §5): owns per-settlement supply/demand
  state, price curves, manpower pools, and active contract records. Reads
  world-graph connectivity from `WorldGrid` for supply routing (§4).
* Settlement economic state updates on a tick ⚑ (not every frame — this is
  Tier-2/3-adjacent in cost, regardless of a settlement's own combat LOD
  tier) independent of whether any player is nearby, since prices/supply
  need to keep drifting in a seamless world even when unobserved.

## 7. Multiplayer

* **Company treasury and roster are per-player, portable data** —
  `01_technical_architecture.md` §9a. Each connecting player brings their
  own company; a session can have several independently-owned companies
  active at once (the host's plus each guest's), not one shared purse by
  default. Players can still choose to run one shared company instead (all
  contributing to a single treasury, one player's roster), but that's an
  opt-in arrangement arbitrated by command authority
  (`06_player_character_ui.md` §4), not the default assumption.
* **Faction standing/reputation and active contracts are host-world-local**
  (`01_technical_architecture.md` §9a) — they're generated against and
  describe a relationship with *that specific world's* faction AI/settlement
  state (§2, §4), so a player's standing and available contracts differ
  between their own world and a friend's, and don't merge or average
  together. A guest accepting a contract in a host's world is accepting it
  under that world's faction standing, not importing their own.
* **Payroll/supply while a guest**: a joining company's payroll and ration
  draw (§3) keep running against *its own* portable treasury and stock, not
  the host's — a guest short on cash can't make payroll off the host's
  economy, and vice versa. Trading (§5) between a guest's company and the
  host's world settlements is just normal settlement trade, open to
  whichever company is present and transacting.

## 8. Open Questions for Later Passes

* Exact goods list beyond the four core ones, and price-curve tuning —
  content/balance work once §4 is implemented and playable.
* Whether AI factions run the same supply/settlement simulation the player
  interacts with, or a cheaper approximation for settlements far from any
  player — likely mirrors the Tier system's logic
  (`01_technical_architecture.md` §3) but needs its own pass once §6's
  tick model exists.
* How ship maintenance cost (upkeep, repair) factors into payroll (§3) —
  revisit alongside `05_naval_simulation.md`.
