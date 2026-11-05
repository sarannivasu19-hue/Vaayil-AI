import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Sector } from '../../types';
import { DynamicIcon } from '../ui/Icons';

interface SectorNode3DProps {
  sector: Sector;
  angle: number;
  radius: number;
  isSelected: boolean;
  onSelect: (sector: Sector) => void;
  onHover?: (sector: Sector | null) => void;
}

export const SectorNode3D: React.FC<SectorNode3DProps> = ({
  sector,
  angle,
  radius,
  isSelected,
  onSelect,
  onHover,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Compute position on the circular ring
  const posX = Math.cos(angle) * radius;
  const posZ = Math.sin(angle) * radius;
  const basePosY = 0.2;

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Gentle floating animation per node with phase offset
      const floatY = Math.sin(t * 1.8 + angle) * 0.12;
      groupRef.current.position.y = basePosY + floatY;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (hovered ? 1.5 : 0.6);
      meshRef.current.rotation.x = Math.sin(t * 1.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[posX, basePosY, posZ]}>
      {/* 3D Floating Crystal / Polyhedron Gem */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(sector);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover?.(sector);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(null);
          document.body.style.cursor = 'auto';
        }}
        scale={isSelected ? 1.3 : hovered ? 1.18 : 1.0}
      >
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color={sector.accent_color}
          emissive={sector.accent_color}
          emissiveIntensity={isSelected ? 1.6 : hovered ? 1.2 : 0.6}
          roughness={0.15}
          metalness={0.7}
          wireframe={false}
        />
      </mesh>

      {/* Orbiting Halo Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.75, 0.82, 32]} />
        <meshBasicMaterial
          color={sector.accent_color}
          transparent
          opacity={hovered || isSelected ? 0.9 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Localized Point Light */}
      <pointLight
        color={sector.accent_color}
        intensity={isSelected ? 2.5 : hovered ? 1.8 : 0.8}
        distance={3.5}
      />

      {/* 3D Billboard Label with Tamil & English Text */}
      <Html
        position={[0, -0.9, 0]}
        center
        distanceFactor={11}
        zIndexRange={[100, 0]}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(sector);
          }}
          className={`cursor-pointer transition-all duration-300 transform select-none ${
            hovered || isSelected ? 'scale-110' : 'scale-100 opacity-90'
          }`}
        >
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-xl"
            style={{
              backgroundColor: hovered || isSelected ? 'rgba(15, 23, 42, 0.92)' : 'rgba(10, 16, 30, 0.75)',
              borderColor: hovered || isSelected ? sector.accent_color : 'rgba(255, 255, 255, 0.12)',
              boxShadow: hovered || isSelected ? `0 0 20px ${sector.accent_color}40` : '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${sector.accent_color}25`, color: sector.accent_color }}
            >
              <DynamicIcon name={sector.icon} className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left whitespace-nowrap pr-1">
              <span className="text-xs font-semibold tracking-wide text-white font-tamil">
                {sector.display_name_ta.split(' ')[0]} {sector.display_name_ta.split(' ')[1] || ''}
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                {sector.display_name_en.length > 20 ? sector.name : sector.display_name_en}
              </span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};
