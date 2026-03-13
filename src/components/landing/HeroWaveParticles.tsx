"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type HeroWaveParticlesProps = {
  className?: string;
};

export function HeroWaveParticles({ className }: HeroWaveParticlesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 6, 16);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const gridWidth = 40;
    const gridDepth = 24;
    const segmentsX = 80;
    const segmentsZ = 48;
    const geometry = new THREE.PlaneGeometry(
      gridWidth,
      gridDepth,
      segmentsX,
      segmentsZ,
    );

    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const initialY = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i++) {
      initialY[i] = positions.getY(i);
    }

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(0x38bdf8),
      size: 0.14,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frameId: number;
    let time = 0;
    let colorTick = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      time += 0.02;
      colorTick += 1;

      // Periodically sync particle color with CSS accent (supports theme changes)
      if (colorTick % 10 === 0) {
        const rootStyle = getComputedStyle(document.documentElement);
        const accentVar = rootStyle.getPropertyValue("--accent").trim();
        if (accentVar) {
          try {
            material.color = new THREE.Color(accentVar);
          } catch {
            // ignore parsing errors and keep previous color
          }
        }
      }

      const waveSpeed = 1.4;
      const waveHeight = 0.9;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        const wave1 =
          Math.sin((x * 0.32 + time * waveSpeed) * 0.9) *
          Math.cos((z * 0.24 - time * waveSpeed * 0.8) * 1.1);
        const wave2 =
          Math.cos((x * 0.16 - time * waveSpeed * 0.5) * 1.3) *
          Math.sin((z * 0.2 + time * waveSpeed * 0.7) * 0.7);

        const y =
          initialY[i] +
          (wave1 * 0.6 + wave2 * 0.4) * waveHeight +
          Math.sin(time * 0.6) * 0.12;

        positions.setY(i, y);
      }
      positions.needsUpdate = true;

      camera.position.x = Math.sin(time * 0.15) * 1.2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
    />
  );
}


