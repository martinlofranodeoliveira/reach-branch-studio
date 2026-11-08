import React, { useState, useMemo } from 'react';
import { ArmDimensions, BranchIdentity, JointLimits, Vector3D } from './core/types';
import { solveReachStudy } from './core/kinematics';
import { generateReachSvg } from './core/svg';
import { Toolbar } from './components/Toolbar';
import { ArmScene } from './components/ArmScene';
import { ProjectionViewer } from './components/ProjectionViewer';
import { CandidateInspector } from './components/CandidateInspector';

const DEFAULT_DIMENSIONS: ArmDimensions = {
  l1: 120,
  l2: 80,
  baseHeight: 40
};

const DEFAULT_LIMITS: JointLimits = {
  yaw: [-180, 180],
  shoulder: [-150, 150],
  elbow: [-150, 150]
};

const DEFAULT_TARGET: Vector3D = [100, 50, 80];

export const App: React.FC = () => {
  const [dimensions, setDimensions] = useState<ArmDimensions>(DEFAULT_DIMENSIONS);
  const [limits, setLimits] = useState<JointLimits>(DEFAULT_LIMITS);
  const [target, setTarget] = useState<Vector3D>(DEFAULT_TARGET);
  const [preferredBranch, setPreferredBranch] = useState<BranchIdentity | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [lang, setLang] = useState<'pt-BR' | 'en'>('pt-BR');

  const study = useMemo(() => {
    return solveReachStudy(dimensions, limits, target, preferredBranch);
  }, [dimensions, limits, target, preferredBranch]);

  const handleSelectCandidate = (index: number) => {
    if (study.candidates[index]) {
      setPreferredBranch(study.candidates[index].branch);
    }
  };

  const handleApplyPreset = (name: string) => {
    if (name === 'standard') {
      setDimensions({ l1: 120, l2: 80, baseHeight: 40 });
      setLimits(DEFAULT_LIMITS);
      setTarget([100, 50, 80]);
      setPreferredBranch(undefined);
    } else if (name === 'axis') {
      setDimensions({ l1: 100, l2: 100, baseHeight: 50 });
      setLimits(DEFAULT_LIMITS);
      setTarget([0, 0, 150]);
      setPreferredBranch(undefined);
    } else if (name === 'singularity') {
      setDimensions({ l1: 100, l2: 100, baseHeight: 0 });
      setLimits(DEFAULT_LIMITS);
      setTarget([200, 0, 0]);
      setPreferredBranch(undefined);
    } else if (name === 'restricted') {
      setDimensions({ l1: 100, l2: 100, baseHeight: 0 });
      setLimits({
        yaw: [-180, 180],
        shoulder: [-150, 150],
        elbow: [-30, 30] // restricts 90 deg required for (100, 0, 100)
      });
      setTarget([100, 0, 100]);
      setPreferredBranch(undefined);
    }
  };

  const handleExportSvg = () => {
    const svg = generateReachSvg(study, 800, 600);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reach-study-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <Toolbar
        study={study}
        lang={lang}
        onLangToggle={() => setLang(l => (l === 'pt-BR' ? 'en' : 'pt-BR'))}
        viewMode={viewMode}
        onViewModeToggle={() => setViewMode(v => (v === '3d' ? '2d' : '3d'))}
        onDimensionsChange={setDimensions}
        onTargetChange={setTarget}
        onLimitsChange={setLimits}
        onSelectCandidate={handleSelectCandidate}
        onExportSvg={handleExportSvg}
        onApplyPreset={handleApplyPreset}
      />

      <div style={{
        display: 'flex',
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <main style={{ flex: 1, position: 'relative' }}>
          {viewMode === '3d' ? (
            <ArmScene study={study} />
          ) : (
            <ProjectionViewer study={study} />
          )}
        </main>

        <CandidateInspector
          study={study}
          lang={lang}
          onSelectCandidate={handleSelectCandidate}
        />
      </div>
    </div>
  );
};
