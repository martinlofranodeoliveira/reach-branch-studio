import { ReachStudy } from './types';

export function generateReachSvg(study: ReachStudy, width = 600, height = 400): string {
  const pad = 40;
  const plotW = width - 2 * pad;
  const plotH = height - 2 * pad;

  const maxR = study.reachMetrics.maxReach || 200;
  const maxZ = study.dimensions.baseHeight + maxR;
  const minZ = study.dimensions.baseHeight - maxR;

  // View bounds in radial-Z space:
  // r in [-maxR * 1.1, maxR * 1.1], z in [minZ * 1.1, maxZ * 1.1]
  const rSpan = maxR * 2.2;
  const zSpan = (maxZ - minZ) * 1.1;

  const scaleR = plotW / rSpan;
  const scaleZ = plotH / zSpan;
  const scale = Math.min(scaleR, scaleZ);

  const cx = width / 2;
  const cy = pad + (maxZ * 1.05 - study.dimensions.baseHeight) * scale;

  // Coordinate mapping: (r, z) -> (svgX, svgY)
  const mapPt = (r: number, z: number): [number, number] => {
    const x = cx + r * scale;
    const y = cy - (z - study.dimensions.baseHeight) * scale;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  };

  const [shX, shY] = mapPt(0, study.dimensions.baseHeight);
  const [baseX, baseY] = mapPt(0, 0);

  // Arm links in active configuration
  const rElbow = Math.hypot(study.elbowPosition[0], study.elbowPosition[1]);
  const [elbX, elbY] = mapPt(rElbow, study.elbowPosition[2]);

  const rWrist = Math.hypot(study.wristPosition[0], study.wristPosition[1]);
  const [wristX, wristY] = mapPt(rWrist, study.wristPosition[2]);

  const [tarX, tarY] = mapPt(study.reachMetrics.r, study.target[2]);

  const maxRadiusPx = Math.round(study.reachMetrics.maxReach * scale * 10) / 10;
  const minRadiusPx = Math.round(study.reachMetrics.minReach * scale * 10) / 10;

  const statusColor =
    study.classification === 'Solved'
      ? '#107c41'
      : study.classification === 'UnreachableGeometry'
      ? '#d83b01'
      : study.classification === 'UnreachableJointLimits'
      ? '#d13438'
      : '#0078d4';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#f3f6f7;font-family:'Public Sans',sans-serif;">
  <defs>
    <style>
      .axis { stroke: #cbd5e1; stroke-width: 1; stroke-dasharray: 4,4; }
      .envelope { fill: #235bd4; fill-opacity: 0.05; stroke: #235bd4; stroke-width: 1.5; stroke-dasharray: 6,4; }
      .void { fill: #f3f6f7; stroke: #94a3b8; stroke-width: 1.5; stroke-dasharray: 3,3; }
      .link { stroke: #202b36; stroke-width: 4; stroke-linecap: round; }
      .link2 { stroke: #235bd4; stroke-width: 3.5; stroke-linecap: round; }
      .joint { fill: #ffffff; stroke: #202b36; stroke-width: 2.5; }
      .target { fill: ${statusColor}; stroke: #ffffff; stroke-width: 2; }
      .text-title { font-size: 14px; font-weight: 600; fill: #202b36; }
      .text-label { font-size: 11px; fill: #64748b; }
      .text-val { font-size: 11px; font-weight: 600; fill: #202b36; }
    </style>
  </defs>

  <!-- Title & Status -->
  <text x="20" y="28" class="text-title">Reach Branch Studio — Radial / Z Projection</text>
  <text x="${width - 20}" y="28" text-anchor="end" class="text-val" fill="${statusColor}">Status: ${study.classification}</text>

  <!-- Central Z axis & Base Plane -->
  <line x1="${cx}" y1="${pad}" x2="${cx}" y2="${height - pad}" class="axis" />
  <line x1="${pad}" y1="${baseY}" x2="${width - pad}" y2="${baseY}" class="axis" />

  <!-- Reach envelopes -->
  <circle cx="${shX}" cy="${shY}" r="${maxRadiusPx}" class="envelope" />
  ${minRadiusPx > 2 ? `<circle cx="${shX}" cy="${shY}" r="${minRadiusPx}" class="void" />` : ''}

  <!-- Pedestal Link (Base to Shoulder) -->
  <line x1="${baseX}" y1="${baseY}" x2="${shX}" y2="${shY}" stroke="#64748b" stroke-width="6" stroke-linecap="round" />

  <!-- Arm Links -->
  <line x1="${shX}" y1="${shY}" x2="${elbX}" y2="${elbY}" class="link" />
  <line x1="${elbX}" y1="${elbY}" x2="${wristX}" y2="${wristY}" class="link2" />

  <!-- Joint Markers -->
  <circle cx="${baseX}" cy="${baseY}" r="5" class="joint" />
  <circle cx="${shX}" cy="${shY}" r="6" class="joint" />
  <circle cx="${elbX}" cy="${elbY}" r="5" class="joint" />
  <circle cx="${wristX}" cy="${wristY}" r="4" class="joint" />

  <!-- Target Position Crosshair & Dot -->
  <line x1="${tarX - 8}" y1="${tarY}" x2="${tarX + 8}" y2="${tarY}" stroke="${statusColor}" stroke-width="1.5" />
  <line x1="${tarX}" y1="${tarY - 8}" x2="${tarX}" y2="${tarY + 8}" stroke="${statusColor}" stroke-width="1.5" />
  <circle cx="${tarX}" cy="${tarY}" r="4" class="target" />

  <!-- Labels -->
  <text x="${shX + 10}" y="${shY - 6}" class="text-label">Shoulder (${study.dimensions.baseHeight}mm)</text>
  <text x="${tarX + 10}" y="${tarY + 4}" class="text-val" fill="${statusColor}">Target (r=${study.reachMetrics.r.toFixed(1)}, z=${study.target[2]})</text>
  <text x="20" y="${height - 16}" class="text-label">L1=${study.dimensions.l1}mm, L2=${study.dimensions.l2}mm | Reach max=${study.reachMetrics.maxReach}mm, min=${study.reachMetrics.minReach}mm</text>
</svg>`;
}
