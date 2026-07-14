import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshTransmissionMaterial, Float, Line, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function HeartbeatLine() {
  const lineRef = useRef(null);
  
  const points = useMemo(() => {
    return [
      new THREE.Vector3(-1.5, 0, 0),
      new THREE.Vector3(-0.8, 0, 0),
      new THREE.Vector3(-0.6, 0.4, 0),
      new THREE.Vector3(-0.3, -0.6, 0),
      new THREE.Vector3(0.1, 1.2, 0),
      new THREE.Vector3(0.4, -0.8, 0),
      new THREE.Vector3(0.7, 0.2, 0),
      new THREE.Vector3(0.9, 0, 0),
      new THREE.Vector3(1.5, 0, 0)
    ];
  }, []);

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={lineRef}>
      <Line
        points={points}
        color="#22d3ee" // Cyan glowing
        lineWidth={8}
      />
      {/* Glow copy */}
      <Line
        points={points}
        color="#7dd3fc"
        lineWidth={16}
        transparent
        opacity={0.6}
      />
    </group>
  );
}

function NestedCubes() {
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.1;
    }
  });

    const GlassMaterial = () => (
      <MeshTransmissionMaterial 
        backside={true}
        samples={16}
        thickness={0.5}
        roughness={0}
        clearcoat={1}
        transmission={1}
        ior={1.2}
        chromaticAberration={0.02}
        distortion={0.1}
        distortionScale={0.1}
        color="#ffffff"
        background={new THREE.Color('#f3f8fc')}
      />
    );

    return (
      <group ref={groupRef}>
        {/* Outer Cube */}
        <mesh>
          <boxGeometry args={[3.2, 3.2, 3.2]} />
          <GlassMaterial />
        </mesh>
        <boxHelper args={[new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 3.2))]} material={new THREE.LineBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.2 })} />

        {/* Middle Cube */}
        <mesh>
          <boxGeometry args={[2.4, 2.4, 2.4]} />
          <MeshTransmissionMaterial 
            backside={true}
            samples={8}
            thickness={0.2}
            roughness={0}
            transmission={1}
            ior={1.3}
            color="#f0f9ff"
            background={new THREE.Color('#f3f8fc')}
          />
        </mesh>
        <boxHelper args={[new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4))]} material={new THREE.LineBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.3 })} />

      {/* The core heartbeat */}
      <HeartbeatLine />
    </group>
  );
}

export default function SecurityCube() {
  return (
    <div className="w-full h-full cursor-pointer relative z-10 bg-transparent">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 2]} gl={{ alpha: true }}>
        <ambientLight intensity={3} color="#ffffff" />
        <directionalLight position={[10, 10, 10]} intensity={3} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={2} color="#bae6fd" />
        
        <Environment preset="city" />
        
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <NestedCubes />
        </Float>
        
        <ContactShadows position={[0, -3.5, 0]} opacity={0.3} scale={10} blur={2} far={4} color="#0c4a6e" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
