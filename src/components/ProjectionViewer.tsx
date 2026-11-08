import React from 'react';
import { ReachStudy } from '../core/types';
import { generateReachSvg } from '../core/svg';

interface ProjectionViewerProps {
  study: ReachStudy;
}

export const ProjectionViewer: React.FC<ProjectionViewerProps> = ({ study }) => {
  const svg = generateReachSvg(study, 700, 480);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f6f7',
      overflow: 'auto',
      padding: '16px'
    }}>
      <div
        dangerouslySetInnerHTML={{ __html: svg }}
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderRadius: '6px',
          background: '#ffffff'
        }}
      />
    </div>
  );
};
