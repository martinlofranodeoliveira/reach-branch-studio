# Reach Branch Studio

Development version **0.1.0** — an original Lofrano Tecnologia educational 3-revolute-joint arm kinematics workbench, MIT licensed. Inspect closed-form analytic forward and inverse kinematics, explore elbow branches, evaluate signed radial alternatives, observe joint-limit rejections, analyze reachability boundaries, and inspect 3D and 2D projections in real time. The application uses real Three.js spatial rendering with a high-contrast 2D radial-$Z$ projection fallback. Portuguese is the default interface; the English switch toggles UI text.

[Português](README.pt-BR.md) · [Contract](docs/contract.md) · [Design](docs/design.md) · [Lofrano Tecnologia](https://lofranotecnologia.com.br)

## Features

- **Exact Analytic Kinematics**: Pure closed-form forward and inverse kinematics for a 3-DOF RRR serial manipulator with base pedestal height $H_{\text{base}}$.
- **Exhaustive Branch Enumeration**: Generates up to 4 geometric candidates covering both signed radial directions (positive and negative radial reach-behind) and both elbow signs (elbow-up and elbow-down).
- **Strict Joint Limit Rejection**: Independent validation of yaw, shoulder, and elbow limits with per-candidate violation diagnostics.
- **Singularity & Axis Families**: Explicit detection of straight-elbow perimeter boundaries ($\theta_2 = 0$) and continuous 1-DOF undetermined-yaw families on the vertical axis ($\rho \le \epsilon_{\text{len}}$).
- **Interactive 3D / 2D Studio**: WebGL 3D spatial rendering with joint markers, link cylinders, reach envelope wireframe, and high-contrast 2D SVG radial-$Z$ projection fallback.

## Mathematical Kinematics

### Arm Configuration
- **Base Origin**: $(0, 0, 0)$.
- **Shoulder Joint**: $(0, 0, H_{\text{base}})$ with $H_{\text{base}} \in [0, 2047]\,\text{mm}$.
- **Joint 0 (Base Yaw $\theta_0$)**: Rotation about $Z$-axis.
- **Joint 1 (Shoulder Pitch $\theta_1$)**: Rotation in radial-$Z$ plane, length $L_1 \in [1, 2047]\,\text{mm}$.
- **Joint 2 (Elbow Pitch $\theta_2$)**: Rotation relative to link 1, length $L_2 \in [1, 2047]\,\text{mm}$.

### Forward Kinematics
In the radial-$Z$ frame:
$$r_e = L_1 \cos(\theta_1)$$
$$Z_e = H_{\text{base}} + L_1 \sin(\theta_1)$$
$$r_{\text{ee}} = L_1 \cos(\theta_1) + L_2 \cos(\theta_1 + \theta_2)$$
$$Z_{\text{ee}} = H_{\text{base}} + L_1 \sin(\theta_1) + L_2 \sin(\theta_1 + \theta_2)$$

In 3D Cartesian coordinates:
$$\mathbf{p}_{\text{ee}} = \begin{pmatrix} r_{\text{ee}} \cos(\theta_0) \\ r_{\text{ee}} \sin(\theta_0) \\ Z_{\text{ee}} \end{pmatrix}$$

### Acceptance Goldens
- For $L_1 = 100\,\text{mm}, L_2 = 100\,\text{mm}, H_{\text{base}} = 0$:
  - $(\theta_0 = 0^\circ, \theta_1 = 0^\circ, \theta_2 = 90^\circ) \implies (100, 0, 100)\,\text{mm}$.
  - $(\theta_0 = 90^\circ, \theta_1 = 0^\circ, \theta_2 = 90^\circ) \implies (0, 100, 100)\,\text{mm}$.

## Install and use

Node 22 or later is required; the dependency tuple targets Node 22.23.4 / npm 10.9.9. Direct dependencies are exact versions.

```sh
npm ci --ignore-scripts
npm run dev
```

Open `http://127.0.0.1:5173/reach-branch-studio/`.

### Validation and Build

```sh
npm test
npm run demo -- --assert
npm run demo -- --json
npm run build
npm run preview
```

Preview runs at `http://127.0.0.1:4173/reach-branch-studio/`. The production build output is static, self-contained, and configured for `/reach-branch-studio/`.

## Quality & Determinism

- All core kinematics functions are pure and run deterministically with zero network calls.
- Headless demo script (`src/demo.ts`) validates 8 key scenarios including literal FK goldens, branch residuals, negative radial solutions, limit rejections, and SVG generation offline.
