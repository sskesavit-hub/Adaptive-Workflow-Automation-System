'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function Avatar3D({ isSpeaking = false, isThinking = false }) {
  const mountRef   = useRef(null);
  const stateRef   = useRef({ isSpeaking, isThinking });
  const mouseRef   = useRef({ x: 0, y: 0 });   // normalised -1..1
  const trackRef   = useRef(false);              // true = mouse is over chat container

  useEffect(() => {
    stateRef.current = { isSpeaking, isThinking };
  }, [isSpeaking, isThinking]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width  = container.clientWidth;
    const height = container.clientHeight;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled  = true;
    renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
    renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.2;          // ← BRIGHTER exposure
    renderer.outputColorSpace   = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = null;

    // ── Camera ───────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.0);
    camera.lookAt(0, 0.9, 0);

    // ── Lights (brighter) ────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));          // ← much brighter ambient

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xc4b5fd, 1.2); // violet fill
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x67e8f9, 1.0);  // cyan rim
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 1.0); // extra front
    frontLight.position.set(0, 1, 6);
    scene.add(frontLight);

    // ── Orbit Controls (limited, auto-rotate) ────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan  = false;
    controls.enableZoom = false;
    controls.minPolarAngle  = Math.PI / 4;
    controls.maxPolarAngle  = Math.PI / 1.8;
    controls.minAzimuthAngle = -Math.PI / 6;
    controls.maxAzimuthAngle =  Math.PI / 6;
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 0.4;
    controls.target.set(0, 0.9, 0);
    controls.update();

    // ── Glow rings ───────────────────────────────────────────
    const mkRing = (r, t, col) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(r, t, 16, 100),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0 })
      );
      m.rotation.x = Math.PI / 2;
      m.position.set(0, 0.05, 0);
      scene.add(m);
      return m;
    };
    const ring  = mkRing(0.42, 0.020, 0x7c3aed);
    const ring2 = mkRing(0.58, 0.013, 0x06b6d4);

    // ── Blink state ──────────────────────────────────────────
    let blinkMeshes  = [];   // meshes whose scaleY we animate for blink
    let blinkState   = 'open';
    let blinkTimer   = 0;
    let blinkNext    = 3 + Math.random() * 4; // first blink 3-7 s
    let blinkT       = 0;

    // ── Mouse tracking: listen on the *page* for the chat panel ─
    const onMouseMove = (e) => {
      // Normalise against full VIEWPORT so values stay in -1..1
      // regardless of where in the page the cursor is
      mouseRef.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Load GLTF Model ──────────────────────────────────────
    let mixer = null;
    let model = null;
    const modelGroup = new THREE.Group(); // wrapper for rotation
    scene.add(modelGroup);

    const loader = new GLTFLoader();
    loader.load(
      '/models/paul/scene.gltf',
      (gltf) => {
        model = gltf.scene;

        // ── SMALLER scale (1.5 instead of 2.2) ──────────────
        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale  = 1.5 / Math.max(size.x, size.y, size.z);  // ← smaller
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.05;

        // ── BRIGHTER textures: boost all materials ───────────
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow    = true;
            child.receiveShadow = true;

            const mat = child.material;
            if (!mat) return;

            // Increase metalness brightness + emissive boost
            if (mat.emissive) mat.emissive.multiplyScalar(2.5);
            if (mat.roughness !== undefined) mat.roughness = Math.max(0.05, mat.roughness * 0.5);
            if (mat.color)    mat.color.multiplyScalar(1.4);

            // Collect "eye/screen" meshes for blink animation
            const name = (child.name || '').toLowerCase();
            if (name.includes('eye') || name.includes('screen') || name.includes('lens') || name.includes('visor')) {
              blinkMeshes.push(child);
            }
          }
        });

        // If no specific eye meshes found, use the first emissive mesh
        if (blinkMeshes.length === 0) {
          model.traverse(child => {
            if (child.isMesh && child.material?.emissive) {
              const e = child.material.emissive;
              if (e.r + e.g + e.b > 0.1) blinkMeshes.push(child);
            }
          });
        }

        modelGroup.add(model);

        // Built-in GLTF animations
        if (gltf.animations?.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (err) => {
        console.error('GLTF error:', err);
        // fallback sphere
        const fb = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 32, 32),
          new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.2, metalness: 0.7 })
        );
        fb.position.set(0, 0.9, 0);
        modelGroup.add(fb);
      }
    );

    // ── Animation Loop ────────────────────────────────────────
    const clock = new THREE.Clock();
    let frameId;

    // Smooth targets for mouse-tracking rotation
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta   = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const { isSpeaking, isThinking } = stateRef.current;
      const { x: mx, y: my } = mouseRef.current;

      if (mixer) mixer.update(delta);

      if (model) {
        // Floating bob
        model.position.y = Math.sin(elapsed * 0.9) * 0.035 + 0.05;
      }

      // ── Mouse tracking: rotate modelGroup toward cursor ───
      // Clamp to ±0.38 rad (~22°) — keeps motion in a natural range
      targetRotY = Math.max(-0.38, Math.min(0.38,  mx * 0.45));
      targetRotX = Math.max(-0.20, Math.min(0.20, -my * 0.25));

      // Smooth lerp — slightly faster (0.055) for responsive feel
      currentRotY += (targetRotY - currentRotY) * 0.055;
      currentRotX += (targetRotX - currentRotX) * 0.055;

      // Apply base tracking rotation
      modelGroup.rotation.y = currentRotY;
      modelGroup.rotation.x = currentRotX;

      // ── Blink logic ──────────────────────────────────────
      blinkTimer += delta;
      if (blinkState === 'open' && blinkTimer >= blinkNext) {
        blinkState = 'closing';
        blinkTimer = 0;
        blinkT     = 0;
      }

      if (blinkState === 'closing') {
        blinkT += delta / 0.08; // 80ms close
        const t = Math.min(blinkT, 1);
        blinkMeshes.forEach(m => { m.scale.y = 1 - t * 0.92; });
        if (blinkT >= 1) { blinkState = 'opening'; blinkT = 0; }
      } else if (blinkState === 'opening') {
        blinkT += delta / 0.12; // 120ms open
        const t = Math.min(blinkT, 1);
        blinkMeshes.forEach(m => { m.scale.y = 0.08 + t * 0.92; });
        if (blinkT >= 1) {
          blinkMeshes.forEach(m => { m.scale.y = 1; });
          blinkState = 'open';
          blinkTimer = 0;
          blinkNext  = 2.5 + Math.random() * 5; // next blink in 2.5-7.5s
        }
      }

      // ── Speaking: subtle head waggle (additive, doesn't drift) ──
      if (isSpeaking || isThinking) {
        // Add wobble ON TOP of the tracked rotation — don't accumulate
        modelGroup.rotation.y = currentRotY + Math.sin(elapsed * 3.5) * 0.018;
      }

      // ── Glow rings ───────────────────────────────────────
      if (isSpeaking || isThinking) {
        const p = (Math.sin(elapsed * 4) + 1) / 2;
        ring.material.opacity  = 0.45 + p * 0.5;
        ring2.material.opacity = 0.25 + p * 0.4;
        ring.scale.setScalar(1  + p * 0.1);
        ring2.scale.setScalar(1 + p * 0.14);
        ring.material.color.setHex(isThinking  ? 0xf59e0b : 0x7c3aed);
        ring2.material.color.setHex(isThinking ? 0xfbbf24 : 0x06b6d4);
        controls.autoRotateSpeed = isSpeaking ? 1.8 : 0.5;
      } else {
        ring.material.opacity  *= 0.92;
        ring2.material.opacity *= 0.92;
        ring.scale.lerp(new THREE.Vector3(1, 1, 1),  0.08);
        ring2.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08);
        controls.autoRotateSpeed = 0.4;
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
      window.removeEventListener('resize',    handleResize);
      window.removeEventListener('mousemove', onMouseMove);
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
      style={{ width: '100%', height: '100%', cursor: 'default' }}
    />
  );
}
