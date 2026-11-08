# Reach Branch Studio Contract

Version: 0.1.0  
License: MIT © 2026 Lofrano Tecnologia  

---

## 1. Arm Geometry & Coordinate Conventions

The arm is an educational 3-revolute-joint (3-DOF RRR) serial manipulator positioned in right-handed 3D Cartesian coordinates $(X, Y, Z)$:
- **Base Origin**: $(0, 0, 0)$.
- **Pedestal / Shoulder Joint**: $(0, 0, H_{\text{base}})$, where $H_{\text{base}} \in [0, 2047]\,\text{mm}$ is the base height.
- **Joint 0 (Base Yaw $\theta_0$)**: Rotates about the positive $Z$-axis. Canonical angle $\theta_0 \in [-180^\circ, 180^\circ)$. At $\theta_0 = 0^\circ$, positive radial direction aligns with $+X$. At $\theta_0 = 90^\circ$, positive radial direction aligns with $+Y$.
- **Joint 1 (Shoulder Pitch $\theta_1$)**: Rotates in the vertical radial-$Z$ plane aligned with the base yaw. Length $L_1 \in [1, 2047]\,\text{mm}$. Angle $\theta_1 \in [-150^\circ, 150^\circ]$ relative to the horizontal $XY$ plane.
- **Joint 2 (Elbow Pitch $\theta_2$)**: Rotates in the same plane as the shoulder. Length $L_2 \in [1, 2047]\,\text{mm}$. Angle $\theta_2 \in [-150^\circ, 150^\circ]$ relative to link 1.
- **Wrist / End Effector**: Located at distance $L_2$ from the elbow.

---

## 2. Forward Kinematics (FK)

In the planar radial-$Z$ frame, with radial radius $r$:
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

---

## 3. Inverse Kinematics (IK) & Branch Enumeration

Given target $(X, Y, Z)$:
- $\rho = \sqrt{X^2 + Y^2}$
- $\Delta Z = Z - H_{\text{base}}$
- Direct distance from shoulder: $D = \sqrt{\rho^2 + \Delta Z^2}$

### Tolerances
- **Length Tolerance**:
  $$\epsilon_{\text{len}} = 10^{-8} \times \max(1, L_1 + L_2, \rho, |\Delta Z|)$$
- **Cosine Tolerance**: $\epsilon_{\cos} = 10^{-12}$.

### Branch Structure
For non-axis targets ($\rho > \epsilon_{\text{len}}$):
1. **Elbow Angle**:
   $$\cos(\theta_2) = \frac{D^2 - L_1^2 - L_2^2}{2 L_1 L_2}$$
   - If $|\cos(\theta_2)| > 1 + \epsilon_{\cos} \implies$ `UnreachableGeometry`.
   - $\theta_2^{(+)} = +\arccos(\cos(\theta_2))$ (elbow up)
   - $\theta_2^{(-)} = -\arccos(\cos(\theta_2))$ (elbow down)
2. **Radial Directions**:
   - Positive radial: $\theta_0^{(+)} = \text{atan2}(Y, X)$, $r = +\rho$.
   - Negative radial: $\theta_0^{(-)} = \text{atan2}(-Y, -X)$, $r = -\rho$.
3. **Shoulder Angle**:
   $$\theta_1 = \text{atan2}(\Delta Z, r) - \text{atan2}(L_2 \sin(\theta_2), L_1 + L_2 \cos(\theta_2))$$

Branches:
- `pos_elbow_up`: yaw $\theta_0^{(+)}$, elbow $\theta_2^{(+)}$.
- `pos_elbow_down`: yaw $\theta_0^{(+)}$, elbow $\theta_2^{(-)}$.
- `neg_elbow_up`: yaw $\theta_0^{(-)}$, elbow $\theta_2^{(+)}$.
- `neg_elbow_down`: yaw $\theta_0^{(-)}$, elbow $\theta_2^{(-)}$.

---

## 4. Classifications

- `Solved`: At least one branch satisfies all joint limits within $\epsilon_{\text{len}}$ residual.
- `UnreachableGeometry`: Target distance $D > L_1 + L_2 + \epsilon_{\text{len}}$ or $D < |L_1 - L_2| - \epsilon_{\text{len}}$.
- `UnreachableJointLimits`: Geometric branches exist, but all violate joint limits.
- `DegenerateFamily`: Target lies on central $Z$-axis ($\rho \le \epsilon_{\text{len}}$); admitted solutions form a continuous 1-DOF family over yaw.
- `InvalidStudy`: Dimension, limit, or target values out of valid bounds.
- `NumericallyIndeterminate`: Borderline arithmetic near floating-point limits.
