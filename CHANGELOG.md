# Changelog

## 0.1.0 — Unreleased

Development version; no release or deployment is asserted.

- Closed-form analytical forward and inverse kinematics for an educational 3-revolute-joint (3-DOF RRR) serial arm with base pedestal height $H_{\text{base}}$.
- Analytic IK branch enumeration covering both signed radial directions (positive and negative radial) and both elbow signs (elbow-up and elbow-down), yielding up to 4 geometric candidates.
- Explicit joint limit checking with individual joint violation flags (`yaw`, `shoulder`, `elbow`) and classification of `UnreachableJointLimits`.
- Geometric reachability analysis distinguishing `Solved`, `UnreachableGeometry`, `UnreachableJointLimits`, `DegenerateFamily`, `InvalidStudy`, and `NumericallyIndeterminate`.
- Continuous 1-DOF undetermined-yaw family detection for vertical central axis targets ($\rho \le \epsilon_{\text{len}}$).
- Singularity detection for straight-elbow perimeter boundaries ($\theta_2 = 0$).
- Real Three.js WebGL 3D spatial renderer with joint spheres, link cylinders, reach envelope wireframe, and ground grid.
- High-contrast 2D planar radial-$Z$ SVG projection fallback for systems without WebGL.
- Headless assertion suite validating acceptance goldens, branch residuals, limit rejections, and SVG generation offline.
- Bilingual interface (PT-BR default and English toggle) with full accessibility support.
