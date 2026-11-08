import { ArmDimensions, JointLimits, Vector3D } from './types';

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export function validateArmDimensions(dim: ArmDimensions): ValidationResult {
  const errors: string[] = [];
  if (!Number.isInteger(dim.l1) || dim.l1 < 1 || dim.l1 > 2047) {
    errors.push('Link 1 length must be an integer between 1 and 2047 mm');
  }
  if (!Number.isInteger(dim.l2) || dim.l2 < 1 || dim.l2 > 2047) {
    errors.push('Link 2 length must be an integer between 1 and 2047 mm');
  }
  if (!Number.isInteger(dim.baseHeight) || dim.baseHeight < 0 || dim.baseHeight > 2047) {
    errors.push('Base height must be an integer between 0 and 2047 mm');
  }
  return { isValid: errors.length === 0, errors };
}

export function validateJointLimits(limits: JointLimits): ValidationResult {
  const errors: string[] = [];
  const [minYaw, maxYaw] = limits.yaw;
  const [minSh, maxSh] = limits.shoulder;
  const [minEl, maxEl] = limits.elbow;

  if (minYaw < -180 || maxYaw > 180 || minYaw > maxYaw) {
    errors.push('Yaw limits must satisfy -180 <= min <= max <= 180 deg');
  }
  if (minSh < -150 || maxSh > 150 || minSh > maxSh) {
    errors.push('Shoulder limits must satisfy -150 <= min <= max <= 150 deg');
  }
  if (minEl < -150 || maxEl > 150 || minEl > maxEl) {
    errors.push('Elbow limits must satisfy -150 <= min <= max <= 150 deg');
  }
  return { isValid: errors.length === 0, errors };
}

export function validateTarget(target: Vector3D): ValidationResult {
  const errors: string[] = [];
  const [x, y, z] = target;
  for (const [val, name] of [[x, 'X'], [y, 'Y'], [z, 'Z']] as const) {
    if (!Number.isFinite(val) || val < -8192 || val > 8191) {
      errors.push(`Target ${name} coordinate must be between -8192 and 8191 mm`);
    }
  }
  return { isValid: errors.length === 0, errors };
}
