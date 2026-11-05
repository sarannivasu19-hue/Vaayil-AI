import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const HubPortal3D: React.FC = () => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const archGroupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.12;
      outerRingRef.current.rotation.x = Math.sin(t * 0.35) * 0.06;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.22;
      innerRingRef.current.rotation.y = Math.cos(t * 0.35) * 0.06;
    }
    if (coreRef.current) {
      const scale = 1 + Math.sin(t * 1.4) * 0.055;
      coreRef.current.scale.set(scale, scale, scale);
      (coreRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.28 + Math.sin(t * 1.4) * 0.08;
    }
    if (archGroupRef.current) {
      archGroupRef.current.position.y = 0.4 + Math.sin(t * 0.5) * 0.04;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Doorway arch geometry */}
      <group ref={archGroupRef} position={[0, 0.4, 0]}>
        {/* Left pillar */}
        <mesh position={[-1.15, 0, 0]}>
          <boxGeometry args={[0.18, 2.6, 0.18]} />
          <meshStandardMaterial
            color="#17152D"
            emissive="#8065FF"
            emissiveIntensity={0.35}
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>
        {/* Right pillar */}
        <mesh position={[1.15, 0, 0]}>
          <boxGeometry args={[0.18, 2.6, 0.18]} />
          <meshStandardMaterial
            color="#17152D"
            emissive="#8065FF"
            emissiveIntensity={0.35}
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>
        {/* Top arch beam */}
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[2.46, 0.2, 0.2]} />
          <meshStandardMaterial
            color="#17152D"
            emissive="#32D8E8"
            emissiveIntensity={0.55}
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>
        {/* Arch corner caps */}
        <mesh position={[-1.15, 1.3, 0]}>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color="#A58EFF" emissive="#A58EFF" emissiveIntensity={1.2} roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[1.15, 1.3, 0]}>
          <boxGeometry args={[0.22, 0.22, 0.22]} />
          <meshStandardMaterial color="#A58EFF" emissive="#A58EFF" emissiveIntensity={1.2} roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* Outer violet ring */}
      <mesh ref={outerRingRef} position={[0, 0.4, 0]}>
        <torusGeometry args={[2.0, 0.038, 16, 64]} />
        <meshStandardMaterial
          color="#8065FF"
          emissive="#8065FF"
          emissiveIntensity={2.2}
          roughness={0.08}
          metalness={0.95}
        />
      </mesh>

      {/* Inner cyan ring */}
      <mesh ref={innerRingRef} position={[0, 0.4, 0]}>
        <torusGeometry args={[1.42, 0.028, 16, 48]} />
        <meshStandardMaterial
          color="#32D8E8"
          emissive="#32D8E8"
          emissiveIntensity={2.0}
          roughness={0.08}
          metalness={0.95}
        />
      </mesh>

      {/* Portal core disc */}
      <mesh ref={coreRef} position={[0, 0.4, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.04, 32]} />
        <meshBasicMaterial
          color="#8065FF"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ground disc */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 32]} />
        <meshStandardMaterial color="#080B18" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, -1.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.4, 2.56, 48]} />
        <meshBasicMaterial color="#8065FF" transparent opacity={0.35} />
      </mesh>

      {/* Portal lights */}
      <pointLight position={[0, 0.5, 0.5]}  color="#32D8E8" intensity={4.0} distance={8} />
      <pointLight position={[0, 0.5, -0.5]} color="#8065FF" intensity={2.5} distance={6} />
    </group>
  );
};
