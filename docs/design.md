# Reach Branch Studio Design

Version: 0.1.0  
License: MIT © 2026 Lofrano Tecnologia  

---

## 1. Mathematical Architecture

`reach-branch-studio` separates kinematic geometry from presentation:
- **Core Engine** (`src/core/`):
  - `kinematics.ts`: Pure mathematical closed-form forward and inverse kinematics with explicit branch enumeration.
  - `validator.ts`: Schema and range validation for arm dimensions, joint limits, and Cartesian targets.
  - `svg.ts`: Deterministic SVG generator for radial-$Z$ projections and reach envelope curves.
- **Presentation Layer** (`src/components/`):
  - `ArmScene.tsx`: Real Three.js WebGL spatial renderer with joint spheres, link cylinders, reach envelope wireframe, and ground grid.
  - `ProjectionViewer.tsx`: High-contrast 2D SVG viewer for GPU-free inspection.
  - `Toolbar.tsx`: Parameter controls for dimensions, target coordinates, limits, presets, and language switch.
  - `CandidateInspector.tsx`: Analytic branch comparison table displaying status, angles, residuals, and limit rejections.

---

## 2. Visual & Interaction Design

- **Typography**: Public Sans variable font.
- **Palette**:
  - Ink: `#202b36` (high contrast readability)
  - Ground: `#f3f6f7` (light technical maquette background)
  - Primary Active: `#235bd4` (link 2 and active controls)
  - Pedestal / Joint Markers: `#475569` and `#ffffff`
  - Success / Solved: `#107c41`
  - Warning / Singular: `#d97706`
  - Error / Unreachable: `#d13438`
- **Fallback Guarantee**: Systems lacking WebGL support seamlessly use the 2D radial-$Z$ projection viewer without loss of mathematical verification.
