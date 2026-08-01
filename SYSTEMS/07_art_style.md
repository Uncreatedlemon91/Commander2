# 07 — Art Style

The visual language for everything modeled/textured in this project —
characters, terrain, props, ships, UI. Author reference: hand-modeled in
**Blender**, solo-authored, so this doc doubles as a production constraint
(what's *makeable* at this scope) as much as an aesthetic choice.

> ⚑ marks a first-pass number/mechanic, not a commitment.

---

## 1. Reference Anchors

Two references set the target directly:

* **Character reference** (user-modeled, Blender): a low-poly Continental/
  British-pattern soldier — faceted, hard-edged geometry, no surface
  texture detail; the uniform's coat, facings, lapels, crossbelt, and
  buttons are built as distinct low-poly *shapes* in solid colors, not
  painted onto a texture. Minimal/no facial detail. This is the character
  art direction, full stop — match this level of abstraction, not a
  higher-fidelity target "someday."
* **Gameplay/environment reference**: a screenshot of the browser game
  *Napoleonic Wars* (1815online.com) — cited here as **stylistic
  inspiration only**, not an asset source; nothing from it gets copied,
  only the visual language it demonstrates: low-poly rolling farmland,
  faceted trees, a soft hazy sky, a marching line of low-poly red-coated
  infantry and an 8-gun battery in first person, with gunsmoke drifting
  off the line and a clean, minimal semi-transparent HUD (per-gun crew
  readout, ammo/weapon counter, corner minimap). It's close enough to this
  project's own pillars (first-person, line infantry, massed low-poly
  formations) that it's a legitimate "does this actually work" proof
  point, not just a mood board image.

## 2. Why Low-Poly Is Load-Bearing, Not Just a Look

This isn't purely an aesthetic pick — it's what makes
`01_technical_architecture.md`'s thousands-of-combatants pillar
achievable, and it's what makes solo Blender production of a 1:1-scale
army viable at all:

* Low tri-count per soldier keeps `MultiMeshInstance3D` batches
  (`01_technical_architecture.md` §4) cheap regardless of instance count.
* Flat/faceted shading with solid-color materials means few, simple
  shaders and few texture reads per instance — fewer shader permutations,
  smaller memory footprint, faster to author than hand-painted texture
  detail.
* Geometry-as-uniform-detail (crossbelts/facings/lapels modeled as
  distinct colored faces, per the character reference) means unit/faction
  identity reads at a glance and at range without relying on texture
  resolution that won't survive distant-LOD or instanced rendering anyway.
* It matches the one-person production reality: this doc's constraints
  should make each soldier/prop *fast* to model, not just small.

If a future asset is tempted toward higher fidelity (more verts, painted
texture detail, normal maps), treat that as a deviation to flag against
this doc and the performance budget it protects, not a quality upgrade to
wave through by default.

## 3. Character Modeling Guidelines

* **Poly budget** ⚑: target 800–1,500 triangles for a Tier 0/near-LOD
  soldier (the character reference is roughly in this range), lower for
  a simplified far-LOD mesh variant if visual LOD is used (see §7). Numbers
  are a starting point — tune once a soldier's actually in-engine and
  instanced at scale.
* **Faceted shading**: flat normals per face (no smoothing groups across
  the whole mesh) — this is the single biggest contributor to the "low
  poly gem" look in the character reference. Don't auto-smooth shading on
  export.
* **Simplified anatomy**: blocky hands, boots, and limb forms; minimal to
  no facial geometry/features (the reference head is essentially a
  smoothed block with a hat) — faces don't need to read at the distances
  and instance counts this game runs at, and detailed faces would be
  wasted budget.
* **Uniform detail is geometry, not texture**: coat, facings, lapels,
  cuffs, crossbelt, buttons, hat brim/cockade are modeled as distinct
  low-poly forms, each carrying a flat solid-color material region. This
  is what reads at a distance and in MultiMesh instancing where per-
  instance texture variation is expensive — color-blocked geometry is
  cheap to vary per faction/regiment (see §5) and cheap to render.
* **Silhouette first**: every modeling decision should ask "does this read
  in silhouette / at 50+ meters / as one of a thousand instances" before
  "does this look detailed up close" — this project is rarely viewed the
  second way.

## 4. Environment & Prop Style

* **Terrain**: low-poly ground meshes, gradient/vertex-colored grass
  rather than high-frequency texture detail, matching the soft painterly
  field look in the reference screenshot. Ties directly into
  `01_technical_architecture.md` §4's terrain approach — cell-based LOD
  meshing stays cheap when the base material is this simple.
* **Vegetation**: faceted low-poly trees/foliage, instanced
  (`MultiMeshInstance3D`, same as units) — same triangle-budget discipline
  as characters, since foliage populations scale the same way soldier
  populations do.
