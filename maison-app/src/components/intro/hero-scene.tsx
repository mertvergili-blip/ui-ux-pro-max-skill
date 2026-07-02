"use client";

import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { useAspect, useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three/webgpu";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import {
  abs,
  float,
  mod,
  mx_cell_noise_float,
  oneMinus,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  pass,
  add,
  blendScreen,
} from "three/tsl";

// Placeholder texture/depth pair — swap for a Maison-shot atelier photo + depth map later.
const TEXTUREMAP = { src: "https://i.postimg.cc/XYwvXN8D/img-4.png" };
const DEPTHMAP = { src: "https://i.postimg.cc/2SHKQh2q/raw-4.webp" };

extend(THREE as unknown as Parameters<typeof extend>[0]);

function PostProcessing({
  strength = 0.6,
  threshold = 1,
}: {
  strength?: number;
  threshold?: number;
}) {
  const { gl, scene, camera } = useThree();

  const { postProcessing, uScanProgress } = useMemo(() => {
    const postProcessing = new THREE.PostProcessing(gl as never);
    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode("output");
    const bloomPass = bloom(scenePassColor, strength, 0.5, threshold);

    const uScanProgress = uniform(0);

    const scanPos = float(uScanProgress.value);
    const uvY = uv().y;
    const scanWidth = float(0.05);
    const scanLine = smoothstep(0, scanWidth, abs(uvY.sub(scanPos)));
    // gold scan glow instead of the reference's red — matches Maison's palette
    const scanOverlay = vec3(0.77, 0.64, 0.41).mul(oneMinus(scanLine)).mul(0.22);

    const withScanEffect = add(scenePassColor, scanOverlay);
    const final = withScanEffect.add(bloomPass);

    postProcessing.outputNode = final;
    return { postProcessing, uScanProgress };
  }, [camera, gl, scene, strength, threshold]);

  useFrame(({ clock }) => {
    // Three.js node mutation driving the shader's animation loop — not React
    // state, so it's exempt from the "don't mutate during render" rule.
    // eslint-disable-next-line react-hooks/immutability
    uScanProgress.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
    postProcessing.renderAsync();
  }, 1);

  return null;
}

const WIDTH = 300;
const HEIGHT = 300;

function Scene() {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src]);

  const { material, uniforms } = useMemo(() => {
    const uPointer = uniform(new THREE.Vector2(0));
    const uProgress = uniform(0);

    const strength = 0.01;
    const tDepthMap = texture(depthMap);
    const tMap = texture(rawMap, uv().add(tDepthMap.r.mul(uPointer).mul(strength)));

    const aspect = float(WIDTH).div(HEIGHT);
    const tUv = vec2(uv().x.mul(aspect), uv().y);

    const tiling = vec2(120.0);
    const tiledUv = mod(tUv.mul(tiling), 2.0).sub(1.0);

    const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));

    const dist = float(tiledUv.length());
    const dot = float(smoothstep(0.5, 0.49, dist)).mul(brightness);

    const depth = tDepthMap;
    const flow = oneMinus(smoothstep(0, 0.02, abs(depth.sub(uProgress))));

    // gold dot-scan instead of the reference's red channel push
    const mask = dot.mul(flow).mul(vec3(0.77, 0.64, 0.41));

    const final = blendScreen(tMap, mask);

    const material = new THREE.MeshBasicNodeMaterial({ colorNode: final });

    return { material, uniforms: { uPointer, uProgress } };
  }, [rawMap, depthMap]);

  const [w, h] = useAspect(WIDTH, HEIGHT);

  useFrame(({ clock }) => {
    // Three.js node mutations driving the shader — not React state.
    // eslint-disable-next-line react-hooks/immutability
    uniforms.uProgress.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
  });

  useFrame(({ pointer }) => {
    // eslint-disable-next-line react-hooks/immutability
    uniforms.uPointer.value = pointer;
  });

  const scaleFactor = 1.15;
  return (
    <mesh scale={[w * scaleFactor, h * scaleFactor, 1]} material={material}>
      <planeGeometry />
    </mesh>
  );
}

export function HeroScene() {
  return (
    <Canvas
      flat
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer(props as never);
        await renderer.init();
        return renderer;
      }}
    >
      <PostProcessing strength={0.5} threshold={1.1} />
      <Scene />
    </Canvas>
  );
}
