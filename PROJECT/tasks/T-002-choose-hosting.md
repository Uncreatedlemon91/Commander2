---
id: T-002
title: Deploy the dashboard to GitHub Pages
status: review
milestone: H1
system: dashboard
owner: human
context: [PROJECT/inbox.md, README.md]
done_when:
  - Hosting chosen (see inbox)
  - Dashboard reachable at a URL on phone and desktop
pr:
---

Once chosen, Claude adds the deploy workflow. The token stays in your browser either way.

- 2026-11-01: owner chose GitHub Pages. Deploy job added to .github/workflows/dashboard.yml. Owner must merge to main and set Settings → Pages → Source to "GitHub Actions".
