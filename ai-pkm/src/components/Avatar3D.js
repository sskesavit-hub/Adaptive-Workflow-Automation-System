'use client';
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Avatar3D — A fully procedural Three.js 3D avatar rendered with vanilla Three.js.
 * Features:
 *   - Realistic humanoid head & bust built from Three.js geometry
 *   - Smooth random blinking animation
 *   - Glowing "speaking" pulse ring when AI is responding
 *   - Idle floating animation
 */
export default function Avatar3D({ isSpeaking = false, isThinking = false }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ isSpeaking, isThinking });

  useEffect(() => {
    stateRef.current = { isSpeaking, isThinking };
  }, [isSpeaking, isThinking]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // ── Scene & Camera ────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.3, 3.2);
    camera.lookAt(0, 0.3, 0);

    // ── Lighting ──────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x7c3aed, 2.5);
    keyLight.position.set(-2, 3, 2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 1.5);
    fillLight.position.set(3, 1, 1);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, -1, -2);
    scene.add(rimLight);

    // ── Materials ─────────────────────────────────────────────
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xc8a882,
      roughness: 0.6,
      metalness: 0.0,
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x3a2aed });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x080810 });
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xb89060 });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1a0a00,
      roughness: 0.8,
    });

    const neckMat = new THREE.MeshStandardMaterial({ color: 0xc0a07a, roughness: 0.6 });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.5,
      metalness: 0.1,
    });

    // ── Helper: make symmetric eye ────────────────────────────
    function makeEye(xSign) {
      const group = new THREE.Group();

      // White sclera
      const scleraMesh = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 16), eyeWhiteMat);
      group.add(scleraMesh);

      // Iris
      const irisMesh = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), irisMat);
      irisMesh.position.set(0, 0, 0.088);
      group.add(irisMesh);

      // Pupil
      const pupilMesh = new THREE.Mesh(new THREE.CircleGeometry(0.028, 24), pupilMat);
      pupilMesh.position.set(0, 0, 0.091);
      group.add(pupilMesh);

      // Upper eyelid (will scale Y to blink)
      const upperLid = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.098, 0.05, 4, 8),
        lidMat
      );
      upperLid.rotation.z = Math.PI / 2;
      upperLid.position.set(0, 0.06, 0.06);
      upperLid.scale.set(1, 0.35, 1);
      group.add(upperLid);

      group.position.set(xSign * 0.135, 0.08, 0.43);
      group.userData.upperLid = upperLid;
      group.userData.lids = [upperLid];
      return group;
    }

    // ── Head ──────────────────────────────────────────────────
    const headGroup = new THREE.Group();
    scene.add(headGroup);

    // Main head sphere (slightly elongated)
    const headGeo = new THREE.SphereGeometry(0.52, 32, 32);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.scale.set(1, 1.12, 0.95);
    headGroup.add(headMesh);

    // Jaw / chin – slightly squarish
    const chinGeo = new THREE.SphereGeometry(0.38, 24, 24);
    const chinMesh = new THREE.Mesh(chinGeo, skinMat);
    chinMesh.scale.set(0.95, 0.7, 0.9);
    chinMesh.position.set(0, -0.38, 0.05);
    headGroup.add(chinMesh);

    // Nose
    const noseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), skinMat);
    noseMesh.scale.set(0.7, 0.55, 1);
    noseMesh.position.set(0, -0.04, 0.5);
    headGroup.add(noseMesh);

    // Ears
    [-1, 1].forEach(sign => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), skinMat);
      ear.scale.set(0.5, 0.7, 0.5);
      ear.position.set(sign * 0.51, 0.05, 0);
      headGroup.add(ear);
    });

    // Eyes
    const leftEye = makeEye(-1);
    const rightEye = makeEye(1);
    headGroup.add(leftEye, rightEye);

    // Eyebrows
    [-1, 1].forEach(sign => {
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.02, 4, 8), hairMat);
      brow.rotation.z = Math.PI / 2;
      brow.scale.set(1, 0.25, 1);
      brow.position.set(sign * 0.135, 0.22, 0.44);
      headGroup.add(brow);
    });

    // Lips
    const upperLipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), skinMat);
    upperLipMesh.scale.set(0.9, 0.4, 0.7);
    upperLipMesh.position.set(0, -0.2, 0.49);
    headGroup.add(upperLipMesh);

    // Hair — blob cap on top
    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), hairMat);
    hairMesh.scale.set(1.02, 0.65, 1.02);
    hairMesh.position.set(0, 0.22, -0.03);
    headGroup.add(hairMesh);

    // ── Neck ──────────────────────────────────────────────────
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.35, 20), neckMat);
    neckMesh.position.set(0, -0.72, 0);
    scene.add(neckMesh);

    // ── Shoulders / shirt ─────────────────────────────────────
    const bust = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.9, 24), shirtMat);
    bust.position.set(0, -1.3, 0);
    scene.add(bust);

    // Shoulder bumps
    [-1, 1].forEach(sign => {
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), shirtMat);
      sh.position.set(sign * 0.52, -1.0, 0);
      scene.add(sh);
    });

    headGroup.position.set(0, 0.3, 0);

    // ── Glow ring (speaking indicator) ────────────────────────
    const ringGeo = new THREE.TorusGeometry(0.75, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.position.set(0, 0.3, 0);
    scene.add(ring1);
    const ring2 = ring1.clone();
    ring2.material = ringMat.clone();
    scene.add(ring2);

    // ── Grid / ground reflection ──────────────────────────────
    const gridHelper = new THREE.GridHelper(6, 20, 0x7c3aed, 0x1a1a2e);
    gridHelper.position.set(0, -2, 0);
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // ── Particle field (floating dots) ────────────────────────
    const particleCount = 80;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 6;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x7c3aed, size: 0.025, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(pGeo, pMat));

    // ── Blink state ───────────────────────────────────────────
    let nextBlink = Date.now() + 2000 + Math.random() * 3000;
    let blinkPhase = 'idle'; // 'closing' | 'opening' | 'idle'
    let blinkProgress = 0;

    // ── Animation loop ────────────────────────────────────────
    let animId;
    const clock = new THREE.Clock();
    let ring1Scale = 1, ring2Scale = 1.5;

    function animate() {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const { isSpeaking, isThinking } = stateRef.current;

      // Idle float
      headGroup.position.y = 0.3 + Math.sin(elapsed * 0.9) * 0.04;
      headGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.06;
      headGroup.rotation.x = Math.sin(elapsed * 0.3) * 0.03;

      // ── Blink logic ──────────────────────────────────────────
      const now = Date.now();
      if (blinkPhase === 'idle' && now >= nextBlink) {
        blinkPhase = 'closing';
        blinkProgress = 0;
      }
      if (blinkPhase === 'closing') {
        blinkProgress += 0.12;
        const scaleY = Math.max(0.05, 0.35 - blinkProgress * 0.35);
        leftEye.userData.upperLid.scale.y = scaleY;
        rightEye.userData.upperLid.scale.y = scaleY;
        if (blinkProgress >= 1) { blinkPhase = 'opening'; blinkProgress = 0; }
      }
      if (blinkPhase === 'opening') {
        blinkProgress += 0.1;
        const scaleY = Math.min(0.35, 0.05 + blinkProgress * 0.30);
        leftEye.userData.upperLid.scale.y = scaleY;
        rightEye.userData.upperLid.scale.y = scaleY;
        if (blinkProgress >= 1) {
          blinkPhase = 'idle';
          leftEye.userData.upperLid.scale.y = 0.35;
          rightEye.userData.upperLid.scale.y = 0.35;
          nextBlink = Date.now() + 2500 + Math.random() * 4000;
        }
      }

      // ── Speaking glow rings ───────────────────────────────────
      if (isSpeaking) {
        ring1Scale += 0.018;
        if (ring1Scale > 2.5) ring1Scale = 1;
        ring2Scale += 0.011;
        if (ring2Scale > 2.5) ring2Scale = 1.5;
        ring1.scale.setScalar(ring1Scale);
        ring2.scale.setScalar(ring2Scale);
        ring1.material.opacity = Math.max(0, 0.9 - (ring1Scale - 1) / 1.5 * 0.9);
        ring2.material.opacity = Math.max(0, 0.6 - (ring2Scale - 1.5) / 1 * 0.6);
        ring1.material.color.set(0x7c3aed);
        ring2.material.color.set(0x06b6d4);
      } else if (isThinking) {
        ring1.material.opacity = 0.3 + Math.sin(elapsed * 3) * 0.2;
        ring1.scale.setScalar(1.1 + Math.sin(elapsed * 2) * 0.05);
        ring2.material.opacity = 0;
        ring1.material.color.set(0xf59e0b);
      } else {
        ring1.material.opacity = Math.max(0, ring1.material.opacity - 0.04);
        ring2.material.opacity = Math.max(0, ring2.material.opacity - 0.04);
      }

      // Particle drift
      pGeo.attributes.position.array.forEach((_, i) => {
        if (i % 3 === 1) {
          pGeo.attributes.position.array[i] += 0.001;
          if (pGeo.attributes.position.array[i] > 2.5) pGeo.attributes.position.array[i] = -2.5;
        }
      });
      pGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }
    animate();

    // ── Resize handler ────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }} />
  );
}
