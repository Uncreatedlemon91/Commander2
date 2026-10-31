# Commander2

A first-person, open-world Revolutionary War simulator: rise from a freelance
mercenary to the commander of a private regiment and naval fleet across a
seamless, 1:1 scale simulation of the Thirteen Colonies.

See [GAME_VISION.md](GAME_VISION.md) for the full design pillars, gameplay
loops, world scope, progression model, and technical principles. Detailed
sub-system specs live under `SYSTEMS/`.

Built with **Godot 4.x** (GDScript, strictly typed) with C++/GDExtension
planned for performance-critical sub-systems (1:1 unit AI, physics batching).
See [CLAUDE_RULES.md](CLAUDE_RULES.md) for coding standards.

## Documentation

* [PROJECT/](PROJECT/README.md) — **project status hub**: [overview](PROJECT/overview.md), [roadmap](PROJECT/roadmap.md), tasks, decisions, devlog, [inbox](PROJECT/inbox.md)
* [GAME_VISION.md](GAME_VISION.md) — high concept, pillars, gameplay loops, scope
* [CLAUDE_RULES.md](CLAUDE_RULES.md) — GDScript standards and engineering rules
* [SYSTEMS/01_technical_architecture.md](SYSTEMS/01_technical_architecture.md) — world streaming, LOD tiers, rendering, multiplayer/replication
* [SYSTEMS/02_mercenary_economy.md](SYSTEMS/02_mercenary_economy.md) — contracts, payroll, supply, trade
* [SYSTEMS/03_tactical_battalion_ai.md](SYSTEMS/03_tactical_battalion_ai.md) — formations, ballistics, morale, AI
* [SYSTEMS/04_seamless_world_sim.md](SYSTEMS/04_seamless_world_sim.md) — world graph, army routing, persistence
* [SYSTEMS/05_naval_simulation.md](SYSTEMS/05_naval_simulation.md) — sail physics, wind, broadsides, boarding
* [SYSTEMS/06_player_character_ui.md](SYSTEMS/06_player_character_ui.md) — first-person controls, command HUD
* [SYSTEMS/07_art_style.md](SYSTEMS/07_art_style.md) — low-poly visual style

## Status

Design phase — docs only, no code yet. Current milestone and open questions:
[PROJECT/roadmap.md](PROJECT/roadmap.md) and [PROJECT/inbox.md](PROJECT/inbox.md). This documentation set is the
current point of reference for the project.
