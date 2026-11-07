import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const HubPortal3D: React.FC = () => {
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const outerGlassRef = useRef<THREE.Mesh>(null);
  const neuralRing1Ref = useRef<THREE.Mesh>(null);
  const neuralRing2Ref = useRef<THREE.Mesh>(null);
  const groundGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Central Holographic Core breathing (slow, organic pulse)
    if (coreMeshRef.current) {
      const breath = 1.0 + Math.sin(t * 1.5) * 0.06;
      coreMeshRef.current.scale.set(breath, breath, breath);
      // Gentle subtle wobble in rotation, not wild continuous spinning
      coreMeshRef.current.rotation.y = Math.sin(t * 0.3) * 0.25;
      coreMeshRef.current.rotation.x = Math.cos(t * 0.25) * 0.15;
    }

    // 2. Outer frosted glass sphere gentle elevation
    if (outerGlassRef.current) {
      outerGlassRef.current.position.y = 0.5 + Math.sin(t * 0.8) * 0.05;
      outerGlassRef.current.rotation.y = Math.sin(t * 0.15) * 0.1;
    }

    // 3. Subtle neural wave rings with slow elegant tilt
    if (neuralRing1Ref.current) {
      neuralRing1Ref.current.rotation.x = Math.PI / 2.3 + Math.sin(t * 0.5) * 0.08;
      neuralRing1Ref.current.rotation.y = Math.cos(t * 0.4) * 0.1;
    }
    if (neuralRing2Ref.current) {
      neuralRing2Ref.current.rotation.x = Math.PI / 1.8 + Math.cos(t * 0.45) * 0.08;
      neuralRing2Ref.current.rotation.y = Math.sin(t * 0.35) * 0.12;
    }

    // 4. Ground subtle glow pulse
    if (groundGlowRef.current) {
      const glowScale = 1.0 + Math.sin(t * 1.2) * 0.04;
      groundGlowRef.current.scale.set(glowScale, glowScale, 1);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ============================================================
          1. CENTRAL INTELLIGENT AI VOICE CORE
          ============================================================ */}
      <group position={[0, 0.5, 0]}>
        {/* Inner Pulsing Audio Energy Core (Emissive Cyan/Violet) */}
        <mesh ref={coreMeshRef}>
          <icosahedronGeometry args={[0.78, 4]} />
          <meshStandardMaterial
            color="#32D8E8"
            emissive="#8065FF"
            emissiveIntensity={1.4}
            roughness={0.2}
            metalness={0.8}
            wireframe={false}
          />
        </mesh>

        {/* Outer Holographic Frosted Glass Sphere */}
        <mesh ref={outerGlassRef}>
          <sphereGeometry args={[1.18, 36, 36]} />
          <meshPhysicalMaterial
            color="#E8EDF9"
            emissive="#32D8E8"
            emissiveIntensity={0.35}
            roughness={0.08}
            metalness={0.15}
            transmission={0.85}
            thickness={1.2}
            ior={1.45}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Layered Neural Voice Wave Rings (Slow Breathing, not spinning) */}
        <mesh ref={neuralRing1Ref} rotation={[Math.PI / 2.2, 0, 0]}>
          <torusGeometry args={[1.55, 0.022, 16, 64]} />
          <meshStandardMaterial
            color="#32D8E8"
            emissive="#32D8E8"
            emissiveIntensity={1.8}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>

        <mesh ref={neuralRing2Ref} rotation={[Math.PI / 1.8, 0, 0]}>
          <torusGeometry args={[1.75, 0.018, 16, 64]} />
          <meshStandardMaterial
            color="#A58EFF"
            emissive="#8065FF"
            emissiveIntensity={1.6}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>

        {/* Core Lighting */}
        <pointLight position={[0, 0, 0]} color="#32D8E8" intensity={3.5} distance={7} />
        <pointLight position={[0, 0.5, 0.8]} color="#8065FF" intensity={2.0} distance={5} />
      </group>

      {/* ============================================================
          2. GROUND HOLOGRAPHIC REFLECTION PEDESTAL
          ============================================================ */}
      <group position={[0, -1.3, 0]}>
        {/* Base dark reflective disk */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.8, 48]} />
          <meshStandardMaterial color="#0A0F22" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Concentric luminous cyan boundary rings */}
        <mesh ref={groundGlowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[2.55, 2.7, 64]} />
          <meshBasicMaterial color="#32D8E8" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[1.8, 1.88, 48]} />
          <meshBasicMaterial color="#8065FF" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};
