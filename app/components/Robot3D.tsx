'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Component to handle the robot model and rotation
function RobotModel({ cursorPosition }: { cursorPosition: number }) {
  const { scene } = useGLTF('/D3-robot-3d-model.glb');
  const robotRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);
  const isInitialized = useRef(false);

  // Clone the scene to avoid issues with multiple instances
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useFrame(() => {
    if (!robotRef.current) return;

    // Initialize rotation to face forward on first frame
    if (!isInitialized.current) {
      robotRef.current.rotation.y = -Math.PI / 2; // Face forward (towards camera)
      targetRotation.current = -Math.PI / 2;
      isInitialized.current = true;
    }

    // Calculate rotation based on cursor position
    // cursorPosition: -1 (left edge) to 1 (right edge), 0 is center
    // Max rotation: 45 degrees (Math.PI / 4) in each direction
    const maxRotation = Math.PI / 4; // 45 degrees
    const rotationOffset = cursorPosition * maxRotation;
    
    // Base rotation (facing forward) + cursor-based offset
    targetRotation.current = -Math.PI / 2 + rotationOffset;

    // Smoothly interpolate to target rotation
    robotRef.current.rotation.y = THREE.MathUtils.lerp(
      robotRef.current.rotation.y,
      targetRotation.current,
      0.1
    );
  });

  return (
    <group ref={robotRef} position={[1.5, -0.3, 0]} scale={[4.8, 4.8, 4.8]} rotation={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Main component that tracks cursor position
export default function Robot3D() {
  const [cursorPosition, setCursorPosition] = useState(0); // -1 (left) to 1 (right), 0 is center
  const heroSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the hero section element
    heroSectionRef.current = document.querySelector('[data-hero-section]') as HTMLElement;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroSectionRef.current) return;

      const rect = heroSectionRef.current.getBoundingClientRect();
      
      // Calculate mouse position relative to hero section
      // x: 0 (left edge) to rect.width (right edge)
      const mouseX = e.clientX - rect.left;
      
      // Normalize to -1 (left) to 1 (right), with 0 at center
      const normalizedX = (mouseX / rect.width) * 2 - 1;
      
      // Clamp to -1 to 1 range
      const clampedX = Math.max(-1, Math.min(1, normalizedX));
      
      setCursorPosition(clampedX);
    };

    const handleMouseLeave = () => {
      // Return to center position when mouse leaves hero section
      setCursorPosition(0);
    };

    const heroElement = heroSectionRef.current;
    if (heroElement) {
      heroElement.addEventListener('mousemove', handleMouseMove);
      heroElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (heroElement) {
        heroElement.removeEventListener('mousemove', handleMouseMove);
        heroElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className='absolute inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden'>
      <Canvas
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        camera={{ position: [0.8, 0.1, 6.5], fov: 48 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-5, 3, -5]} intensity={0.7} />
        <pointLight position={[0, 4, 2]} intensity={1} color='#004aad' />
        <pointLight position={[-3, 2, 3]} intensity={0.5} color='#004aad' />
        <RobotModel cursorPosition={cursorPosition} />
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload('/D3-robot-3d-model.glb');
