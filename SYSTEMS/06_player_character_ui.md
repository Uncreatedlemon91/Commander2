# 06 — Player Character & UI

Everything the player directly touches: first-person movement and combat,
the reload sequence, ship interaction, and how a player who's also an
officer issues orders. Depends on `03_tactical_battalion_ai.md` (weapon
data, formation/command model) and `01_technical_architecture.md` §9
(multiplayer authority) — read those first.

> ⚑ marks a first-pass number/binding, not a commitment.

---

## 1. First-Person Controller

* Standard FPS movement (walk/run/crouch/prone ⚑ — prone TBD pending how
  it interacts with formation membership; a soldier in formation may not
  be able to go prone without breaking the formation model in
  `03_tactical_battalion_ai.md` §2) plus a **stamina** stat shared with the
  fatigue model in `03_tactical_battalion_ai.md` §4 — sprinting, melee, and
  standing in a firefight all draw it down; it's the same fatigue number
  the AI soldiers use, not a player-only mechanic.
* The player is a **Tier 0 entity always** (`01_technical_architecture.md`
  §3) — never abstracted, regardless of what's simulating around them.
* When the player is inside a formation (a rank-and-file soldier, not an
  officer riding free), movement is constrained toward their formation
  slot the same way an AI soldier's is (`03_tactical_battalion_ai.md` §2) —
  the player can break formation deliberately (step out of line), but doing
  so has the same cohesion/morale cost an AI soldier leaving formation
  would.
* Officers (including a player acting as one) aren't formation-bound —
  they're the free-roaming avatar model the old prototype used, carried
  forward: ride/walk anywhere, command radius follows them (§4).

## 2. Weapon Handling & Reload

* Reload is an explicit **multi-step input sequence**, not a single
  "press R" action — matches `03_tactical_battalion_ai.md` §3's
  simulation-side step model exactly, so player and AI reload pacing stay
  comparable. Baseline steps ⚑: tear/bite cartridge → prime pan → pour
  charge → seat ball → ram → return ramrod → present/cock. Each step is a
  distinct input (context-sensitive single button, e.g. left-click/RT
  advances the current step) with its own timing rather than one long
  animation the player just waits out — mistakes/interruption (see below)
  matter because the player is tracking discrete steps.
* **Interruption**: taking damage, sprinting, or an incoming melee threat
  mid-reload should be able to break the sequence (dropping progress back
  to the start of the current step, not the whole reload ⚑) — this is what
  makes reload timing a real tactical vulnerability rather than a fixed
  animation lock.
* **Aiming/firing**: black-powder accuracy model from
  `03_tactical_battalion_ai.md` §3 applies to the player identically — no
  player-favoring hitscan precision the AI doesn't also get. Sway/hold
  steadiness scales with stamina (§1) and (if standing in formation) with
  the unit's cohesion state.
* **Melee**: bayonet (musket-mounted, works from the reload-complete or
  even mid-reload state — historically bayonets stayed fixed through
  reloading), saber (officers/cavalry), hand-to-hand as a last-resort
  fallback. Simple directional/timing-based combat ⚑ — this project's
  identity is black-powder marksmanship and command, not a deep melee
  system, so keep this lightweight rather than building a fighting-game
  layer.

## 3. Command HUD (Player as Officer)

* **Command radius** (from `03_tactical_battalion_ai.md` §5): units inside
  it get orders instantly; the HUD should make that radius legible (e.g. a
  ground-plane indicator or unit-icon state showing "in command range" vs
  "requires courier") so the player understands *why* an order they just
  gave hasn't executed yet.
