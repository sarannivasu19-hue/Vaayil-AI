import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { Sector } from '../../types';
import { HubPortal3D } from './HubPortal3D';
import { SectorNode3D } from './SectorNode3D';

interface VaayilHub3DProps {
  sectors: Sector[];
  selectedSector: Sector | null;
  onSelectSector: (sector: Sector) => void;
}

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
      const index = sectors.findIndex((s) => s.id === selectedSector.id);
      const angle = (index / (sectors.length || 1)) * Math.PI * 2 - Math.PI / 2;
      const sx = Math.cos(angle) * radius;
      const sz = Math.sin(angle) * radius;
      targetPos.current.set(sx * 0.78, 1.1, sz * 0.78 + 2.4);
      targetLook.current.set(sx, 0.2, sz);
    } else {
      const driftX = Math.sin(t * 0.22) * 0.7;
      const driftY = 2.1 + Math.cos(t * 0.30) * 0.22;
      targetPos.current.set(driftX, driftY, 8.5);
      targetLook.current.set(0, 0.3, 0);
    }
    state.camera.position.lerp(targetPos.current, 0.045);
    const currentLook = new THREE.Vector3();
    state.camera.getWorldDirection(currentLook);
    const targetDirection = targetLook.current.clone().sub(state.camera.position).normalize();
    currentLook.lerp(targetDirection, 0.055);
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
        camera={{ position: [0, 2.2, 8.5], fov: 46 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#080B18']} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.0} color="#ffffff" />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} color="#8065FF" />
        <pointLight position={[0, 6, 0]} intensity={0.6} color="#32D8E8" distance={12} />

        {/* Soft environment for metallic reflections */}
        <Environment preset="night" />

        {/* Ambient particles */}
        <Sparkles
          count={60}
          scale={18}
          size={1.8}
          speed={0.25}
          color="#32D8E8"
          opacity={0.5}
        />
        <Sparkles
          count={30}
          scale={14}
          size={1.2}
          speed={0.15}
          color="#A58EFF"
          opacity={0.35}
        />

        {/* Central portal */}
        <HubPortal3D />

        {/* Sector nodes */}
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

        <CameraRig
          selectedSector={selectedSector}
          sectors={sectors}
          radius={RADIUS}
        />
      </Canvas>

      {/* Hub text overlay — cinematic */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-16 z-10">
        <div className="text-center space-y-1.5 opacity-80">
          <p
            className="text-xs tracking-[0.3em] uppercase text-[#9AA7BE]"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            One intelligent voice · Six powerful workspaces
          </p>
          <p className="text-xs text-[#4A5568] font-tamil">
            உங்கள் துறையை தேர்வு செய்ய கிளிக் செய்யவும்
          </p>
        </div>
      </div>
    </div>
  );
};
