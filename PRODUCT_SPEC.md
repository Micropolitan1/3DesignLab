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
- [Future: OpenSCAD Interoperability](#future-openscad-interoperability)

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
| 2026-01-20 | Research OpenSCAD interoperability | MakerWorld's Parametric Model Maker demonstrates viable browser-based parametric customization; OpenSCAD ecosystem offers thousands of existing models |
| | | |

### Open Questions

- [ ] Which B-rep kernel to use? (OpenCascade WASM? Manifold? Other?)
- [ ] Server infrastructure approach if hybrid path needed?
- [ ] Target browsers/devices for v1?
- [ ] Hosting strategy for published generators?
- [ ] OpenSCAD integration priority? (See Future: OpenSCAD Interoperability section)

### Technical Learnings

```
[Record spike findings, performance benchmarks, and technical discoveries here]
```

### Scope Changes

```
[Track any changes to scope with rationale]
```

---

## Future: OpenSCAD Interoperability

> **Status:** Research Notes (for future implementation)
> **Last Updated:** 2026-01-20

This section documents research into making 3DesignLab interoperable with OpenSCAD models, inspired by MakerWorld's Parametric Model Maker.

### Overview: What is OpenSCAD?

OpenSCAD is a script-based parametric CAD tool that uses code to define 3D models. Unlike traditional GUI-based CAD, OpenSCAD models are defined programmatically, making them inherently parametric and reproducible.

**Key characteristics:**
- Declarative/functional programming paradigm
- CSG (Constructive Solid Geometry) based operations
- Text-based `.scad` files that are version-control friendly
- Strong community with thousands of customizable models on Thingiverse, Printables, and MakerWorld

### Reference: MakerWorld's Parametric Model Maker

MakerWorld (by Bambu Lab) has implemented a browser-based OpenSCAD customizer that serves as an excellent reference for what 3DesignLab could achieve.

#### Version History & Capabilities

| Version | Date | Key Features |
|---------|------|--------------|
| v0.6.0 | May 2024 | 50+ fonts, third-party libraries |
| v0.7.0 | Jun 2024 | Extended font/library support, more OpenSCAD syntax |
| v0.8.0 | Aug 2024 | File upload, multiple font additions |
| v0.9.0 | Sep 2024 | **Multi-color model export** (3MF with color) |
| v0.9.1 | Nov 2024 | Updated OpenSCAD & BOSL2 library |
| v0.10.0 | Feb 2025 | **Multi-plate 3MF generation**, 3MF parameter customization |
| v0.11.0 | May 2025 | Closed-source script support, printer selection (incl. H2D) |
| v1.0.0 | Jun 2025 | **Fusion 360 (.f3d) file support** |
| v1.1.0 | Oct 2025 | Complete UI redesign, new homepage/editor, Recent & Saved Models |

#### Current Technical Stack (v1.1.0)

- **OpenSCAD Version:** Based on commit `c8fbef05ba900e46892e9a44ea05f7d88e576e13`
- **BOSL2 Library:** Version `99fcfc6867e739aa1cd8ffc49fe39276036681f1`
- **Export Formats:** 3MF (with color, multi-plate), STL
- **Input Formats:** `.scad` files, `.f3d` (Fusion 360)

### Technical Implementation: OpenSCAD in Browser

#### OpenSCAD-WASM Project

The [openscad-wasm](https://github.com/openscad/openscad-wasm) project provides a WebAssembly port of OpenSCAD that enables browser execution.

**Architecture:**
```
┌─────────────────────────────────────────────────┐
│                   Main Thread                    │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐ │
│  │  UI/React │  │  Monaco   │  │ model-viewer│ │
│  │ Components│  │  Editor   │  │  (Three.js) │ │
│  └───────────┘  └───────────┘  └─────────────┘ │
│         │              │               ▲        │
│         ▼              ▼               │        │
│  ┌─────────────────────────────────────┴──────┐ │
│  │            Worker Communication            │ │
│  └─────────────────────────────────────┬──────┘ │
└────────────────────────────────────────│────────┘
                                         │
┌────────────────────────────────────────▼────────┐
│                   Web Worker                     │
│  ┌──────────────────────────────────────────┐  │
│  │           openscad-wasm Module            │  │
│  │  ┌────────────┐  ┌─────────────────────┐ │  │
│  │  │ Emscripten │  │  Virtual Filesystem │ │  │
│  │  │   WASM     │  │  (FS API)           │ │  │
│  │  └────────────┘  └─────────────────────┘ │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │        Libraries (BOSL2, MCAD, etc.)      │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Key Implementation Details:**

1. **ES6 Module Format:** Import as standard JavaScript module
2. **Virtual Filesystem:** Emscripten's FS API for file I/O
3. **Command-line Interface:** `instance.callMain()` with CLI-style arguments
4. **Web Worker Isolation:** Prevents UI freezing during model generation
5. **Manifold Backend:** `--enable=manifold` flag for faster rendering

**Basic Usage Pattern:**
```javascript
import OpenSCAD from 'openscad-wasm';

const instance = await OpenSCAD({ noInitialRun: true });

// Write .scad file to virtual filesystem
instance.FS.writeFile('/input.scad', scadCode);

// Render to STL
instance.callMain([
  '/input.scad',
  '-o', '/output.stl',
  '--enable=manifold'
]);

// Read output
const stlData = instance.FS.readFile('/output.stl');
```

### OpenSCAD Customizer Syntax

OpenSCAD uses special comment annotations to define customizable parameters. This is the key to creating user-friendly parameter UIs.

#### Parameter Declaration Syntax

Parameters must appear **before the first module declaration** in the script:

```openscad
// Description of the parameter
variable_name = default_value; // [constraints]
```

#### Widget Types

| Widget | Syntax Example | Notes |
|--------|----------------|-------|
| **Slider** | `height = 50; // [10:100]` | min:max format |
| **Stepped Slider** | `size = 20; // [0:5:100]` | min:step:max format |
| **Dropdown (numbers)** | `count = 2; // [1, 2, 3, 4]` | Comma-separated values |
| **Dropdown (strings)** | `style = "round"; // [round, square, hex]` | String options |
| **Labeled Dropdown** | `size = "M"; // [S:Small, M:Medium, L:Large]` | value:label format |
| **Checkbox** | `hollow = true;` | Boolean values |
| **Text Input** | `label = "Hello";` | String without constraints |
| **Spinbox** | `quantity = 5;` | Integer without range |

#### Tab/Section Grouping

```openscad
/* [Dimensions] */
width = 100;   // [10:200]
height = 50;   // [10:100]
depth = 30;    // [10:100]

/* [Options] */
rounded = true;
wall_thickness = 2; // [1:0.5:5]

/* [Hidden] */
$fn = 32;  // Not shown in UI
```

#### Advanced Features

```openscad
// Conditional visibility (planned/experimental)
// Parameters can be hidden based on other parameter values

// Image-based parameters (v0.11.0+)
// Some implementations support image uploads for texturing
```

### BOSL2 Library Capabilities

[BOSL2](https://github.com/BelfrySCAD/BOSL2) (Belfry OpenSCAD Library v2.0) is the most comprehensive OpenSCAD library, included in MakerWorld.

**Feature Categories:**

| Category | Capabilities |
|----------|--------------|
| **Shapes** | Extended primitives (prisms, tubes, rounded shapes), 2D shapes |
| **Attachments** | Anchoring system for connecting parts, alignment tools |
| **Texturing** | Surface textures (knurling, patterns), image embossing |
| **Parts** | Gears, threads (metric, UTS, pipe, bottle caps), hinges, joints |
| **Math** | Linear algebra, equation solving, polynomial root finding |
| **Geometry** | Line/circle intersections, coordinate transforms, Bézier curves |
| **VNF** | Vertices-n-Faces manipulation for complex polyhedra |
| **Skinning** | Lofting between profiles, sweep operations |

### Multi-Color & 3MF Export

**How it works in MakerWorld:**

1. OpenSCAD's `color()` statement assigns colors to parts
2. Development version of OpenSCAD supports 3MF export with color data
3. Requires "lazy unions" feature enabled
4. Each color becomes a separate object/material in the 3MF

**Alternative approach (ColorSCAD):**
- Post-process OpenSCAD output to AMF/3MF with color preservation
- Maps preview (F5) colors to export format

### Interoperability Strategy for 3DesignLab

#### Option A: OpenSCAD Import (Read-Only)

**Concept:** Import `.scad` files as read-only parametric generators in 3DesignLab.

**Workflow:**
1. User uploads `.scad` file
2. 3DesignLab parses customizer annotations
3. Generates dial UI from parameters
4. Uses openscad-wasm to render preview/export

**Pros:**
- Leverages existing OpenSCAD ecosystem
- Thousands of existing models become usable
- Relatively simple to implement

**Cons:**
- No editing of the underlying model
- Dependent on openscad-wasm performance/capabilities
- Two different authoring paradigms

#### Option B: OpenSCAD Export (Write-Only)

**Concept:** Export 3DesignLab models as `.scad` files.

**Workflow:**
1. User creates model in 3DesignLab (visual timeline)
2. Export generates equivalent OpenSCAD code
3. Exported `.scad` is compatible with OpenSCAD ecosystem

**Pros:**
- Models become portable to OpenSCAD users
- Can be shared on MakerWorld, Thingiverse, etc.
- Preserves parametric nature

**Cons:**
- Complex mapping from B-rep/feature timeline to CSG
- May not support all 3DesignLab features
- Code generation quality varies

#### Option C: Hybrid Bi-Directional

**Concept:** Full interoperability with translation layer.

**Implementation Complexity:** High

**Would require:**
- AST parser for OpenSCAD scripts
- Mapping layer between CSG and B-rep operations
- Lossless round-trip (probably impossible for complex models)

#### Option D: Side-by-Side Runtime

**Concept:** 3DesignLab player can load either native packages OR `.scad` files.

**Workflow:**
1. Generator runtime detects format
2. Native packages use 3DesignLab engine
3. `.scad` files use embedded openscad-wasm
4. Unified dial UI for both

**Pros:**
- Clean separation of concerns
- Best-of-both-worlds for users
- Incremental implementation

**Cons:**
- Two rendering engines to maintain
- Larger bundle size
- Potential UX inconsistencies

### Implementation Recommendations

#### Phase 1: OpenSCAD Viewer/Customizer (Low Risk)

- [ ] Integrate openscad-wasm as optional module
- [ ] Parse customizer annotations to generate dial UI
- [ ] Render preview using existing Three.js viewport
- [ ] Export STL/3MF from openscad-wasm output

**Estimated Complexity:** Medium
**Dependencies:** openscad-wasm npm package, parameter parser

#### Phase 2: Library Support (Medium Risk)

- [ ] Bundle BOSL2 library with openscad-wasm
- [ ] Add font support for text operations
- [ ] Support `include` and `use` statements
- [ ] Handle file dependencies (multi-file projects)

**Estimated Complexity:** Medium-High
**Dependencies:** Library packaging, virtual filesystem management

#### Phase 3: Export to OpenSCAD (Higher Risk)

- [ ] Implement code generator for basic features (primitives, extrude, boolean)
- [ ] Map 3DesignLab parameters to customizer annotations
- [ ] Handle sketch-to-polygon conversion
- [ ] Document unsupported feature warnings

**Estimated Complexity:** High
**Dependencies:** Robust feature-to-CSG mapping

### Technical Considerations

#### Performance

| Operation | Browser Constraint | Mitigation |
|-----------|-------------------|------------|
| Complex models | Can freeze browser | Web Worker isolation |
| Large renders | Memory limits | Progressive rendering, LOD |
| Many parameters | UI responsiveness | Debounced updates (100-200ms) |
| Library loading | Initial load time | Lazy loading, caching |

#### Compatibility

- **OpenSCAD Version:** MakerWorld tracks development builds; official release is 2021
- **Feature Parity:** Some desktop features may not work in WASM
- **Font Support:** Limited to bundled fonts in browser environment
- **File Size:** Large WASM module (~20-30MB with libraries)

#### Security

- Scripts run in sandboxed Web Worker
- No filesystem access outside virtual FS
- No network access from WASM context
- Consider script validation for uploaded files

### Open Questions

- [ ] Should 3DesignLab support `.scad` authoring, or only import/export?
- [ ] How to handle OpenSCAD models that exceed browser performance limits?
- [ ] Should we support the newer Manifold backend exclusively?
- [ ] How to reconcile B-rep (3DesignLab) vs CSG (OpenSCAD) mental models?
- [ ] What subset of BOSL2 is essential vs nice-to-have?

### References

- [MakerWorld Parametric Model Maker](https://makerworld.com/makerlab/parametricModelMaker)
- [OpenSCAD WASM GitHub](https://github.com/openscad/openscad-wasm)
- [OpenSCAD Playground](https://github.com/openscad/openscad-playground)
- [BOSL2 Library](https://github.com/BelfrySCAD/BOSL2)
- [Web OpenSCAD Customizer](https://github.com/vector76/Web_OpenSCAD_Customizer)
- [OpenSCAD User Manual - Customizer](https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Customizer)
- [MakerWorld v1.1.0 Announcement](https://forum.bambulab.com/t/parametric-model-maker-v1-1-0-major-ui-refresh/203564)
- [Bambu Lab Parametric Model Maker Forum](https://forum.bambulab.com/t/parametic-model-maker/74935)
- [All3DP: Parametric Model Maker Brings OpenSCAD to MakerWorld](https://all3dp.com/4/bambu-labs-parametric-model-maker-brings-openscad-to-makerworld/)

---

## Appendix

### Related Projects/References

- SnapFrames (existing generator example)
- PlanterLab (existing generator example)
- Fusion 360 (mental model reference)
- MakerWorld Parametric Model Maker (browser-based OpenSCAD customizer reference)
- OpenSCAD (script-based parametric CAD)
- openscad-wasm (WebAssembly port for browser execution)
- BOSL2 (comprehensive OpenSCAD library)

### Glossary

| Term | Definition |
|------|------------|
| B-rep | Boundary representation - solid modeling technique |
| BOSL2 | Belfry OpenSCAD Library v2.0 - comprehensive library for OpenSCAD |
| Checkpoint | Cached intermediate state for faster rebuilds |
| CSG | Constructive Solid Geometry - modeling via boolean operations on primitives |
| Customizer | OpenSCAD feature that generates UI from parameter annotations |
| Dial | Exposed parameter with UI controls and guardrails |
| Feature | Single operation in the parametric timeline |
| Generator | Parametric model packaged for end-user configuration |
| OpenSCAD | Script-based parametric CAD tool using code to define 3D models |
| WASM | WebAssembly - binary instruction format for browser-based execution |

---

*This is a living document. Update as the project evolves.*
