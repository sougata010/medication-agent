import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, PresentationControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Central Intelligence Core floating inside the capsule
function GlowingCore({ scrollProgress }) {
  const groupRef = useRef();
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      const p = scrollProgress ? scrollProgress.get() : 0;
      // Core starts expanding after 20% scroll, fully expanded by 60%
      const coreP = THREE.MathUtils.clamp((p - 0.2) / 0.4, 0, 1);
      
      // Rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.2;
      
      const targetScale = THREE.MathUtils.lerp(0.01, 1, coreP);
      groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 4, delta));
      
      const wireframeMat = groupRef.current.children[0].material;
      const targetOpacity = THREE.MathUtils.lerp(0, 0.8, coreP);
      wireframeMat.opacity = THREE.MathUtils.damp(wireframeMat.opacity, targetOpacity, 4, delta);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[0.6, 2]} />
        <meshPhysicalMaterial 
          color="#3b82f6" 
          emissive="#3b82f6" 
          emissiveIntensity={2} 
          wireframe={true} 
          transparent
          opacity={0}
        />
      </mesh>
      {/* Inner solid core */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

// Left Half of the Capsule (Dark Metal)
function LeftCapsule({ scrollProgress }) {
  const radius = 1;
  const length = 2.5;
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      const p = scrollProgress ? scrollProgress.get() : 0;
      // Split linearly with scroll from 0.1 to 0.9
      const splitP = THREE.MathUtils.clamp((p - 0.1) / 0.8, 0, 1);
      
      const targetX = THREE.MathUtils.lerp(0, -2.5, splitP);
      const targetRotY = THREE.MathUtils.lerp(0, -0.5, splitP);
      const targetRotZ = THREE.MathUtils.lerp(0, 0.1, splitP);
      
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 4, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 4, delta);
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRotZ, 4, delta);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body (open-ended to avoid z-fighting with the cut face) */}
      <mesh position={[-length/4, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[radius, radius, length/2, 64, 1, true]} />
        <meshPhysicalMaterial 
          color="#111827" 
          roughness={0.2} 
          metalness={0.8} 
          clearcoat={0.5}
        />
      </mesh>
      
      {/* End Cap */}
      <mesh position={[-length/2, 0, 0]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial 
          color="#111827" 
          roughness={0.2} 
          metalness={0.8} 
          clearcoat={0.5}
        />
      </mesh>
      
      {/* Cut Face (Inner edge) */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <circleGeometry args={[radius - 0.05, 64]} />
        <meshPhysicalMaterial color="#030712" roughness={0.9} />
      </mesh>
      
      {/* Cut Face Rim */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <ringGeometry args={[radius - 0.05, radius, 64]} />
        <meshPhysicalMaterial color="#374151" metalness={1} roughness={0.1} />
      </mesh>
    </group>
  );
}

// Right Half of the Capsule (White Glossy Plastic)
function RightCapsule({ scrollProgress }) {
  const radius = 1;
  const length = 2.5;
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      const p = scrollProgress ? scrollProgress.get() : 0;
      const splitP = THREE.MathUtils.clamp((p - 0.1) / 0.8, 0, 1);
      
      const targetX = THREE.MathUtils.lerp(0, 2.5, splitP);
      const targetRotY = THREE.MathUtils.lerp(0, 0.5, splitP);
      const targetRotZ = THREE.MathUtils.lerp(0, -0.1, splitP);
      
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 4, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 4, delta);
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRotZ, 4, delta);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body (open-ended) */}
      <mesh position={[length/4, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[radius, radius, length/2, 64, 1, true]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          roughness={0.1} 
          metalness={0.0} 
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>
      
      {/* End Cap */}
      <mesh position={[length/2, 0, 0]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          roughness={0.1} 
          metalness={0.0} 
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>
      
      {/* Cut Face (Inner edge) */}
      <mesh position={[0, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
        <circleGeometry args={[radius - 0.05, 64]} />
        <meshPhysicalMaterial color="#f3f4f6" roughness={0.4} />
      </mesh>

      {/* Cut Face Rim */}
      <mesh position={[0, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
        <ringGeometry args={[radius - 0.05, radius, 64]} />
        <meshPhysicalMaterial color="#e5e7eb" metalness={0.2} roughness={0.1} />
      </mesh>
    </group>
  );
}

// Parallax Wrapper
function ParallaxGroup({ children }) {
  const groupRef = useRef();
  const { mouse } = useThree();

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetRotX = (mouse.y * Math.PI) / 8;
      const targetRotY = (mouse.x * Math.PI) / 8;
      
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 3, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 3, delta);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function MedicineModel({ scrollProgress }) {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
        
        {/* Beautiful studio lighting environment */}
        <Environment preset="city" />
        
        <PresentationControls 
          global 
          config={{ mass: 2, tension: 500 }} 
          snap={{ mass: 4, tension: 1500 }} 
          rotation={[0, 0.3, 0]} 
          polar={[-Math.PI / 4, Math.PI / 4]} 
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <ParallaxGroup>
              <group rotation={[0.2, -0.4, 0]}>
                <LeftCapsule scrollProgress={scrollProgress} />
                <GlowingCore scrollProgress={scrollProgress} />
                <RightCapsule scrollProgress={scrollProgress} />
              </group>
            </ParallaxGroup>
          </Float>
        </PresentationControls>

        {/* Soft shadow on the ground */}
        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={20} blur={2} far={4} />
      </Canvas>
    </div>
  );
}
