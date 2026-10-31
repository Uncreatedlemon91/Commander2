# Roadmap

Each milestone ends in a **playable or runnable proof**: something you can
launch and see, not just merged code. The order goes from the most foundational and
most technically risky work to the rest. The full open world, economy, naval and
co-op come after the core simulation is proven at scale.

| # | Milestone | Proof of done | Status |
|---|---|---|---|
| M0 | **Bootstrap** | Godot project with the agreed layout. `godot --headless` smoke test passes in CI on every PR. Flagged ⚑ assumptions confirmed. | **Current** |
| M1 | **Walk the ground** | First-person controller walking a single 1km cell of low-poly terrain with placeholder dressing. | Planned |
| M2 | **One musket** | Multi-step reload and a ballistic shot that hits a target. Feels right in-editor. | Planned |
| M3 | **A company in line** | `UnitManager` flat arrays + MultiMesh rendering of 200+ soldiers holding formation and marching. Frame-time budget recorded. | Planned |
| M4 | **First volley** | Two companies exchange volleys: per-shot ballistics, casualties, morale, a rout. Headless benchmark tracked in CI. | Planned |
| M5 | **Tiers & streaming** | Multiple cells streaming in rings. Units promote and demote across Tier 0–3 without losing data. A fight resolves as the player approaches. | Planned |
| M6 | **Two players** | Host plus one client in the M5 scene over ENet, with interest-managed snapshots and own-character prediction. | Planned |

After M6 (to be ordered later): contracts and economy (02), world graph and
strategic AI (04), naval (05), command HUD and couriers (06), portable
companies (01 §9a).

## Tooling track (runs in parallel)

| # | Item | Status |
|---|---|---|
| X0 | `PROJECT/` tracking conventions | Done |
| X1 | Read-only web dashboard (mobile + desktop) over `PROJECT/` + GitHub | Planned |
| X2 | Dashboard actions: send task to Claude, capture ideas, approve | Planned |
| X3 | Scheduled autonomy with limits, status reports, usage tracking | Planned |
