import {
  ArmDimensions,
  BranchIdentity,
  CandidateRejectionReason,
  IKCandidate,
  JointAngles,
  JointLimits,
  JointLimitViolation,
  ReachClassification,
  ReachMetrics,
  ReachStudy,
  Vector3D
} from './types';
import {
  validateArmDimensions,
  validateJointLimits,
  validateTarget
} from './validator';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const COS_TOLERANCE = 1e-12;

export function normalizeYawDeg(deg: number): number {
  let a = (deg + 180) % 360;
  if (a < 0) a += 360;
  return a - 180;
}

export function forwardKinematics(
  dim: ArmDimensions,
  angles: JointAngles
): {
  base: Vector3D;
  shoulder: Vector3D;
  elbow: Vector3D;
  wrist: Vector3D;
  rWrist: number;
  deltaZ: number;
} {
  const yawRad = angles.yaw * DEG2RAD;
  const shRad = angles.shoulder * DEG2RAD;
  const elRad = angles.elbow * DEG2RAD;

  const base: Vector3D = [0, 0, 0];
  const shoulder: Vector3D = [0, 0, dim.baseHeight];

  // In radial-Z plane
  const rElbow = dim.l1 * Math.cos(shRad);
  const zElbow = dim.baseHeight + dim.l1 * Math.sin(shRad);

  const elbow: Vector3D = [
    rElbow * Math.cos(yawRad),
    rElbow * Math.sin(yawRad),
    zElbow
  ];

  const totalPitch = shRad + elRad;
  const rWrist = dim.l1 * Math.cos(shRad) + dim.l2 * Math.cos(totalPitch);
  const zWrist = dim.baseHeight + dim.l1 * Math.sin(shRad) + dim.l2 * Math.sin(totalPitch);

  const wrist: Vector3D = [
    rWrist * Math.cos(yawRad),
    rWrist * Math.sin(yawRad),
    zWrist
  ];

  return {
    base,
    shoulder,
    elbow,
    wrist,
    rWrist,
    deltaZ: zWrist - dim.baseHeight
  };
}

