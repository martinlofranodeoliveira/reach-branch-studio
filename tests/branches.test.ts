import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solveReachStudy, forwardKinematics } from '../src/core/kinematics';
import { ArmDimensions, JointLimits } from '../src/core/types';
import { generateReachSvg } from '../src/core/svg';

test('branches: enumerates positive and negative radial alternatives', () => {
  const dim: ArmDimensions = { l1: 120, l2: 80, baseHeight: 40 };
  const limits: JointLimits = {
    yaw: [-180, 180],
    shoulder: [-150, 150],
    elbow: [-150, 150]
  };

  const target = [100, 50, 80] as [number, number, number];
  const study = solveReachStudy(dim, limits, target);

  assert.equal(study.classification, 'Solved');
  assert.ok(study.candidates.length >= 2, 'Must have at least 2 candidates');

  const posBranches = study.candidates.filter(c => c.branch.startsWith('pos_'));
  const negBranches = study.candidates.filter(c => c.branch.startsWith('neg_'));

  assert.ok(posBranches.length > 0, 'Must have positive radial candidates');
  assert.ok(negBranches.length > 0, 'Must have negative radial candidates');

  for (const cand of study.candidates.filter(c => c.isAdmitted)) {
    const fk = forwardKinematics(dim, cand.angles);
    const residual = Math.hypot(
      fk.wrist[0] - target[0],
      fk.wrist[1] - target[1],
      fk.wrist[2] - target[2]
    );
    assert.ok(residual <= study.reachMetrics.lengthTolerance, `Residual ${residual} exceeded tolerance`);
  }
});

test('branches: rejects candidates outside joint limits and flags violated joint', () => {
  const dim: ArmDimensions = { l1: 100, l2: 100, baseHeight: 0 };

  // Strict elbow limits excluding +90 deg and -90 deg
  const restrictedLimits: JointLimits = {
    yaw: [-180, 180],
    shoulder: [-150, 150],
    elbow: [-30, 30]
  };

  const study = solveReachStudy(dim, restrictedLimits, [100, 0, 100]);
  assert.equal(study.classification, 'UnreachableJointLimits');
  assert.ok(study.candidates.length > 0);
  assert.ok(study.candidates.every(c => !c.isAdmitted));
  assert.ok(study.candidates.some(c => c.violatedJoint === 'elbow'));
});

test('axis targets: detects central axis and reports DegenerateFamily', () => {
  const dim: ArmDimensions = { l1: 100, l2: 100, baseHeight: 50 };
  const limits: JointLimits = {
    yaw: [-180, 180],
    shoulder: [-150, 150],
    elbow: [-150, 150]
  };

  const target = [0, 0, 150] as [number, number, number];
  const study = solveReachStudy(dim, limits, target);

  assert.equal(study.classification, 'DegenerateFamily');
  assert.ok(study.reachMetrics.isAxisTarget);
  assert.ok(study.candidates.length > 0);
  assert.ok(study.candidates.some(c => c.isAdmitted));
});

test('singularities: flags straight-elbow singularity on reach perimeter', () => {
  const dim: ArmDimensions = { l1: 100, l2: 100, baseHeight: 0 };
  const limits: JointLimits = {
    yaw: [-180, 180],
    shoulder: [-150, 150],
    elbow: [-150, 150]
  };

  // Perimeter target D = 200 mm
  const target = [200, 0, 0] as [number, number, number];
  const study = solveReachStudy(dim, limits, target);

  assert.equal(study.classification, 'Solved');
  const singularCand = study.candidates.find(c => c.isSingular);
  assert.ok(singularCand);
  assert.equal(singularCand!.singularityType, 'straight_elbow_singularity');
});

test('svg: generates clean deterministic 2D projection', () => {
  const dim: ArmDimensions = { l1: 100, l2: 80, baseHeight: 20 };
  const limits: JointLimits = {
    yaw: [-180, 180],
    shoulder: [-150, 150],
    elbow: [-150, 150]
  };

  const study = solveReachStudy(dim, limits, [120, 0, 80]);
  const svg = generateReachSvg(study, 500, 300);

  assert.ok(svg.startsWith('<?xml version="1.0"'));
  assert.ok(svg.includes('viewBox="0 0 500 300"'));
  assert.ok(svg.includes('Reach Branch Studio'));
  assert.ok(svg.includes('Status: Solved'));
});
