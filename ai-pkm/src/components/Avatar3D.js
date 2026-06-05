'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function Avatar3D({ isSpeaking = false, isThinking = false }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ isSpeaking, isThinking });

  useEffect(() => {
    stateRef.current = { isSpeaking, isThinking };
  }, [isSpeaking, isThinking]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // ── Renderer ─────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = null; // transparent

    // ── Camera ───────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 3.2);
    camera.lookAt(0, 1.0, 0);

    // ── Lights ───────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8b5cf6, 0.6); // purple fill
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.5); // cyan rim
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    // ── Orbit Controls (limited) ─────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.minAzimuthAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.target.set(0, 1.0, 0);
    controls.update();

    // ── Glow ring (speaking/thinking indicator) ─────────────
    const ringGeo = new THREE.TorusGeometry(0.55, 0.025, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.05, 0);
    scene.add(ring);

    // Outer ring
    const ring2Geo = new THREE.TorusGeometry(0.75, 0.015, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(0, 0.05, 0);
    scene.add(ring2);

    // ── Load GLTF Model ──────────────────────────────────────
    let mixer = null;
    let model = null;
    const loader = new GLTFLoader();

    loader.load(
      '/models/paul/scene.gltf',
      (gltf) => {
        model = gltf.scene;

        // Auto-scale and center model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.2 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.1;

        // Enable shadows
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);

        // Animations
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          const clip = gltf.animations[0];
          const action = mixer.clipAction(clip);
          action.play();
        }
      },
      (progress) => {
        // Loading progress
        console.log(`Loading: ${Math.round((progress.loaded / progress.total) * 100)}%`);
      },
      (error) => {
        console.error('GLTF load error:', error);
        // Fallback: show a simple sphere if model fails
        const fallback = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 32, 32),
          new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.3, metalness: 0.5 })
        );
        fallback.position.set(0, 1, 0);
        scene.add(fallback);
      }
    );

    // ── Animation Loop ────────────────────────────────────────
    const clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const { isSpeaking, isThinking } = stateRef.current;

      // Update mixer (GLTF animations)
      if (mixer) mixer.update(delta);

      // Floating animation on model
      if (model) {
        model.position.y = Math.sin(elapsed * 0.8) * 0.04 + 0.1;
        if (isSpeaking || isThinking) {
          model.rotation.y = Math.sin(elapsed * 2) * 0.06;
        }
      }

      // Glow rings: pulse when speaking/thinking
      if (isSpeaking || isThinking) {
        const pulse = (Math.sin(elapsed * 4) + 1) / 2;
        ringMat.opacity = 0.4 + pulse * 0.5;
        ring2Mat.opacity = 0.2 + pulse * 0.4;
        ring.scale.setScalar(1 + pulse * 0.08);
        ring2.scale.setScalar(1 + pulse * 0.12);
        ringMat.color.setHex(isThinking ? 0xf59e0b : 0x7c3aed);
        ring2Mat.color.setHex(isThinking ? 0xfbbf24 : 0x06b6d4);
        controls.autoRotateSpeed = isSpeaking ? 1.5 : 0.5;
      } else {
        ringMat.opacity *= 0.9;
        ring2Mat.opacity *= 0.9;
        ring.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        ring2.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        controls.autoRotateSpeed = 0.5;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // ── Resize Handler ────────────────────────────────────────
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    />
  );
}