* **Order issuing** — three channels, matching `GAME_VISION.md`'s
  "voice, drum signals, and physical couriers":
  * **Voice**: short-range, near-instant, for units in/near command radius
    — simple contextual command (advance, halt, fire, fall back, formation
    change) issued via a radial/quick-select UI, not typed/voice-recognized
    text.
  * **Drum**: formation-level signals (advance, retreat, rally, cease fire)
    audible at longer range than voice but still local-area — the
    historical mechanism for line-wide commands without a courier's delay,
    at the cost of also being audible to the enemy.
  * **Courier**: for out-of-radius units. Dispatching one is a real action
    (not an instant menu command) — the HUD shows the order in transit,
    travel-time estimate, and risk if the route crosses contested ground,
    consistent with the simulation-side courier model in
    `03_tactical_battalion_ai.md` §5. Whether the courier is an AI-driven
    NPC the player dispatches or (co-op) another player physically riding
    the order over is a design choice — default to AI-driven courier ⚑
    with a co-op player able to volunteer/ride escort, not required to
    personally hand-carry every order.
* **Unit status at a glance**: formation state, morale state, ammo,
  cohesion — pulled directly from `UnitManager`/`ArmyManager`
  (`01_technical_architecture.md` §5), not a UI-side shadow copy of that
  data.

## 4. Multiplayer-Specific UI

* **Session join / bring-your-company flow**: before entering a friend's
  world, the player picks which local company to bring (per
  `01_technical_architecture.md` §9a) — a simple select screen, not a
  character creator each time. The host briefly reviews/approves incoming
  companies (a floor for "a stranger's oversized regiment doesn't just
  dump into my world uninvited" ⚑) before they're imported. On leaving,
  the UI should clearly confirm the company synced back successfully
  (§9a's export flow) before the player disconnects, since a mid-sync
  disconnect is the one place progress could be lost.
* Per `01_technical_architecture.md` §9, command authority defaults to
  each player commanding their own company; if players opt into sharing a
  single company, authority over it is host-arbitrated. The HUD needs a
  visible **role/rank indicator** in that shared case — who currently holds
  authority to issue orders to which units — so co-op players aren't
  guessing whether their order will actually apply.
* Other players render as Tier-0 entities with a friendly-identification
  marker (name/rank tag at reasonable range, not full ESP-style through
  walls) — visually they're dressed/animated the same as AI soldiers of
  their faction, per the `01_technical_architecture.md` §4 rendering model;
  no separate "player" render path.
* Voice comms (real player voice chat, not the in-fiction "Voice" order
  channel in §3) is a production/scope decision, not an architecture one —
  flagged for later, not assumed.

## 5. Ship Interaction

Detailed sail/wind/broadside simulation belongs to
`05_naval_simulation.md`; this doc covers only the player-facing
interaction surface:

* **Rigging**: manual sail trim as a first-person interaction (climb to a
  station, adjust) rather than a menu slider — consistent with the
  "authentic" pillar, though the exact input scheme is naval doc's call
  since it depends on the sail model chosen there.
* **Wheel**: direct first-person helm control, heading tied into the wind
  model from `05_naval_simulation.md`.
* **Cannon crews**: the player can crew a gun directly (aim/load/fire, on
  the same multi-step-loading philosophy as §2's musket reload, scaled to
  a crew-served weapon) or command an AI crew via the same order-issuing
  model as §3, scoped to that gun.

## 6. Menus & Meta-UI

* Contract/payroll/trade/recruiting screens belong conceptually to
  `02_mercenary_economy.md` — this doc owns only that they're presented as
  diegetic-where-reasonable interfaces (a ledger, a recruiter's table)
  consistent with the first-person, no-loading-screen pillar, not a
  full-screen menu that yanks the player out of the world. Exact screen
  layouts are a later content pass.

## 7. Open Questions for Later Passes

* Exact input bindings (keyboard/mouse + gamepad parity) — a content task
  once the reload/command interactions above are prototyped and feel
  right, not an architecture decision.
* Prone/crouch interaction with the formation model (§1) — needs the
  formation system built before it can be answered concretely.
* Whether courier dispatch can be delegated to a co-op player as a
  distinct "courier" role vs. always AI-driven (§3) — revisit once co-op
  session flow (`01_technical_architecture.md` §9) has a player count
  target to design roles around.