export function solveReachStudy(
  dim: ArmDimensions,
  limits: JointLimits,
  target: Vector3D,
  preferredBranch?: BranchIdentity
): ReachStudy {
  const diagnostics: string[] = [];

  // Validation
  const vDim = validateArmDimensions(dim);
  const vLim = validateJointLimits(limits);
  const vTar = validateTarget(target);

  if (!vDim.isValid || !vLim.isValid || !vTar.isValid) {
    const allErrors = [...vDim.errors, ...vLim.errors, ...vTar.errors];
    return {
      dimensions: dim,
      limits,
      target,
      classification: 'InvalidStudy',
      candidates: [],
      selectedCandidateIndex: -1,
      activeAngles: { yaw: 0, shoulder: 0, elbow: 0 },
      basePosition: [0, 0, 0],
      shoulderPosition: [0, 0, dim.baseHeight ?? 0],
      elbowPosition: [0, 0, dim.baseHeight ?? 0],
      wristPosition: [0, 0, dim.baseHeight ?? 0],
      reachMetrics: {
        r: 0,
        deltaZ: 0,
        directDistance: 0,
        maxReach: 0,
        minReach: 0,
        lengthTolerance: 1e-8,
        isAxisTarget: false
      },
      diagnostics: allErrors
    };
  }

  const [x, y, z] = target;
  const rho = Math.hypot(x, y);
  const deltaZ = z - dim.baseHeight;
  const directDistance = Math.hypot(rho, deltaZ);
  const maxReach = dim.l1 + dim.l2;
  const minReach = Math.abs(dim.l1 - dim.l2);

  const lengthTolerance =
    1e-8 * Math.max(1, maxReach, rho, Math.abs(deltaZ));

  const isAxisTarget = rho <= lengthTolerance;

  const reachMetrics: ReachMetrics = {
    r: rho,
    deltaZ,
    directDistance,
    maxReach,
    minReach,
    lengthTolerance,
    isAxisTarget
  };

  // Case 1: Geometrically unreachable (outside outer shell or inside inner void)
  if (
    directDistance > maxReach + lengthTolerance ||
    directDistance < minReach - lengthTolerance
  ) {
    diagnostics.push(
      directDistance > maxReach
        ? `Target distance ${directDistance.toFixed(2)} mm exceeds maximum arm reach ${maxReach} mm.`
        : `Target distance ${directDistance.toFixed(2)} mm is inside inner void ${minReach} mm.`
    );
    const defaultFk = forwardKinematics(dim, { yaw: 0, shoulder: 0, elbow: 0 });
    return {
      dimensions: dim,
      limits,
      target,
      classification: 'UnreachableGeometry',
      candidates: [],
      selectedCandidateIndex: -1,
      activeAngles: { yaw: 0, shoulder: 0, elbow: 0 },
      basePosition: defaultFk.base,
      shoulderPosition: defaultFk.shoulder,
      elbowPosition: defaultFk.elbow,
      wristPosition: defaultFk.wrist,
      reachMetrics,
      diagnostics
    };
  }

  // Case 2: Axis Target (undetermined yaw continuous family)
  if (isAxisTarget) {
    // In radial-Z plane, we need r_wrist = 0 and z_wrist = deltaZ
    // Direct distance along Z axis:
    const dAxis = Math.abs(deltaZ);
    if (dAxis > maxReach + lengthTolerance || dAxis < minReach - lengthTolerance) {
      diagnostics.push('Target on central axis is outside reach envelope.');
      const defaultFk = forwardKinematics(dim, { yaw: 0, shoulder: 0, elbow: 0 });
      return {
        dimensions: dim,
        limits,
        target,
        classification: 'UnreachableGeometry',
        candidates: [],
        selectedCandidateIndex: -1,
        activeAngles: { yaw: 0, shoulder: 0, elbow: 0 },
        basePosition: defaultFk.base,
        shoulderPosition: defaultFk.shoulder,
        elbowPosition: defaultFk.elbow,
        wristPosition: defaultFk.wrist,
        reachMetrics,
        diagnostics
      };
    }

    let c2 = (dAxis * dAxis - dim.l1 * dim.l1 - dim.l2 * dim.l2) / (2 * dim.l1 * dim.l2);
    if (c2 > 1 && c2 <= 1 + COS_TOLERANCE) c2 = 1;
    if (c2 < -1 && c2 >= -1 - COS_TOLERANCE) c2 = -1;

    if (Math.abs(c2) > 1) {
      diagnostics.push('Numerical indeterminacy computing axis target cosine.');
      return createEmptyStudy(dim, limits, target, reachMetrics, 'NumericallyIndeterminate', diagnostics);
    }

    const elbowRad = Math.acos(c2);
    const elbowSigns = elbowRad === 0 ? [1] : [1, -1];
    const axisCandidates: IKCandidate[] = [];

    for (const elSign of elbowSigns) {
      const eRad = elSign * elbowRad;
      const shRad =
        Math.atan2(deltaZ, 0) -
        Math.atan2(dim.l2 * Math.sin(eRad), dim.l1 + dim.l2 * Math.cos(eRad));

      const angles: JointAngles = {
        yaw: 0,
        shoulder: shRad * RAD2DEG,
        elbow: eRad * RAD2DEG
      };

      const fk = forwardKinematics(dim, angles);
      const residual = Math.hypot(
        fk.wrist[0] - target[0],
        fk.wrist[1] - target[1],
        fk.wrist[2] - target[2]
      );

      const check = checkLimits(angles, limits, lengthTolerance);

      axisCandidates.push({
        branch: elSign > 0 ? 'pos_elbow_up' : 'pos_elbow_down',
        angles,
        anglesRad: { yaw: 0, shoulder: shRad, elbow: eRad },
        wristPosition: fk.wrist,
        elbowPosition: fk.elbow,
        fkResidual: residual,
        isAdmitted: check.isAdmitted,
        rejectionReason: check.reason,
        violatedJoint: check.violatedJoint,
        isSingular: true,
        singularityType: 'axis_undetermined_yaw'
      });
    }

    const anyAdmitted = axisCandidates.some(c => c.isAdmitted);
    const classification: ReachClassification = anyAdmitted
      ? 'DegenerateFamily'
      : 'UnreachableJointLimits';

    diagnostics.push(
      anyAdmitted
        ? 'Target lies on central axis; solutions form a continuous 1-DOF family over yaw angle [undetermined-yaw family].'
        : 'Target lies on central axis but all planar configurations violate joint limits.'
    );

    const activeCand = axisCandidates.find(c => c.isAdmitted) ?? axisCandidates[0];
    const activeAngles = activeCand ? activeCand.angles : { yaw: 0, shoulder: 0, elbow: 0 };
    const activeFk = forwardKinematics(dim, activeAngles);

    return {
      dimensions: dim,
      limits,
      target,
      classification,
      candidates: axisCandidates,
      selectedCandidateIndex: anyAdmitted ? axisCandidates.indexOf(activeCand) : -1,
      activeAngles,
      basePosition: activeFk.base,
      shoulderPosition: activeFk.shoulder,
      elbowPosition: activeFk.elbow,
      wristPosition: activeFk.wrist,
      reachMetrics,
      diagnostics
    };
  }

  // Case 3: Non-axis Target
  let c2 = (directDistance * directDistance - dim.l1 * dim.l1 - dim.l2 * dim.l2) / (2 * dim.l1 * dim.l2);
  if (c2 > 1 && c2 <= 1 + COS_TOLERANCE) c2 = 1;
  if (c2 < -1 && c2 >= -1 - COS_TOLERANCE) c2 = -1;

  if (Math.abs(c2) > 1) {
    diagnostics.push(`Target is outside reach domain (cos(elbow) = ${c2.toFixed(6)}).`);
    return createEmptyStudy(dim, limits, target, reachMetrics, 'UnreachableGeometry', diagnostics);
  }

  const baseElbowRad = Math.acos(c2);
  const isStraightElbow = baseElbowRad < 1e-9;
  const isFoldedElbow = Math.abs(baseElbowRad - Math.PI) < 1e-9;

  // Two signed radial directions:
  // 1) Positive radial: yaw = atan2(y, x), r = +rho
  // 2) Negative radial: yaw = normalizeYaw(atan2(y, x) + 180), r = -rho
  const yawPosRad = Math.atan2(y, x);
  const yawNegRad = Math.atan2(-y, -x);

  const radialConfigs = [
    { yawRad: yawPosRad, r: rho, isPositiveRadial: true },
    { yawRad: yawNegRad, r: -rho, isPositiveRadial: false }
  ];

  const rawCandidates: IKCandidate[] = [];

  for (const radCfg of radialConfigs) {
    const elbowSigns = isStraightElbow ? [1] : [1, -1];
    for (const elSign of elbowSigns) {
      const eRad = elSign * baseElbowRad;
      const branch: BranchIdentity = radCfg.isPositiveRadial
        ? elSign > 0
          ? 'pos_elbow_up'
          : 'pos_elbow_down'
        : elSign > 0
          ? 'neg_elbow_up'
          : 'neg_elbow_down';

      const A = dim.l1 + dim.l2 * Math.cos(eRad);
      const B = dim.l2 * Math.sin(eRad);

      const shRad = Math.atan2(deltaZ, radCfg.r) - Math.atan2(B, A);

      const yawDeg = normalizeYawDeg(radCfg.yawRad * RAD2DEG);
      const shDeg = shRad * RAD2DEG;
      const elDeg = eRad * RAD2DEG;

      const angles: JointAngles = {
        yaw: yawDeg,
        shoulder: shDeg,
        elbow: elDeg
      };

      const fk = forwardKinematics(dim, angles);
      const residual = Math.hypot(
        fk.wrist[0] - target[0],
        fk.wrist[1] - target[1],
        fk.wrist[2] - target[2]
      );

      const limitCheck = checkLimits(angles, limits, lengthTolerance);

      let isSingular = false;
      let singularityType: string | null = null;
      if (isStraightElbow) {
        isSingular = true;
        singularityType = 'straight_elbow_singularity';
      } else if (isFoldedElbow) {
        isSingular = true;
        singularityType = 'folded_elbow_degeneracy';
      }

      rawCandidates.push({
        branch,
        angles,
        anglesRad: { yaw: radCfg.yawRad, shoulder: shRad, elbow: eRad },
        wristPosition: fk.wrist,
        elbowPosition: fk.elbow,
        fkResidual: residual,
        isAdmitted: limitCheck.isAdmitted && residual <= lengthTolerance,
        rejectionReason: limitCheck.reason,
        violatedJoint: limitCheck.violatedJoint,
        isSingular,
        singularityType
      });
    }
  }

  // Deduplicate identical candidates (e.g. straight elbow)
  const candidates: IKCandidate[] = [];
  for (const cand of rawCandidates) {
    const duplicate = candidates.find(
      c =>
        Math.abs(c.angles.yaw - cand.angles.yaw) < 1e-4 &&
        Math.abs(c.angles.shoulder - cand.angles.shoulder) < 1e-4 &&
        Math.abs(c.angles.elbow - cand.angles.elbow) < 1e-4
    );
    if (!duplicate) {
      candidates.push(cand);
    }
  }

  const admitted = candidates.filter(c => c.isAdmitted);
  let classification: ReachClassification;

  if (admitted.length > 0) {
    classification = 'Solved';
    diagnostics.push(
      `Found ${admitted.length} admitted analytic IK candidate(s) out of ${candidates.length} geometric branches.`
    );
  } else if (candidates.length > 0) {
    classification = 'UnreachableJointLimits';
    diagnostics.push(
      `All ${candidates.length} geometric branches are rejected by joint limits.`
    );
  } else {
    classification = 'UnreachableGeometry';
    diagnostics.push('No geometric solutions exist for this target.');
  }

  // Selection preference
  let selectedIndex = -1;
  if (preferredBranch) {
    selectedIndex = candidates.findIndex(c => c.branch === preferredBranch && c.isAdmitted);
  }
  if (selectedIndex < 0) {
    selectedIndex = candidates.findIndex(c => c.isAdmitted);
  }
  if (selectedIndex < 0 && candidates.length > 0) {
    selectedIndex = 0; // fallback to inspect rejected branch
  }

  const activeCand = selectedIndex >= 0 ? candidates[selectedIndex] : null;
  const activeAngles = activeCand ? activeCand.angles : { yaw: 0, shoulder: 0, elbow: 0 };
  const activeFk = forwardKinematics(dim, activeAngles);

  return {
    dimensions: dim,
    limits,
    target,
    classification,
    candidates,
    selectedCandidateIndex: selectedIndex,
    activeAngles,
    basePosition: activeFk.base,
    shoulderPosition: activeFk.shoulder,
    elbowPosition: activeFk.elbow,
    wristPosition: activeFk.wrist,
    reachMetrics,
    diagnostics
  };
}

