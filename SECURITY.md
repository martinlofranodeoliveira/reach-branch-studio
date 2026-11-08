# Security

Reach Branch Studio 0.1.0 is an educational and simulation workbench for synthetic 3-revolute-joint arm kinematics. It is not an industrial robot controller or physical safety system.

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/martinlofranodeoliveira/reach-branch-studio/security/advisories/new). Include a minimal synthetic reproduction, affected version, expected/observed behavior and environment. Do not include real personal data, credentials or private client documents. No response-time guarantee is stated.

For general contact use [Lofrano Tecnologia's official homepage](https://lofranotecnologia.com.br).

## Boundaries

- Parameters and configurations are validated in memory before updating state.
- Ordinary numeric parsing is not an arbitrary sandbox. Do not treat this application as an isolation boundary for unlimited hostile computation.
- SVG is generated from strictly validated geometric numeric values with proper XML escaping and contains no external resources, scripts or foreignObject.
- No runtime API, account, credentials, telemetry, remote font fetch or automatic persistence is implemented.
- Camera gesture capture is opt-in and can be exited visibly or with Escape.
- Browser/OS, dependency and static host vulnerabilities remain separate concerns. A static build does not itself establish production readiness.

Only the current development line is described; no long-term support or certification is promised.
