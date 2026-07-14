import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshTransmissionMaterial, Float, Sphere, Icosahedron, Stars, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function ComplexSphere() {
  const groupRef = useRef(null);
  const innerRef = useRef(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.1;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.2;
      innerRef.current.rotation.z += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer Clear Glass Shell */}
      <Sphere args={[2.5, 64, 64]}>
        <MeshTransmissionMaterial 
          backside={true}
          samples={16}
          thickness={1.5}
          roughness={0}
          transmission={1}
          ior={1.5}
          chromaticAberration={0.03}
          distortion={0.2}
          distortionScale={0.1}
          temporalDistortion={0.1}
          color="#ffffff"
          background={new THREE.Color('#e0f2fe')} // Refracts this color instead of black
        />
      </Sphere>

      {/* Inner Glowing Structure */}
      <Icosahedron ref={innerRef} args={[1.8, 1]}>
        <meshBasicMaterial 
          color="#06b6d4"
          wireframe={true}
          transparent={true}
          opacity={0.15}
        />
      </Icosahedron>
      
      {/* Central Solid Glowing Core */}
      <Sphere args={[0.6, 32, 32]}>
        <meshBasicMaterial 
          color="#ffffff"
        />
      </Sphere>
      
      {/* Blue aura around core */}
      <Sphere args={[0.8, 32, 32]}>
        <meshBasicMaterial 
          color="#0ea5e9"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  );
}

function OrbitingNodes() {
  const ringsRef = useRef(null);
  
  useFrame((state, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.x -= delta * 0.1;
      ringsRef.current.rotation.y += delta * 0.2;
    }
  });

  // Create orbiting particles along rings
  const particles = useMemo(() => {
    const pts = [];
    for(let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      pts.push(
        <mesh key={`p1-${i}`} position={[Math.cos(angle) * 3.5, Math.sin(angle) * 3.5, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#0ea5e9" />
        </mesh>
      );
    }
    return pts;
  }, []);

  return (
    <group ref={ringsRef}>
      {/* Ring 1 */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[3.5, 0.002, 16, 100]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
      </mesh>
      {/* Ring 2 */}
      <mesh rotation={[0, Math.PI/3, 0]}>
        <torusGeometry args={[3.2, 0.002, 16, 100]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} />
      </mesh>
      {particles}
    </group>
  );
}

export default function HeroSphere() {
  return (
    <div className="w-full h-full cursor-pointer relative z-10 bg-transparent">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]} gl={{ alpha: true }}>
        <ambientLight intensity={3} color="#ffffff" />
        <directionalLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={2} color="#0ea5e9" />
        
        <Environment preset="city" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <ComplexSphere />
          <OrbitingNodes />
        </Float>
        
        <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={10} blur={2} far={4} color="#0369a1" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
