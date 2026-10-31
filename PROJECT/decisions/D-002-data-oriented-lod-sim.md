---
id: D-002
title: Data-oriented, manager-owned simulation with four LOD tiers
status: accepted
date: 2026-10-31
source: SYSTEMS/01_technical_architecture.md §3, §5; CLAUDE_RULES.md §4
---

**Decision:** Every unit always exists as data in flat arrays owned by
manager autoloads, cross-referenced by integer ID. Simulation runs in tiers
0–3 by distance to the nearest player. LOD is built in from day one, not
added later.

**Why:** Thousands of combatants at 1:1 scale can't run on a node per
soldier, and retrofitting LOD onto a different data layout amounts to a rewrite.
