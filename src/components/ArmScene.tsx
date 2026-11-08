import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ReachStudy } from '../core/types';

interface ArmSceneProps {
  study: ReachStudy;
}

export const ArmScene: React.FC<ArmSceneProps> = ({ study }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f6f7);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(200, 300, 400);
    scene.add(dirLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 20000);
    const maxReach = Math.max(100, study.reachMetrics.maxReach);
    camera.position.set(maxReach * 2, maxReach * 2, maxReach * 2.2);
    camera.lookAt(0, 0, study.dimensions.baseHeight + maxReach * 0.3);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Grid at z=0 (Three.js coordinates: Y is up, or Z is up if rotated)
    // Here we use standard 3D coordinates where Z is up:
    const grid = new THREE.GridHelper(maxReach * 4, 20, 0x94a3b8, 0xe2e8f0);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    // Materials
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
    const link1Mat = new THREE.MeshStandardMaterial({ color: 0x202b36, roughness: 0.3 });
    const link2Mat = new THREE.MeshStandardMaterial({ color: 0x235bd4, roughness: 0.3 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.2 });

    const targetColor =
      study.classification === 'Solved'
        ? 0x107c41
        : study.classification === 'UnreachableGeometry'
        ? 0xd83b01
        : 0xd13438;
    const targetMat = new THREE.MeshStandardMaterial({ color: targetColor, roughness: 0.2 });

    // Helper function to create cylinder between two 3D points
    const createSegment = (
      p1: [number, number, number],
      p2: [number, number, number],
      radius: number,
      mat: THREE.Material
    ) => {
      const v1 = new THREE.Vector3(p1[0], p1[1], p1[2]);
      const v2 = new THREE.Vector3(p2[0], p2[1], p2[2]);
      const dir = new THREE.Vector3().subVectors(v2, v1);
      const len = dir.length();
      if (len < 1e-4) return null;

      const geom = new THREE.CylinderGeometry(radius, radius, len, 16);
      const mesh = new THREE.Mesh(geom, mat);

      // Position at midpoint
      mesh.position.copy(v1).addScaledVector(dir, 0.5);

      // Rotate to align cylinder Y axis with direction
      const orientation = new THREE.Matrix4();
      const up = new THREE.Vector3(0, 1, 0);
      orientation.lookAt(v1, v2, up);
      mesh.quaternion.setFromRotationMatrix(orientation);
      mesh.rotateX(Math.PI / 2);

      return mesh;
    };

    // 1. Pedestal Base
    if (study.dimensions.baseHeight > 0) {
      const pedestal = createSegment([0, 0, 0], [0, 0, study.dimensions.baseHeight], 8, baseMat);
      if (pedestal) scene.add(pedestal);
    }

    // Joint Spheres
    const jointRadius = 7;
    const sphereGeom = new THREE.SphereGeometry(jointRadius, 16, 16);

    const shSphere = new THREE.Mesh(sphereGeom, jointMat);
    shSphere.position.set(0, 0, study.dimensions.baseHeight);
    scene.add(shSphere);

    const elbSphere = new THREE.Mesh(sphereGeom, jointMat);
    elbSphere.position.set(study.elbowPosition[0], study.elbowPosition[1], study.elbowPosition[2]);
    scene.add(elbSphere);

    const wristSphere = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), jointMat);
    wristSphere.position.set(study.wristPosition[0], study.wristPosition[1], study.wristPosition[2]);
    scene.add(wristSphere);

    // 2. Arm Links
    const link1 = createSegment(study.shoulderPosition, study.elbowPosition, 6, link1Mat);
    if (link1) scene.add(link1);

    const link2 = createSegment(study.elbowPosition, study.wristPosition, 5, link2Mat);
    if (link2) scene.add(link2);

    // 3. Target Marker
    const targetSphere = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), targetMat);
    targetSphere.position.set(study.target[0], study.target[1], study.target[2]);
    scene.add(targetSphere);

    // 4. Reach Envelope (Wireframe Sphere)
    const envelopeGeom = new THREE.SphereGeometry(study.reachMetrics.maxReach, 24, 16);
    const envelopeMat = new THREE.MeshBasicMaterial({
      color: 0x235bd4,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    const envelope = new THREE.Mesh(envelopeGeom, envelopeMat);
    envelope.position.set(0, 0, study.dimensions.baseHeight);
    scene.add(envelope);

    let animationFrameId: number;
    let angle = 0;

    const animate = () => {
      // Gentle auto-inspection rotation
      angle += 0.003;
      const dist = maxReach * 2.5;
      camera.position.x = dist * Math.cos(angle);
      camera.position.y = dist * Math.sin(angle);
      camera.lookAt(0, 0, study.dimensions.baseHeight + maxReach * 0.2);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      baseMat.dispose();
      link1Mat.dispose();
      link2Mat.dispose();
      jointMat.dispose();
      targetMat.dispose();
      sphereGeom.dispose();
      envelopeGeom.dispose();
      envelopeMat.dispose();
      container.innerHTML = '';
    };
  }, [study]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
        background: '#f3f6f7'
      }}
    />
  );
};
