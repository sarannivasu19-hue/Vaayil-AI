import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const HubPortal3D: React.FC = () => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.15;
      outerRingRef.current.rotation.x = Math.sin(t * 0.4) * 0.08;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.25;
      innerRingRef.current.rotation.y = Math.cos(t * 0.4) * 0.08;
    }
    if (coreRef.current) {
      const scale = 1 + Math.sin(t * 1.5) * 0.06;
      coreRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central Vaayil (Doorway) Arch Geometry */}
      <group position={[0, 0.4, 0]}>
        {/* Left Pillar */}
        <mesh position={[-1.2, 0, 0]}>
          <boxGeometry args={[0.22, 2.8, 0.22]} />
          <meshStandardMaterial
            color="#1e293b"
            emissive="#0284c7"
            emissiveIntensity={0.25}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Right Pillar */}
        <mesh position={[1.2, 0, 0]}>
          <boxGeometry args={[0.22, 2.8, 0.22]} />
          <meshStandardMaterial
            color="#1e293b"
            emissive="#0284c7"
            emissiveIntensity={0.25}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Top Arch Beam */}
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[2.62, 0.25, 0.25]} />
          <meshStandardMaterial
            color="#1e293b"
            emissive="#06b6d4"
            emissiveIntensity={0.4}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </group>

      {/* Outer Rotating Energy Ring */}
      <mesh ref={outerRingRef} position={[0, 0.4, 0]}>
        <torusGeometry args={[2.0, 0.045, 16, 64]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#06b6d4"
          emissiveIntensity={1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Inner Rotating Energy Ring */}
      <mesh ref={innerRingRef} position={[0, 0.4, 0]}>
        <torusGeometry args={[1.5, 0.035, 16, 48]} />
        <meshStandardMaterial
          color="#818cf8"
          emissive="#6366f1"
          emissiveIntensity={1.6}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Glowing Doorway Core (Vaayil Portal Essence) */}
      <mesh ref={coreRef} position={[0, 0.4, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.05, 32]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ground Reflector Pedestal */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.8, 32]} />
        <meshStandardMaterial
          color="#090d16"
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[0, -1.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.6, 2.75, 48]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.4} />
      </mesh>

      {/* Central Portal Glow Lights */}
      <pointLight position={[0, 0.5, 0.5]} color="#38bdf8" intensity={3.5} distance={7} />
      <pointLight position={[0, 0.5, -0.5]} color="#818cf8" intensity={2.0} distance={5} />
    </group>
  );
};
