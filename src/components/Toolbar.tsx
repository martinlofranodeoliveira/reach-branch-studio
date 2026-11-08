import React from 'react';
import { ArmDimensions, BranchIdentity, JointLimits, ReachStudy, Vector3D } from '../core/types';

interface ToolbarProps {
  study: ReachStudy;
  lang: 'pt-BR' | 'en';
  onLangToggle: () => void;
  viewMode: '3d' | '2d';
  onViewModeToggle: () => void;
  onDimensionsChange: (dim: ArmDimensions) => void;
  onTargetChange: (target: Vector3D) => void;
  onLimitsChange: (limits: JointLimits) => void;
  onSelectCandidate: (index: number) => void;
  onExportSvg: () => void;
  onApplyPreset: (name: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  study,
  lang,
  onLangToggle,
  viewMode,
  onViewModeToggle,
  onDimensionsChange,
  onTargetChange,
  onLimitsChange,
  onSelectCandidate,
  onExportSvg,
  onApplyPreset
}) => {
  const isPt = lang === 'pt-BR';

  const t = {
    title: isPt ? 'Reach Branch Studio' : 'Reach Branch Studio',
    dimensions: isPt ? 'Dimensões (mm)' : 'Dimensions (mm)',
    l1: isPt ? 'Elo 1 (L1)' : 'Link 1 (L1)',
    l2: isPt ? 'Elo 2 (L2)' : 'Link 2 (L2)',
    baseH: isPt ? 'Altura Base' : 'Base Height',
    target: isPt ? 'Alvo (X, Y, Z)' : 'Target (X, Y, Z)',
    limits: isPt ? 'Limites Articulares (°)' : 'Joint Limits (deg)',
    yawLimit: isPt ? 'Giro (Yaw)' : 'Base Yaw',
    shoulderLimit: isPt ? 'Ombro' : 'Shoulder',
    elbowLimit: isPt ? 'Cotovelo' : 'Elbow',
    branches: isPt ? 'Ramos Analíticos' : 'Analytic Branches',
    presets: isPt ? 'Predefinições' : 'Presets',
    view3d: isPt ? 'Vista 3D' : '3D View',
    view2d: isPt ? 'Plano 2D (Radial/Z)' : '2D Plan (Radial/Z)',
    exportSvg: isPt ? 'Exportar SVG' : 'Export SVG',
    status: isPt ? 'Classificação' : 'Classification'
  };

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #cbd5e1',
      padding: '12px 20px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: '#202b36'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{t.title}</h1>
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          padding: '4px 8px',
          borderRadius: '4px',
          background: study.classification === 'Solved' ? '#dcfce7' : '#fee2e2',
          color: study.classification === 'Solved' ? '#15803d' : '#b91c1c'
        }}>
          {study.classification}
        </span>
      </div>

      {/* Preset buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{t.presets}:</span>
        <button
          onClick={() => onApplyPreset('standard')}
          style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        >
          {isPt ? 'Padrão' : 'Standard'}
        </button>
        <button
          onClick={() => onApplyPreset('axis')}
          style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        >
          {isPt ? 'Eixo Z' : 'Axis Z'}
        </button>
        <button
          onClick={() => onApplyPreset('singularity')}
          style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        >
          {isPt ? 'Singularidade' : 'Singularity'}
        </button>
        <button
          onClick={() => onApplyPreset('restricted')}
          style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        >
          {isPt ? 'Limites Rígidos' : 'Restricted'}
        </button>
      </div>

      {/* View Mode & Actions */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={onViewModeToggle}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: '4px',
            border: '1px solid #235bd4',
            background: viewMode === '3d' ? '#235bd4' : '#ffffff',
            color: viewMode === '3d' ? '#ffffff' : '#235bd4'
          }}
        >
          {viewMode === '3d' ? t.view2d : t.view3d}
        </button>
        <button
          onClick={onExportSvg}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            cursor: 'pointer',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            background: '#ffffff'
          }}
        >
          {t.exportSvg}
        </button>
        <button
          onClick={onLangToggle}
          style={{
            padding: '6px 10px',
            fontSize: '13px',
            cursor: 'pointer',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            background: '#f8fafc'
          }}
        >
          {isPt ? 'EN' : 'PT'}
        </button>
      </div>

      {/* Parameter Controls Bar */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        paddingTop: '8px',
        borderTop: '1px solid #f1f5f9',
        fontSize: '13px'
      }}>
        {/* Dimensions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <strong>{t.dimensions}:</strong>
          <label>
            L1:{' '}
            <input
              type="number"
              min={1}
              max={2047}
              value={study.dimensions.l1}
              onChange={e => onDimensionsChange({ ...study.dimensions, l1: parseInt(e.target.value, 10) || 1 })}
              style={{ width: '60px', padding: '2px 4px' }}
            />
          </label>
          <label>
            L2:{' '}
            <input
              type="number"
              min={1}
              max={2047}
              value={study.dimensions.l2}
              onChange={e => onDimensionsChange({ ...study.dimensions, l2: parseInt(e.target.value, 10) || 1 })}
              style={{ width: '60px', padding: '2px 4px' }}
            />
          </label>
          <label>
            Base Z:{' '}
            <input
              type="number"
              min={0}
              max={2047}
              value={study.dimensions.baseHeight}
              onChange={e => onDimensionsChange({ ...study.dimensions, baseHeight: parseInt(e.target.value, 10) || 0 })}
              style={{ width: '60px', padding: '2px 4px' }}
            />
          </label>
        </div>

        {/* Target */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <strong>{t.target}:</strong>
          <label>
            X:{' '}
            <input
              type="number"
              min={-8192}
              max={8191}
              value={study.target[0]}
              onChange={e => onTargetChange([parseInt(e.target.value, 10) || 0, study.target[1], study.target[2]])}
              style={{ width: '65px', padding: '2px 4px' }}
            />
          </label>
          <label>
            Y:{' '}
            <input
              type="number"
              min={-8192}
              max={8191}
              value={study.target[1]}
              onChange={e => onTargetChange([study.target[0], parseInt(e.target.value, 10) || 0, study.target[2]])}
              style={{ width: '65px', padding: '2px 4px' }}
            />
          </label>
          <label>
            Z:{' '}
            <input
              type="number"
              min={-8192}
              max={8191}
              value={study.target[2]}
              onChange={e => onTargetChange([study.target[0], study.target[1], parseInt(e.target.value, 10) || 0])}
              style={{ width: '65px', padding: '2px 4px' }}
            />
          </label>
        </div>

        {/* Branch Selector */}
        {study.candidates.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <strong>{t.branches}:</strong>
            {study.candidates.map((cand, idx) => {
              const isSelected = idx === study.selectedCandidateIndex;
              return (
                <button
                  key={cand.branch + idx}
                  onClick={() => onSelectCandidate(idx)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '11px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #235bd4' : '1px solid #cbd5e1',
                    background: cand.isAdmitted ? (isSelected ? '#235bd4' : '#f0fdf4') : '#fef2f2',
                    color: cand.isAdmitted ? (isSelected ? '#ffffff' : '#166534') : '#991b1b'
                  }}
                  title={cand.isAdmitted ? `Residual: ${cand.fkResidual.toExponential(2)}` : `Rejected: ${cand.rejectionReason} (${cand.violatedJoint})`}
                >
                  {cand.branch} {cand.isAdmitted ? '✓' : '✗'}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
