import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forwardKinematics, solveReachStudy } from '../src/core/kinematics';
import { ArmDimensions, JointLimits } from '../src/core/types';

test('forward kinematics: literal acceptance criteria goldens', () => {
  const dim: ArmDimensions = { l1: 100, l2: 100, baseHeight: 0 };

  // Case 1: yaw 0, shoulder 0, elbow 90 -> (100, 0, 100)
  const fk1 = forwardKinematics(dim, { yaw: 0, shoulder: 0, elbow: 90 });
  assert.ok(Math.abs(fk1.wrist[0] - 100) < 1e-9);
  assert.ok(Math.abs(fk1.wrist[1] - 0) < 1e-9);
  assert.ok(Math.abs(fk1.wrist[2] - 100) < 1e-9);

  // Case 2: yaw 90, shoulder 0, elbow 90 -> (0, 100, 100)
  const fk2 = forwardKinematics(dim, { yaw: 90, shoulder: 0, elbow: 90 });
  assert.ok(Math.abs(fk2.wrist[0] - 0) < 1e-9);
  assert.ok(Math.abs(fk2.wrist[1] - 100) < 1e-9);
  assert.ok(Math.abs(fk2.wrist[2] - 100) < 1e-9);

  // Straight arm horizontal: yaw 0, shoulder 0, elbow 0 -> (200, 0, 0)
  const fk3 = forwardKinematics(dim, { yaw: 0, shoulder: 0, elbow: 0 });
  assert.ok(Math.abs(fk3.wrist[0] - 200) < 1e-9);
  assert.ok(Math.abs(fk3.wrist[1] - 0) < 1e-9);
  assert.ok(Math.abs(fk3.wrist[2] - 0) < 1e-9);

  // Straight arm vertical: yaw 0, shoulder 90, elbow 0 -> (0, 0, 200)
  const fk4 = forwardKinematics(dim, { yaw: 0, shoulder: 90, elbow: 0 });
  assert.ok(Math.abs(fk4.wrist[0] - 0) < 1e-9);
  assert.ok(Math.abs(fk4.wrist[1] - 0) < 1e-9);
  assert.ok(Math.abs(fk4.wrist[2] - 200) < 1e-9);
});

test('forward kinematics: preserves pedestal base height', () => {
  const dim: ArmDimensions = { l1: 150, l2: 120, baseHeight: 80 };
  const fk = forwardKinematics(dim, { yaw: 0, shoulder: 0, elbow: 0 });
  assert.equal(fk.base[2], 0);
  assert.equal(fk.shoulder[2], 80);
  assert.equal(fk.wrist[2], 80);
  assert.equal(fk.wrist[0], 270);
});

test('solveReachStudy: validates domain and rejects invalid inputs', () => {
  const defaultLimits: JointLimits = {
    yaw: [-180, 180],
    shoulder: [-150, 150],
    elbow: [-150, 150]
  };

  // Invalid link length
  const badDim: ArmDimensions = { l1: 0, l2: 100, baseHeight: 0 };
  const study1 = solveReachStudy(badDim, defaultLimits, [100, 0, 100]);
  assert.equal(study1.classification, 'InvalidStudy');
  assert.ok(study1.diagnostics.length > 0);

  // Target coordinate out of 14-bit bounds
  const goodDim: ArmDimensions = { l1: 100, l2: 100, baseHeight: 0 };
  const study2 = solveReachStudy(goodDim, defaultLimits, [10000, 0, 0]);
  assert.equal(study2.classification, 'InvalidStudy');
});

test('solveReachStudy: classifies geometrically unreachable targets', () => {
  const dim: ArmDimensions = { l1: 100, l2: 60, baseHeight: 50 };
  const limits: JointLimits = {
    yaw: [-180, 180],
    shoulder: [-150, 150],
    elbow: [-150, 150]
  };

  // Outside max reach shell (D > 160 mm from shoulder at (0,0,50))
  const studyOuter = solveReachStudy(dim, limits, [200, 0, 50]);
  assert.equal(studyOuter.classification, 'UnreachableGeometry');
  assert.equal(studyOuter.candidates.length, 0);

  // Inside inner void (D < 40 mm from shoulder)
  const studyInner = solveReachStudy(dim, limits, [20, 0, 50]);
  assert.equal(studyInner.classification, 'UnreachableGeometry');
});
