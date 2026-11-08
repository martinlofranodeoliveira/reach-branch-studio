export type Vector3D = [x: number, y: number, z: number];

export interface ArmDimensions {
  readonly l1: number; // mm [1, 2047]
  readonly l2: number; // mm [1, 2047]
  readonly baseHeight: number; // mm [0, 2047]
}

export interface JointLimits {
  readonly yaw: [min: number, max: number]; // degrees [-180, 180)
  readonly shoulder: [min: number, max: number]; // degrees [-150, 150]
  readonly elbow: [min: number, max: number]; // degrees [-150, 150]
}

export interface JointAngles {
  readonly yaw: number; // degrees
  readonly shoulder: number; // degrees
  readonly elbow: number; // degrees
}

export type BranchIdentity =
  | 'pos_elbow_up'
  | 'pos_elbow_down'
  | 'neg_elbow_up'
  | 'neg_elbow_down';

export type CandidateRejectionReason =
  | 'OutOfJointLimits'
  | 'DegenerateElbow'
  | 'None';

export type JointLimitViolation = 'yaw' | 'shoulder' | 'elbow' | null;

export interface IKCandidate {
  readonly branch: BranchIdentity;
  readonly angles: JointAngles;
  readonly anglesRad: JointAngles;
  readonly wristPosition: Vector3D;
  readonly elbowPosition: Vector3D;
  readonly fkResidual: number;
  readonly isAdmitted: boolean;
  readonly rejectionReason: CandidateRejectionReason;
  readonly violatedJoint: JointLimitViolation;
  readonly isSingular: boolean;
  readonly singularityType: string | null;
}

export type ReachClassification =
  | 'Solved'
  | 'UnreachableGeometry'
  | 'UnreachableJointLimits'
  | 'DegenerateFamily'
  | 'InvalidStudy'
  | 'NumericallyIndeterminate';

export interface ReachMetrics {
  readonly r: number;
  readonly deltaZ: number;
  readonly directDistance: number;
  readonly maxReach: number;
  readonly minReach: number;
  readonly lengthTolerance: number;
  readonly isAxisTarget: boolean;
}

export interface ReachStudy {
  readonly dimensions: ArmDimensions;
  readonly limits: JointLimits;
  readonly target: Vector3D;
  readonly classification: ReachClassification;
  readonly candidates: readonly IKCandidate[];
  readonly selectedCandidateIndex: number;
  readonly activeAngles: JointAngles;
  readonly basePosition: Vector3D;
  readonly shoulderPosition: Vector3D;
  readonly elbowPosition: Vector3D;
  readonly wristPosition: Vector3D;
  readonly reachMetrics: ReachMetrics;
  readonly diagnostics: readonly string[];
}
