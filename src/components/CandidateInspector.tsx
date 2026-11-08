import React from 'react';
import { ReachStudy } from '../core/types';

interface CandidateInspectorProps {
  study: ReachStudy;
  lang: 'pt-BR' | 'en';
  onSelectCandidate: (index: number) => void;
}

export const CandidateInspector: React.FC<CandidateInspectorProps> = ({
  study,
  lang,
  onSelectCandidate
}) => {
  const isPt = lang === 'pt-BR';

  const t = {
    title: isPt ? 'Ramos Cinemáticos Inversos' : 'Inverse Kinematics Branches',
    branch: isPt ? 'Ramo' : 'Branch',
    angles: isPt ? 'Ângulos (Yaw, Ombro, Cotovelo)' : 'Angles (Yaw, Shoulder, Elbow)',
    status: isPt ? 'Estado' : 'Status',
    residual: isPt ? 'Resíduo FK' : 'FK Residual',
    admitted: isPt ? 'Admitido' : 'Admitted',
    rejected: isPt ? 'Rejeitado' : 'Rejected',
    diagnostics: isPt ? 'Diagnósticos' : 'Diagnostics',
    noCandidates: isPt ? 'Nenhum ramo viável encontrado' : 'No viable branches found'
  };

  return (
    <aside style={{
      width: '320px',
      background: '#ffffff',
      borderLeft: '1px solid #cbd5e1',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      overflowY: 'auto',
      fontSize: '12px',
      color: '#202b36'
    }}>
      <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{t.title}</h2>

      {/* Metrics Card */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '10px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px'
      }}>
        <div><strong>{isPt ? 'Distância 3D:' : '3D Distance:'}</strong> {study.reachMetrics.directDistance.toFixed(1)} mm</div>
        <div><strong>{isPt ? 'Raio Radial:' : 'Radial Radius:'}</strong> {study.reachMetrics.r.toFixed(1)} mm</div>
        <div><strong>{isPt ? 'Alcance Máx:' : 'Max Reach:'}</strong> {study.reachMetrics.maxReach} mm</div>
        <div><strong>{isPt ? 'Vazio Mín:' : 'Min Void:'}</strong> {study.reachMetrics.minReach} mm</div>
      </div>

      {/* Candidates List */}
      {study.candidates.length === 0 ? (
        <div style={{ color: '#64748b', fontStyle: 'italic' }}>{t.noCandidates}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {study.candidates.map((c, idx) => {
            const isSelected = idx === study.selectedCandidateIndex;
            return (
              <div
                key={c.branch + idx}
                onClick={() => onSelectCandidate(idx)}
                style={{
                  border: isSelected ? '2px solid #235bd4' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: 'pointer',
                  background: isSelected ? '#eff6ff' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '12px' }}>{c.branch}</strong>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: c.isAdmitted ? '#dcfce7' : '#fee2e2',
                    color: c.isAdmitted ? '#15803d' : '#b91c1c'
                  }}>
                    {c.isAdmitted ? t.admitted : t.rejected}
                  </span>
                </div>

                <div style={{ color: '#475569', marginBottom: '2px' }}>
                  {t.angles}:
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', background: '#f8fafc', padding: '4px', borderRadius: '4px' }}>
                  yaw: {c.angles.yaw.toFixed(1)}° | sh: {c.angles.shoulder.toFixed(1)}° | el: {c.angles.elbow.toFixed(1)}°
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                  <span>{t.residual}: {c.fkResidual < 1e-9 ? '0.0 mm' : `${c.fkResidual.toExponential(2)} mm`}</span>
                  {c.isSingular && <span style={{ color: '#d97706', fontWeight: 600 }}>Singular</span>}
                </div>

                {!c.isAdmitted && (
                  <div style={{ color: '#b91c1c', fontSize: '10px', marginTop: '4px' }}>
                    Rejeição: {c.rejectionReason} ({c.violatedJoint})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Diagnostics */}
      {study.diagnostics.length > 0 && (
        <div style={{
          marginTop: 'auto',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '10px',
          fontSize: '11px',
          color: '#475569'
        }}>
          <strong>{t.diagnostics}:</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
            {study.diagnostics.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
};
