import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { Sector } from '../../types';
import { HubPortal3D } from './HubPortal3D';
import { SectorNode3D } from './SectorNode3D';

interface VaayilHub3DProps {
  sectors: Sector[];
  selectedSector: Sector | null;
  onSelectSector: (sector: Sector) => void;
}

// Camera controller component with smooth lerp transitions
const CameraRig: React.FC<{
  selectedSector: Sector | null;
  sectors: Sector[];
  radius: number;
}> = ({ selectedSector, sectors, radius }) => {
  const targetPos = useRef(new THREE.Vector3(0, 2.2, 8.5));
  const targetLook = useRef(new THREE.Vector3(0, 0.4, 0));

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (selectedSector) {
      // Find index and angle of selected sector
      const index = sectors.findIndex((s) => s.id === selectedSector.id);
      const angle = (index / (sectors.length || 1)) * Math.PI * 2 - Math.PI / 2;
      const sx = Math.cos(angle) * radius;
      const sz = Math.sin(angle) * radius;

      // Position camera slightly back and above the selected node
      targetPos.current.set(sx * 0.78, 1.1, sz * 0.78 + 2.4);
      targetLook.current.set(sx, 0.2, sz);
    } else {
      // Idle camera drifting smoothly
      const driftX = Math.sin(t * 0.25) * 0.8;
      const driftY = 2.0 + Math.cos(t * 0.35) * 0.25;
      targetPos.current.set(driftX, driftY, 8.5);
      targetLook.current.set(0, 0.3, 0);
    }

    // Smooth lerp movement
    state.camera.position.lerp(targetPos.current, 0.05);

    // LookAt smoothing
    const currentLook = new THREE.Vector3();
    state.camera.getWorldDirection(currentLook);
    const targetDirection = targetLook.current.clone().sub(state.camera.position).normalize();
    currentLook.lerp(targetDirection, 0.06);
    state.camera.lookAt(state.camera.position.clone().add(currentLook));
  });

  return null;
};

export const VaayilHub3D: React.FC<VaayilHub3DProps> = ({
  sectors,
  selectedSector,
  onSelectSector,
}) => {
  const RADIUS = 4.4;

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        camera={{ position: [0, 2.2, 8.5], fov: 48 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#070b14']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#38bdf8" />

        {/* Ambient Floating Dust / Starlight */}
        <Sparkles
          count={75}
          scale={16}
          size={2.2}
          speed={0.3}
          color="#38bdf8"
          opacity={0.65}
        />

        {/* Central Vaayil Portal Mesh */}
        <HubPortal3D />

        {/* Orbiting Sector Nodes */}
        {sectors.map((sector, index) => {
          const angle = (index / (sectors.length || 1)) * Math.PI * 2 - Math.PI / 2;
          return (
            <SectorNode3D
              key={sector.id}
              sector={sector}
              angle={angle}
              radius={RADIUS}
              isSelected={selectedSector?.id === sector.id}
              onSelect={onSelectSector}
            />
          );
        })}

        {/* Smooth Camera Animator */}
        <CameraRig
          selectedSector={selectedSector}
          sectors={sectors}
          radius={RADIUS}
        />
      </Canvas>
    </div>
  );
};
