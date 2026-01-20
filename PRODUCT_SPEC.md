# 3DDesignLab — Product Specification

> **Status:** In Progress - Milestone 0.1 Complete
> **Last Updated:** 2026-01-20
> **Version:** 0.1.0

---

## Table of Contents

- [Product Definition](#product-definition)
- [Primary User](#primary-user)
- [Core Outcomes](#core-outcomes)
- [Functional Requirements](#functional-requirements)
- [Architecture](#architecture)
- [Development Plan](#development-plan)
- [Confidence Assessment](#confidence-assessment)
- [Notes & Decisions Log](#notes--decisions-log)

---

## Product Definition

**3DDesignLab** is a browser-native 3D authoring environment for building parametric 3D generators. It combines:

1. **Constrained CAD-like solid workflow:** sketch → features → timeline
2. **Mesh finishing workflow:** remesh/displace/emboss → bake

This enables creators to quickly produce and publish **dial-driven web apps** (e.g., SnapFrames, PlanterLab) that export printable geometry (STL/3MF).

---

## Primary User

You (and later other "creators") using the tool to:
- Author models in-browser
- Define parameters
- Package them into simplified end-user configurators

---

## Core Outcomes

What "done" means:

- [ ] A creator can author a model in-browser using a parametric timeline
- [ ] The creator can explicitly mark a subset of parameters as exposed dials (with guardrails)
- [ ] The creator can export a "generator package" that runs in a lightweight browser runtime, producing STL/3MF

---

## Functional Requirements

### A. Browser-Native CAD Authoring

**Goal:** Fusion-like mental model, but constrained. V1 scope is intentionally minimal.

#### Sketching

- [ ] 2D sketch on planes or planar faces
- [ ] **Entities (minimum viable set):**
  - [ ] Line
  - [ ] Rectangle
  - [ ] Circle
  - [ ] Arc
- [ ] **Constraints:**
  - [ ] Coincident
  - [ ] Horizontal/Vertical
  - [ ] Parallel/Perpendicular
  - [ ] Equal
- [ ] **Dimensions:**
  - [ ] Length
  - [ ] Radius/diameter
  - [ ] Distance between entities

#### Solid Features

- [ ] **Extrude:** join / cut / new body
- [ ] **Boolean:** union / difference / intersect (solid-on-solid)
- [ ] **Fillet/Chamfer:** basic constant-radius fillet on edges

#### Selection & Transforms

- [ ] Face/edge selection for feature creation (sketch-on-face, fillet edges)
- [ ] Move/rotate/scale bodies (non-parametric transform feature acceptable early)

#### Timeline

- [ ] Feature list with edit-and-rebuild
- [ ] Rollback (edit earlier features)
- [ ] Parameter table (named parameters; expressions later)

**Notes:**
```
[Add implementation notes here as you build]
```

---

### B. Mesh Finishing Workflow

**Goal:** Enable SnapFrames-style surface texturing and printable output.

- [ ] Convert CAD solids to mesh with configurable tessellation (preview vs export)
- [ ] Remeshing operations (uniform/adaptive)
- [ ] Surface displacement/emboss pipeline (image or procedural input later)
- [ ] Mesh cleanup basics (recompute normals, weld, decimate optional)
- [ ] Export printable mesh formats:
  - [ ] STL (v1)
  - [ ] 3MF (shortly after)

**Notes:**
```
[Add implementation notes here as you build]
```

---

### C. Import and Manipulation

- [ ] Import STEP as B-rep solids where feasible in browser
- [ ] Import meshes: STL/OBJ/3MF
- [ ] Treat imports as editable bases:
  - [ ] **For STEP:** select faces → sketch → cut/extrude
  - [ ] **For meshes:** limited editing; primarily use as reference or final-stage boolean/merge

**Notes:**
```
[Add implementation notes here as you build]
```

---

### D. Generator Authoring and Publishing

**The differentiator.** Creator can:

#### Parameter Exposure
- [ ] Promote internal parameters to exposed dials
- [ ] Define dial metadata:
  - [ ] min/max/step
  - [ ] units
  - [ ] presets
  - [ ] grouping
- [ ] Define validation rules / guardrails (hard stop vs warning)
- [ ] Define export settings (quality, wall-thickness checks later)

#### Generator Package Export
- [ ] Model feature graph + parameters + dial manifest
- [ ] Assets (textures/images, optional)
- [ ] Optional cached checkpoints for faster rebuild

#### Lightweight Runtime/Player
- [ ] Loads generator package in browser
- [ ] Renders preview
- [ ] Exposes dial UI
- [ ] Rebuilds model on dial change
- [ ] Exports STL/3MF

**Notes:**
```
[Add implementation notes here as you build]
```

---

## Architecture

### Non-Negotiable Realities

1. Rendering/interaction is straightforward in modern web stacks
2. Robust CAD kernels are hard—in-browser CAD is feasible, but hinges on picking the right open-source/WASM-capable geometry engine and constraining scope

### System Layers

#### Layer 1: UI + Interaction (Browser)

| Component | Technology | Status |
|-----------|------------|--------|
| Viewport | Three.js (WebGL) | Done |
| Camera controls | Three.js OrbitControls | Done |
| Gizmos & snapping | Custom | Not started |
| Picking & selection | BVH accelerated | Done |
| Timeline UI | Custom | Not started |
| Sketch UI | Custom | Not started |
| Parameter/dial editor | Custom | Not started |
| Worker orchestration | Web Workers | Not started |

#### Layer 2: Parametric Model (Feature Graph)

Source-of-truth is a feature list / DAG.

**Each feature has:**
- Type (Sketch, Extrude, Boolean, Fillet, Transform, MeshBake, etc.)
- Parameters
- References (sketch plane, profiles, edge selections, target bodies)

**Rebuild engine:**
- [ ] Incremental rebuild from first changed feature
- [ ] Checkpoint caching every N features for speed
- [ ] Deterministic serialization (for publishing)

#### Layer 3: Geometry Engine (Two Domains)

**A) Solid (B-rep) Domain**
- Responsibilities: sketches-to-solids, booleans, fillets, STEP
- Implementation: WASM if feasible; otherwise hybrid with server fallback

**B) Mesh Domain**
- Responsibilities: remesh, displacement/emboss, mesh boolean (optional), export
- Implementation: WASM; easier than B-rep for many operations

#### Layer 4: Packaging/Runtime

- [ ] Generator package format (JSON manifest + binary geometry cache optional)
- [ ] Runtime: same parametric evaluator, but restricted UI, fewer tools
- [ ] Option for server-side "export job" if needed for heavy geometry

---

### Technology Stack

| Category | Technology | Confidence |
|----------|------------|------------|
| Rendering/UX | Three.js | Very High |
| Selection | BVH raycasting | Very High |
| Compute | Web Workers | Very High |
| State management | Zustand-style or event-sourced | Very High |
| Mesh ops | WASM | High |
| STL export | In-browser | High |
| 3MF export | In-browser | High |

---

### CAD Kernel Strategy

**The crux.** Two viable paths:

#### Path A: Browser-Only (Ideal)
B-rep kernel compiled to WASM

| Pros | Cons |
|------|------|
| Pure client-side | Hardest engineering risk |
| Offline-capable | STEP import can be heavy |
| Great for "creator tool" | Fillets/booleans can be heavy |

#### Path B: Hybrid (Pragmatic)
Browser UI + server-side CAD for heavy ops

| Pros | Cons |
|------|------|
| More reliable early | Adds infra, cost, latency |
| Easier STEP support | Publishing/runtime story needs planning |
| Robust booleans/fillets | |

**Recommendation:** Start with Path A but design escape hatch to Path B for:
- STEP import on large parts
- Large/complex booleans
- Some fillet operations

**Current Decision:** `[TBD - decide after Phase 0 spikes]`

---

### Data Model: Generator Package Structure

```
generator-package/
├── manifest.json      # metadata, versioning, exposed dials, export profiles
├── model.json         # ordered feature list + parameter definitions + stable IDs
├── cache.bin          # (optional) checkpoints for fast runtime rebuild
└── assets/            # (optional) texture maps, icons, thumbnails
```

---

### Hard Engineering Issues

#### A) Stable Face/Edge References (Topological Naming)

**Risk Level:** Medium

**Mitigation Strategy:**
- [ ] Strongly encourage sketch-driven references
- [ ] Keep fillet usage constrained early
- [ ] Store geometric signatures for face references and re-resolve on rebuild
- [ ] Provide "repair references" UX (highlight broken features)

**Notes:**
```
[Track issues and solutions here]
```

#### B) Performance in Browser

**Risk Level:** Medium (for worst-case CAD ops)

**Mitigations:**
- [ ] Worker-based rebuild
- [ ] Preview tessellation low-res, export high-res
- [ ] Checkpoints
- [ ] Debounce dial changes (100–200ms idle)
- [ ] Optional server fallback for heavy jobs

**Notes:**
```
[Track performance findings here]
```

#### C) STEP Import in Browser

**Risk Level:** Medium

**Approach:**
- [ ] v1: allow STEP import but cap size/complexity
- [ ] Warn and offer server import if needed
- [ ] Consider "preprocess STEP to internal format" as upload step

**Notes:**
```
[Track STEP import findings here]
```

---

## Development Plan

### Phase 0 — Technical Feasibility Spikes

**Goal:** De-risk the two hard parts before building full product.

#### Milestone 0.1: Browser Viewport + Selection Baseline
**Confidence:** High
**Status:** COMPLETE

- [x] Three.js viewport with orbit/pan/zoom
- [x] Load and render a mesh
- [x] Face/triangle picking with highlighting

**Notes:**
```
2026-01-20: Completed initial implementation
- Vite + React + TypeScript project scaffolding
- Three.js viewport with OrbitControls (orbit, pan, zoom)
- BVH-accelerated raycasting via three-mesh-bvh
- Face-level hover highlighting (cyan) and selection highlighting (orange)
- Multi-select with Shift+Click
- Test geometry: cube, sphere, cylinder, torus
- Zustand state management for selection
- Sidebar showing hover info, selection list, and controls help
```

#### Milestone 0.2: Mesh Pipeline Spike
**Confidence:** High

- [ ] In-browser STL export from a generated mesh
- [ ] Basic remesh or displacement proof-of-concept (even crude)
- [ ] Worker thread compute so UI stays responsive

**Notes:**
```
```

#### Milestone 0.3: B-rep Kernel Viability Spike
**Confidence:** Medium

- [ ] Run minimal solid operation chain in-browser:
  - [ ] Create primitive
  - [ ] Extrude or boolean
  - [ ] Tessellate
  - [ ] Render
- [ ] Measure performance and memory constraints

**Notes:**
```
```

#### Milestone 0.4: STEP Import Spike
**Confidence:** Medium

- [ ] Import at least one realistic STEP sample in browser OR via minimal server converter
- [ ] Render imported geometry
- [ ] Select faces
- [ ] Tessellate to mesh

**Exit Criteria:** Know whether Path A (browser-only) or Path A + server escape hatch from day one.

**Phase 0 Decision:**
```
[Record decision here after spikes complete]
```

---

### Phase 1 — Parametric Solid Core

**Goal:** Create SnapFrames-class generators from scratch in browser.

#### Milestone 1.1: Parametric Timeline + Parameter Table
**Confidence:** High

- [ ] Feature list data model
- [ ] Rebuild replay (even if limited feature types)
- [ ] Parameter edits trigger rebuild
- [ ] Serialize/deserialize model.json

**Notes:**
```
```

#### Milestone 1.2: Sketch v1
**Confidence:** Medium–High

- [ ] Sketch plane
- [ ] Entities: line/rect/circle
- [ ] Minimal constraints + dimensions
- [ ] Profile detection for extrusion

**Notes:**
```
[Watch for scope creep in constraint solver]
```

#### Milestone 1.3: Extrude
**Confidence:** High

- [ ] Join/cut/new body modes
- [ ] Preview while dragging distance (nice-to-have)
- [ ] Timeline edit works

**Notes:**
```
```

#### Milestone 1.4: Boolean Solids
**Confidence:** Medium

- [ ] Union/difference between bodies
- [ ] Robust enough for typical printable parts
- [ ] Document known limitations

**Exit Criteria:** Can build "basic parametric solids" reliably and export STL.

---

### Phase 2 — Generator Authoring & Publishing

**Goal:** Turn designs into dial-driven apps. **This is the differentiator.**

#### Milestone 2.1: Exposed Dials Editor + Manifest
**Confidence:** High

- [ ] Promote parameter → dial
- [ ] Set bounds/presets/labels/units
- [ ] Save to manifest.json

**Notes:**
```
```

#### Milestone 2.2: Lightweight Runtime/Player
**Confidence:** High

- [ ] Load generator package
- [ ] Show dial UI
- [ ] Rebuild on dial change
- [ ] Export STL

**Notes:**
```
```

#### Milestone 2.3: Checkpoint Caching for Runtime Speed
**Confidence:** Medium

- [ ] Cache intermediate states in authoring
- [ ] Runtime loads cache for faster rebuild

**Exit Criteria:** Can publish a "next SnapFrames" as a standalone web app.

---

### Phase 3 — Mesh Finishing for Veneers/Textures

**Goal:** Support SnapFrames-like surface treatments.

#### Milestone 3.1: CAD→Mesh Tessellation Controls
**Confidence:** High

- [ ] Preview vs export resolution profiles
- [ ] Consistent normals
- [ ] Watertight checks (basic)

**Notes:**
```
```

#### Milestone 3.2: Remesh + Displacement Pipeline
**Confidence:** Medium

- [ ] Remesh on selected surfaces or full body mesh
- [ ] Displacement from grayscale map (image)
- [ ] Displacement from procedural noise
- [ ] Bake and export

**Notes:**
```
[UX of "select surface region + control artifacts" will need iteration]
```

#### Milestone 3.3: Mesh Cleanup + Repair Tooling
**Confidence:** Medium

- [ ] Self-intersection checks (basic)
- [ ] Decimate/smooth options
- [ ] Manifold verification warnings

**Exit Criteria:** Creators can apply textures and reliably export printable files.

---

### Phase 4 — Import & Edit External Parts

**Goal:** Import STEP as a base, modify with CAD features, finish with mesh pipeline.

#### Milestone 4.1: STEP Import
**Confidence:** Medium

- [ ] Import with size/complexity guardrails
- [ ] Face selection works
- [ ] Tessellate and export

**Notes:**
```
```

#### Milestone 4.2: Sketch-on-Face + Cut/Extrude on Imports
**Confidence:** Medium

- [ ] Robust planar face detection
- [ ] Reference repair UX if face IDs change

**Exit Criteria:** "Light editing" of imported parts works.

---

### Phase 5 — Robustness & Productization

**Goal:** Make it usable beyond you.

- [ ] Better constraints (more types, better solve feedback) — *Medium confidence*
- [ ] Better topological naming & repair flows — *Medium confidence*
- [ ] Collaboration/versioning — *Lower confidence; large scope*
- [ ] Performance optimization + server acceleration tier — *High confidence as concept*

---

## Confidence Assessment

### High Confidence (Well understood, low existential risk)

| Area | Notes |
|------|-------|
| Browser viewport/rendering, picking, gizmos | Three.js + BVH |
| Parametric model format | Feature list + parameters + manifest |
| Generator runtime/player architecture | Authoring vs runtime split |
| Mesh export (STL/3MF) | Preview/export quality profiles |
| Worker-thread compute | Debounced rebuild, caching patterns |

### Medium Confidence (Feasible but needs spikes + iteration)

| Area | Notes |
|------|-------|
| Minimal sketch constraint system | Scope creep risk |
| Solid booleans and fillets quality | Depends on chosen kernel |
| STEP import complexity | Browser constraints |
| Stable references/topological naming | Solvable but requires UX |

### Lower Confidence (Intentionally deferred)

| Area | Notes |
|------|-------|
| Mesh → solid conversions | Recommend avoiding |
| Full "Fusion-level" fillet robustness | On arbitrary imported STEP |
| Advanced surfacing/lofts/splines | High reliability difficult |
| Multi-user collaboration | Merge conflicts, concurrent editing |

---

## Notes & Decisions Log

Use this section to track ongoing decisions, learnings, and changes to the plan.

### Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-20 | Created initial spec | Starting point for development |
| | | |

### Open Questions

- [ ] Which B-rep kernel to use? (OpenCascade WASM? Manifold? Other?)
- [ ] Server infrastructure approach if hybrid path needed?
- [ ] Target browsers/devices for v1?
- [ ] Hosting strategy for published generators?

### Technical Learnings

```
[Record spike findings, performance benchmarks, and technical discoveries here]
```

### Scope Changes

```
[Track any changes to scope with rationale]
```

---

## Appendix

### Related Projects/References

- SnapFrames (existing generator example)
- PlanterLab (existing generator example)
- Fusion 360 (mental model reference)

### Glossary

| Term | Definition |
|------|------------|
| B-rep | Boundary representation - solid modeling technique |
| Generator | Parametric model packaged for end-user configuration |
| Dial | Exposed parameter with UI controls and guardrails |
| Feature | Single operation in the parametric timeline |
| Checkpoint | Cached intermediate state for faster rebuilds |

---

*This is a living document. Update as the project evolves.*
