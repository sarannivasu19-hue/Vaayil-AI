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
  const pedestalRef = useRef<THREE.Mesh>(null);
  const emblemRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Position on the circular radius around the central AI core
  const posX = Math.cos(angle) * radius;
  const posZ = Math.sin(angle) * radius;
  const basePosY = 0.15;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Slow, elegant idle floating motion (NO spinning!)
    if (groupRef.current) {
      const floatOffset = Math.sin(t * 1.2 + angle * 2) * 0.08;
      groupRef.current.position.y = basePosY + floatOffset;
    }

    // 2. Subtle emblem orientation towards center with gentle breathing
    if (emblemRef.current) {
      const scale = isSelected ? 1.25 : hovered ? 1.15 : 1.0;
      emblemRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      // Gentle orientation breathing, NOT continuous rotation
      emblemRef.current.rotation.y = Math.sin(t * 0.6 + angle) * 0.15;
    }
  });

  const accentColor = sector.accent_color || '#32D8E8';

  return (
    <group ref={groupRef} position={[posX, basePosY, posZ]}>
      {/* ============================================================
          1. 3D GLASS PODIUM & SECTOR GLYPH
          ============================================================ */}
      {/* Translucent Frosted Glass Base Pedestal */}
      <mesh
        ref={pedestalRef}
        position={[0, -0.3, 0]}
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
      >
        <cylinderGeometry args={[0.55, 0.68, 0.16, 6]} />
        <meshPhysicalMaterial
          color="#0A1124"
          emissive={accentColor}
          emissiveIntensity={hovered || isSelected ? 0.6 : 0.2}
          roughness={0.2}
          metalness={0.4}
          transmission={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Luminous Core Emblem (Stationary, subtle breathing pulse) */}
      <mesh
        ref={emblemRef}
        position={[0, 0.25, 0]}
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
      >
        <cylinderGeometry args={[0.38, 0.38, 0.08, 32]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={isSelected ? 2.0 : hovered ? 1.6 : 0.8}
          roughness={0.15}
          metalness={0.8}
        />
      </mesh>

      {/* Subtle Ground Halo under node */}
      <mesh position={[0, -0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.72, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={hovered || isSelected ? 0.7 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Focused Point Light */}
      <pointLight
        color={accentColor}
        intensity={isSelected ? 3.0 : hovered ? 2.2 : 0.9}
        distance={4}
      />

      {/* ============================================================
          2. BILLBOARD SECTOR INTERACTION CARD (TAMIL + ENGLISH)
          ============================================================ */}
      <Html
        position={[0, -0.85, 0]}
        center
        distanceFactor={11}
        zIndexRange={[100, 0]}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(sector);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(sector);
            }
          }}
          className={`cursor-pointer transition-all duration-300 transform select-none outline-none ${
            hovered || isSelected ? 'scale-108 -translate-y-1' : 'scale-100 opacity-95'
          }`}
        >
          <div
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all"
            style={{
              backgroundColor: hovered || isSelected ? 'rgba(10, 15, 30, 0.94)' : 'rgba(8, 12, 24, 0.82)',
              borderColor: hovered || isSelected ? accentColor : 'rgba(255, 255, 255, 0.12)',
              boxShadow: hovered || isSelected ? `0 0 25px ${accentColor}45, 0 10px 30px rgba(0,0,0,0.7)` : '0 6px 18px rgba(0,0,0,0.5)',
            }}
          >
            {/* Sector Icon */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-transform"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}45`,
                color: accentColor,
              }}
            >
              <DynamicIcon name={sector.icon} className="w-4 h-4" />
            </div>

            {/* Labels */}
            <div className="flex flex-col text-left whitespace-nowrap pr-1.5">
              <span className="text-xs font-bold tracking-wide text-white font-tamil leading-tight">
                {sector.display_name_ta}
              </span>
              <span className="text-[10px] text-[#9AA7BE] font-medium tracking-tight">
                {sector.name}
              </span>
            </div>

            {/* Hover Arrow Prompt */}
            {hovered && (
              <span className="text-xs font-mono font-bold pl-1 animate-pulse" style={{ color: accentColor }}>
                →
              </span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
};
