---
date: 2026-11-01
tasks: [T-002, T-003]
pr:
---

**Did:** Added a GitHub Pages deploy job to the dashboard workflow (main only;
PRs build and test). Pre-filled the hub repo setting at build time, and added `noindex`.
Verified the build under the `/Commander2/` subpath Pages uses.

**Decided:** D-004 GitHub Pages hosting (instead of a hidden page on the Ravenfall site,
whose repo only has a README).

**Blocked / questions:** Owner merges to main and switches Pages source to GitHub
Actions. Nam and Pro Clubs need GitHub repos before they can be registered (T-003).

**Next:** First real-data check on the live URL, then T-003.
