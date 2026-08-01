# GAME_VISION.md — Project Overview & High Concept

## 1. Executive Summary & Pillars
* **Elevator Pitch:** A first-person, open-world Revolutionary War simulator where players rise from a freelance mercenary to the commander of a private regiment and naval fleet across a seamless, 1:1 scale simulation of the Thirteen Colonies.
* **Core Pillars:**
  * **Seamless Tactical Scale:** No separate battle instances or loading screens. Armies move across the open world in real time, and combat triggers dynamically wherever forces clash.
  * **Authentic Historical Simulation:** Realistic musket ballistics, multi-step manual reloading, line-infantry formation tactics, authentic wind/sail naval physics, and historical morale systems.
  * **Mercenary Sandbox Economy:** Complete freedom to contract with factions, manage payroll, trade goods, purchase arms, recruit soldiers, commission ships, and build a custom military enterprise.
  * **Cooperative Command:** A small group of players (session-based, one host authoritative) rides into the same seamless world together. Each player builds their own character, regiment, and fleet over time and can bring that same persistent company into a friend's world to fight alongside them — progress isn't stranded in whichever world it was earned in.

---

## 2. Core Gameplay Loops

### Second-to-Second
* First-person black powder marksmanship and multi-step reload sequences.
* Melee combat (bayonet, saber, hand-to-hand).
* Maintaining line formation, following officer orders, and managing stamina/morale.
* Direct ship interaction (managing rigging, wheel, and cannon crews).

### Minute-to-Minute
* Field tactical maneuvering (flanking, line vs. column, volley timing).
* Executing ambushes, skirmishes, and dynamic road encounters.
* Issuing tactical orders via voice, drum signals, and physical couriers as an officer.
* Managing wind vectors and broadsides during Age of Sail naval engagements.

### Hour-to-Hour
* Fulfilling military contracts for competing factions (Continental Army, Crown, Privateers).
* Managing troop payroll, rations, disease, and regimental morale.
* Trading weapons, ammunition, and provisions across dynamic town economies.
* Purchasing equipment upgrades, recruiting specialized units, and expanding your fleet.

---

## 3. World Scope & Setting
* **Geography:** A seamless open-world map representing the Thirteen Colonies and coastal waters (designed for potential westward expansion).
* **Factions:** Continental Army, British Crown, Indigenous Nations, and local militias/privateers.
* **Ecosystem:** Real-time settlement supply/demand economies (black powder, iron, food, medicine) and dynamic AI patrol/army routing across land and sea.

---

## 4. Player Progression Model
* **Starting State:** Simple freelance mercenary equipped with basic gear and a single flintlock musket.
* **Mid Game:** Subcontracting as an auxiliary force, purchasing better kit, hiring a squad/platoon, and acquiring small naval vessels (sloops, schooners).
* **End Game:** Promoted to Colonel, commanding a customized regiment and a multi-ship naval fleet capable of altering the course of the Revolutionary War.

---

## 5. Technical & Engine Principles
* **Engine:** Godot Engine 4.x
* **Core Languages:** GDScript (strictly typed) with C++/GDExtension for high-performance sub-systems (1:1 unit AI, physics batching).
* **AI Architecture:** AI Line-of-Sight and Logic LOD (Level of Detail) to handle thousands of active combatants simultaneously.
* **Render Strategy:** Extensive use of `MultiMeshInstance3D` and server-driven physics to render massive formations without dropping framerates.
* **Multiplayer Model:** Session-based co-op — a small group of players (not a persistent shared world) hosts or joins a session together over ENet, with the host authoritative for simulation. See `SYSTEMS/01_technical_architecture.md` §9.

---

## 6. Project Documentation Roadmap
This document serves as the high-level vision hub. Detailed sub-system specifications are located in the following docs:

* `CLAUDE_RULES.md` — GDScript coding standards, optimization rules, and Claude Code instructions.
* `SYSTEMS/01_technical_architecture.md` — MultiMesh, C++ GDExtension, AI LOD, and open-world streaming.
* `SYSTEMS/02_mercenary_economy.md` — Contracts, payroll, supply chains, dynamic town trade.
* `SYSTEMS/03_tactical_battalion_ai.md` — 1:1 unit formations, morale logic, ballistics, line tactics.
* `SYSTEMS/04_seamless_world_sim.md` — World map persistence, real-time army routing, dynamic events.
* `SYSTEMS/05_naval_simulation.md` — Sail physics, wind calculations, broadsides, dynamic boarding.
* `SYSTEMS/06_player_character_ui.md` — First-person controls, command HUD, physical communications.
* `SYSTEMS/07_art_style.md` — Low-poly visual style: modeling, materials, environment, HUD.