function checkLimits(
  angles: JointAngles,
  limits: JointLimits,
  tol: number
): {
  isAdmitted: boolean;
  reason: CandidateRejectionReason;
  violatedJoint: JointLimitViolation;
} {
  const [minYaw, maxYaw] = limits.yaw;
  const [minSh, maxSh] = limits.shoulder;
  const [minEl, maxEl] = limits.elbow;

  // Yaw limit check
  if (angles.yaw < minYaw - 1e-6 || angles.yaw > maxYaw + 1e-6) {
    return {
      isAdmitted: false,
      reason: 'OutOfJointLimits',
      violatedJoint: 'yaw'
    };
  }

  // Shoulder limit check
  if (angles.shoulder < minSh - 1e-6 || angles.shoulder > maxSh + 1e-6) {
    return {
      isAdmitted: false,
      reason: 'OutOfJointLimits',
      violatedJoint: 'shoulder'
    };
  }

  // Elbow limit check
  if (angles.elbow < minEl - 1e-6 || angles.elbow > maxEl + 1e-6) {
    return {
      isAdmitted: false,
      reason: 'OutOfJointLimits',
      violatedJoint: 'elbow'
    };
  }

  return {
    isAdmitted: true,
    reason: 'None',
    violatedJoint: null
  };
}

function createEmptyStudy(
  dim: ArmDimensions,
  limits: JointLimits,
  target: Vector3D,
  metrics: ReachMetrics,
  classification: ReachClassification,
  diagnostics: string[]
): ReachStudy {
  const defaultFk = forwardKinematics(dim, { yaw: 0, shoulder: 0, elbow: 0 });
  return {
    dimensions: dim,
    limits,
    target,
    classification,
    candidates: [],
    selectedCandidateIndex: -1,
    activeAngles: { yaw: 0, shoulder: 0, elbow: 0 },
    basePosition: defaultFk.base,
    shoulderPosition: defaultFk.shoulder,
    elbowPosition: defaultFk.elbow,
    wristPosition: defaultFk.wrist,
    reachMetrics: metrics,
    diagnostics
  };
}