* **Palette**: muted, naturalistic — greens/tans for farmland, blue-grey
  skies, faction uniform colors (red/blue/etc.) as the deliberate high-
  saturation accent against a desaturated world. This is also a gameplay
  legibility tool: uniform color should be the most saturated thing on
  screen so a formation reads instantly against terrain.
* **Atmosphere**: soft haze/fog in the distance isn't just mood — it's the
  visual expression of the spotting-range and gunsmoke mechanics in
  `03_tactical_battalion_ai.md` §6 (accumulating powder smoke degrading
  visibility, terrain/distance haze limiting spotting range). Art and
  simulation should be built to reinforce the same read: if you can't see
  it, the fog-of-war system agrees you can't see it.
* **Ships**: same low-poly, faceted, color-blocked language as characters
  — hull/deck geometry over texture painting, consistent with
  `05_naval_simulation.md`'s data-defined ship approach.

## 5. Materials & Shading (Technical)

* Prefer **solid-color materials / vertex colors** over unique-UV painted
  textures wherever the low-poly geometry can carry the detail instead
  (§3). This is both stylistically correct and a production-speed win for
  a solo Blender pipeline — no unwrap/paint pass needed for most parts.
* Where a texture is genuinely needed (e.g. a small icon/insignia, or a
  shared trim pattern), keep it small and **shared across a palette
  atlas** rather than per-object unique textures — one atlas many meshes
  sample from, not one texture per soldier. This also composes with the
  GPU texture-baked animation approach in
  `01_technical_architecture.md` §4, which already expects instance data
  to be read from small shared textures rather than per-instance unique
  assets.
* **No normal maps, no PBR roughness/metal texture complexity** by
  default — flat-shaded or simply-lit materials only. Revisit only if a
  specific surface (e.g. polished brass, wet canvas) needs it badly enough
  to justify the shader/instancing cost, and treat that as an exception
  to flag, not a baseline.
* **Faction/regiment color variation**: since uniform color is geometry-
  region-based (§3), per-faction (and eventually per-regiment facing
  color, historically real down to the regiment) variation should be
  achievable by swapping material color per instance rather than needing
  separate meshes or textures per faction — a data-driven color parameter
  per unit, read the same way other per-unit data is
  (`01_technical_architecture.md` §5).

## 6. Animation

* Rigs should be **simple/low bone-count**, consistent with the low-poly
  brief and required by `01_technical_architecture.md` §4's GPU texture-
  baked animation approach (fewer bones = smaller bake texture, cheaper
  per-instance sampling). This is another place where the art style and
  the performance architecture are the same decision, not two separate
  ones in tension.
* Animation poses/cycles should read clearly at low fidelity — clean
  silhouette poses for march/fire/reload/melee states matter more than
  smooth in-between frames, matching §3's silhouette-first principle.

## 7. Visual LOD vs. Simulation LOD

* Note the distinction from `01_technical_architecture.md` §3: *simulation*
  LOD tiers (Engaged/Nearby/Active-distant/Dormant) govern how expensively
  an entity is simulated. *Visual* LOD (whether a soldier renders at full
  detail or a simplified distant mesh) is a separate, purely rendering-side
  concern that can align with but isn't dictated by simulation tier — a
  Tier 1 unit might still render at full visual detail if it's close
  enough to see clearly, even though it's not in active combat.
* If a reduced-poly distant variant is used, it should be a stripped
  version of the same base mesh/material set (§3), not a re-authored
  asset — keeps faction color-blocking and silhouette consistent across
  LOD transitions so a unit doesn't visibly "change" as it crosses a
  distance threshold.

## 8. HUD & UI Style

* Per the reference screenshot: **minimal, semi-transparent, unobtrusive**
  — thin sans-serif readouts, simple iconography (per-gun crew circles,
  ammo/weapon counter, corner minimap), no heavy chrome or frames eating
  screen space. Consistent with `06_player_character_ui.md` §6's
  diegetic-where-reasonable direction — the HUD should feel like a
  battlefield instrument panel, not a conventional game menu overlay.
* HUD elements should use the same restrained palette as the world (§4)
  rather than bright arbitrary UI colors, so they read as part of the
  same visual project instead of a layer bolted on top.

## 9. Open Questions for Later Passes

* Exact poly budgets per asset category (soldier, tree, building, ship) —
  first-pass numbers above need validation once real assets exist and are
  profiled at instanced scale (`01_technical_architecture.md` §9's
  profiling note applies here too).
* Faction/regiment color palette definitions — a content task once §5's
  per-instance color-swap approach is implemented.
* Whether a stylized outline/toon-shader pass gets added on top of flat
  shading, or the style stays purely faceted-flat as in both references
  (current default: no outline shader — neither reference uses one).
* Texture atlas resolution and budget (§5) — pick once the first batch of
  real assets shows how much shared texture space is actually needed.
