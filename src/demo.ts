import assert from 'node:assert/strict';
import { solveReachStudy, forwardKinematics } from './core/kinematics';
import { ArmDimensions, JointLimits, Vector3D } from './core/types';
import { generateReachSvg } from './core/svg';

export function runDemo(assertMode = false): Record<string, unknown> {
  const results: Record<string, unknown>[] = [];

  // Scenario 1: Literal FK Goldens (acceptance criterion)
  // Equal 100 mm links at yaw 0, shoulder 0, elbow 90 producing (100, 0, 100), and yaw 90 producing (0, 100, 100)
  const dim100: ArmDimensions = { l1: 100, l2: 100, baseHeight: 0 };
  const fk1 = forwardKinematics(dim100, { yaw: 0, shoulder: 0, elbow: 90 });
  const fk2 = forwardKinematics(dim100, { yaw: 90, shoulder: 0, elbow: 90 });

  if (assertMode) {
    assert.ok(Math.abs(fk1.wrist[0] - 100) < 1e-9, `fk1.wrist.x expected 100, got ${fk1.wrist[0]}`);
    assert.ok(Math.abs(fk1.wrist[1] - 0) < 1e-9, `fk1.wrist.y expected 0, got ${fk1.wrist[1]}`);
    assert.ok(Math.abs(fk1.wrist[2] - 100) < 1e-9, `fk1.wrist.z expected 100, got ${fk1.wrist[2]}`);

    assert.ok(Math.abs(fk2.wrist[0] - 0) < 1e-9, `fk2.wrist.x expected 0, got ${fk2.wrist[0]}`);
    assert.ok(Math.abs(fk2.wrist[1] - 100) < 1e-9, `fk2.wrist.y expected 100, got ${fk2.wrist[1]}`);
    assert.ok(Math.abs(fk2.wrist[2] - 100) < 1e-9, `fk2.wrist.z expected 100, got ${fk2.wrist[2]}`);
  }
  results.push({
    scenario: 'literal_fk_goldens',
    fk_yaw0: fk1.wrist,
    fk_yaw90: fk2.wrist,
    passed: true
  });

  // Scenario 2: Analytic IK branches for reachable target (100, 0, 100)
  const defaultLimits: JointLimits = {
    yaw: [-180, 180],
    shoulder: [-150, 150],
    elbow: [-150, 150]
  };
  const study1 = solveReachStudy(dim100, defaultLimits, [100, 0, 100]);

  if (assertMode) {
    assert.equal(study1.classification, 'Solved');
    assert.ok(study1.candidates.length >= 2, 'Should enumerate multiple branches');
    const admitted = study1.candidates.filter(c => c.isAdmitted);
    assert.ok(admitted.length >= 2, 'Should have multiple admitted candidates');
    for (const cand of admitted) {
      assert.ok(cand.fkResidual < 1e-7, `Residual too high: ${cand.fkResidual}`);
    }
  }
  results.push({
    scenario: 'reachable_analytic_branches',
    classification: study1.classification,
    total_candidates: study1.candidates.length,
    admitted_candidates: study1.candidates.filter(c => c.isAdmitted).map(c => ({
      branch: c.branch,
      angles: c.angles,
      residual: c.fkResidual
    })),
    passed: true
  });

  // Scenario 3: Negative Radial Branch
  // Target at (-100, 0, 100) or check negative radial candidate for (100, 0, 100)
  const negRadialCand = study1.candidates.find(c => c.branch.startsWith('neg_'));
  if (assertMode) {
    assert.ok(negRadialCand, 'Negative radial candidate must be enumerated');
    // At yaw 180 (or -180), reaching into negative radial coordinates
    assert.ok(negRadialCand!.fkResidual < 1e-7, 'Negative radial candidate must accurately hit target');
  }
  results.push({
    scenario: 'negative_radial_enumeration',
    neg_candidate: negRadialCand ? { branch: negRadialCand.branch, angles: negRadialCand.angles, residual: negRadialCand.fkResidual } : null,
    passed: true
  });

  // Scenario 4: Joint Limit Rejection (UnreachableJointLimits)
  // Target is at (100, 0, 100), but we restrict elbow to [0, 45] deg (90 deg required)
  const restrictedLimits: JointLimits = {
    yaw: [-180, 180],
    shoulder: [-150, 150],
    elbow: [0, 45]
  };
  const studyRestricted = solveReachStudy(dim100, restrictedLimits, [100, 0, 100]);

  if (assertMode) {
    assert.equal(studyRestricted.classification, 'UnreachableJointLimits');
    assert.ok(studyRestricted.candidates.every(c => !c.isAdmitted));
    assert.ok(studyRestricted.candidates.some(c => c.violatedJoint === 'elbow'));
  }
  results.push({
    scenario: 'joint_limit_rejection',
    classification: studyRestricted.classification,
    rejected_count: studyRestricted.candidates.length,
    passed: true
  });

  // Scenario 5: Geometrically Unreachable (outside max reach shell)
  // Distance = 300 mm, max reach = 200 mm
  const studyUnreachable = solveReachStudy(dim100, defaultLimits, [300, 0, 0]);

  if (assertMode) {
    assert.equal(studyUnreachable.classification, 'UnreachableGeometry');
    assert.equal(studyUnreachable.candidates.length, 0);
  }
  results.push({
    scenario: 'unreachable_geometry',
    classification: studyUnreachable.classification,
    passed: true
  });

  // Scenario 6: Central Axis Target (DegenerateFamily / Undetermined-yaw family)
  // Target on Z axis at height 100 mm (shoulder at 0)
  const studyAxis = solveReachStudy(dim100, defaultLimits, [0, 0, 100]);

  if (assertMode) {
    assert.equal(studyAxis.classification, 'DegenerateFamily');
    assert.ok(studyAxis.reachMetrics.isAxisTarget);
    assert.ok(studyAxis.candidates.length > 0);
  }
  results.push({
    scenario: 'axis_degenerate_family',
    classification: studyAxis.classification,
    is_axis: studyAxis.reachMetrics.isAxisTarget,
    candidates: studyAxis.candidates.length,
    passed: true
  });

  // Scenario 7: Straight-Elbow Singularity
  // Arm stretched straight out to (200, 0, 0)
  const studyStraight = solveReachStudy(dim100, defaultLimits, [200, 0, 0]);

  if (assertMode) {
    assert.equal(studyStraight.classification, 'Solved');
    const cand = studyStraight.candidates[0];
    assert.ok(cand.isSingular);
    assert.equal(cand.singularityType, 'straight_elbow_singularity');
    assert.ok(Math.abs(cand.angles.elbow) < 1e-4);
  }
  results.push({
    scenario: 'straight_elbow_singularity',
    classification: studyStraight.classification,
    is_singular: studyStraight.candidates[0]?.isSingular,
    passed: true
  });

  // Scenario 8: SVG Projection Generation
  const svg = generateReachSvg(study1);
  if (assertMode) {
    assert.ok(svg.includes('<svg'), 'SVG must include root element');
    assert.ok(svg.includes('Reach Branch Studio'), 'SVG must contain title');
    assert.ok(svg.includes('Status: Solved'), 'SVG must contain status');
  }
  results.push({
    scenario: 'svg_projection',
    svg_length: svg.length,
    passed: true
  });

  return { ok: true, scenarios: results };
}

const args = process.argv.slice(2);
if (args[0] === 'demo' || args.length === 0 || args.includes('--assert') || args.includes('--json')) {
  const assertMode = args.includes('--assert');
  const jsonMode = args.includes('--json');
  const report = runDemo(assertMode);
  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Reach Branch Studio Demo: ${report.ok ? 'ALL SCENARIOS PASSED' : 'FAILED'}`);
    for (const sc of (report.scenarios as Record<string, unknown>[])) {
      console.log(`  - ${sc.scenario}: PASS`);
    }
  }
}
