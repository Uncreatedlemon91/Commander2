---
id: D-003
title: Session-based, host-authoritative co-op over ENet
status: accepted
date: 2026-10-31
source: SYSTEMS/01_technical_architecture.md §9; CLAUDE_RULES.md §6
---

**Decision:** A small group joins one host's session. There's no dedicated
server, persistent world or matchmaking. The host simulates everything; clients send
requests and receive interest-filtered snapshots. Clients predict only their own character.

**Why:** Keeps one simulation model for single-player and co-op. Replication is a layer on top, not a second sim.
