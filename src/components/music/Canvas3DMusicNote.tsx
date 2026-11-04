import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Canvas3DMusicNoteProps {
  isPlaying: boolean;
  className?: string;
}

export const Canvas3DMusicNote: React.FC<Canvas3DMusicNoteProps> = ({ isPlaying, className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 72;
    const height = container.clientHeight || 72;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 3. Lighting (Rich Emerald, Gold & Studio Fill)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5e6, 2.8);
    dirLight1.position.set(3, 4, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x059669, 1.8); // Emerald rim light
    dirLight2.position.set(-3, -2, 2);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xf59e0b, 1.8, 8); // Golden bounce light
    pointLight.position.set(0, 2, 3);
    scene.add(pointLight);

    // 4. Model Root Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    let isDisposed = false;
    let animFrameId: number;

    // 5. Load GLTF Model
    const loader = new GLTFLoader();
    loader.load(
      '/models/music-box.glb',
      (gltf) => {
        if (isDisposed) return;
        const model = gltf.scene;

        // Auto center and scale
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.55 / (maxDim || 1);

        model.scale.set(scale, scale, scale);
        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
              if (mat.roughness !== undefined) mat.roughness = 0.28;
              if (mat.metalness !== undefined) mat.metalness = 0.15;
            }
          }
        });

        modelGroup.add(model);
      },
      undefined,
      (err) => {
        console.warn('Failed to load 3D music note model:', err);
      }
    );

    // 6. Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      // Skip render if browser tab is inactive to preserve battery and CPU
      if (document.hidden) return;

      const elapsedTime = clock.getElapsedTime();
      const playing = isPlayingRef.current;

      if (playing) {
        // Musical energetic groove
        modelGroup.rotation.y += 0.032;
        modelGroup.position.y = Math.sin(elapsedTime * 4.2) * 0.16;
        modelGroup.rotation.z = Math.sin(elapsedTime * 3) * 0.08;
      } else {
        // Smooth serene idle floating
        modelGroup.rotation.y += 0.012;
        modelGroup.position.y = Math.sin(elapsedTime * 1.8) * 0.08;
        modelGroup.rotation.z = 0;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Dynamic resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full flex items-center justify-center pointer-events-none select-none ${className}`}
    />
  );
};

export default Canvas3DMusicNote;

