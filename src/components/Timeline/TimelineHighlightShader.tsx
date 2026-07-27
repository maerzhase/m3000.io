"use client";

import { useEffect, useMemo, useRef } from "react";
import { MAX_SHADER_PATH_POINTS, TIMEFRAME_HIGHLIGHT_WIDTH } from "./constants";
import { samplePoints } from "./geometry";
import type { Point } from "./types";

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_noise_seed;
uniform float u_dither_levels;
uniform float u_dither_strength;
uniform float u_dither_coarseness;
uniform int u_path_point_count;
uniform vec2 u_path_points[24];
uniform float u_path_width;
uniform float u_path_strength;
uniform float u_path_reveal;
uniform float u_packet_time;

varying vec2 v_uv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = smoothstep(0.0, 1.0, f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float bayer4(vec2 p) {
  vec2 fc = mod(floor(p), 4.0);
  int x = int(fc.x);
  int y = int(fc.y);
  int i = y * 4 + x;
  if (i == 0) return 0.0 / 16.0;
  if (i == 1) return 8.0 / 16.0;
  if (i == 2) return 2.0 / 16.0;
  if (i == 3) return 10.0 / 16.0;
  if (i == 4) return 12.0 / 16.0;
  if (i == 5) return 4.0 / 16.0;
  if (i == 6) return 14.0 / 16.0;
  if (i == 7) return 6.0 / 16.0;
  if (i == 8) return 3.0 / 16.0;
  if (i == 9) return 11.0 / 16.0;
  if (i == 10) return 1.0 / 16.0;
  if (i == 11) return 9.0 / 16.0;
  if (i == 12) return 15.0 / 16.0;
  if (i == 13) return 7.0 / 16.0;
  if (i == 14) return 13.0 / 16.0;
  return 5.0 / 16.0;
}

float sdSegment(
  vec2 p,
  vec2 a,
  vec2 b,
  out float projectedLength,
  out float signedSide
) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float baDot = max(dot(ba, ba), 0.000001);
  float h = clamp(dot(pa, ba) / baDot, 0.0, 1.0);
  vec2 offset = pa - ba * h;
  projectedLength = length(ba) * h;
  signedSide = sign(ba.x * offset.y - ba.y * offset.x);
  return length(offset);
}

void main() {
  vec2 pixel = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  float pathDistancePx = 1e5;
  float pathTravelPx = 0.0;
  float accumulatedPathLengthPx = 0.0;
  float pathBend = 0.0;
  float pathBendDirection = 0.0;
  float pathSide = 0.0;
  vec2 previousDirection = vec2(0.0, 1.0);

  for (int i = 0; i < 23; i++) {
    if (i >= u_path_point_count - 1) break;
    vec2 pathStart = u_path_points[i];
    vec2 pathEnd = u_path_points[i + 1];
    float segmentTravel = 0.0;
    float segmentSide = 0.0;
    float segmentDistance = sdSegment(
      pixel,
      pathStart,
      pathEnd,
      segmentTravel,
      segmentSide
    );
    vec2 segmentDelta = pathEnd - pathStart;
    vec2 segmentDirection =
      segmentDelta / max(length(segmentDelta), 0.000001);
    float segmentBend =
      i > 0 ? clamp(1.0 - dot(previousDirection, segmentDirection), 0.0, 1.0) : 0.0;
    float segmentBendDirection = sign(
      previousDirection.x * segmentDirection.y
      - previousDirection.y * segmentDirection.x
    );

    if (segmentDistance < pathDistancePx) {
      pathDistancePx = segmentDistance;
      pathTravelPx = accumulatedPathLengthPx + segmentTravel;
      pathBend = segmentBend;
      pathBendDirection = segmentBendDirection;
      pathSide = segmentSide;
    }

    accumulatedPathLengthPx += length(pathEnd - pathStart);
    previousDirection = segmentDirection;
  }

  float pathHalfWidth = max(0.5, u_path_width * 0.5);
  float pathFeather = max(0.8, pathHalfWidth * 0.55);
  float pathLength = max(accumulatedPathLengthPx, 0.0001);
  float directionalTravelPx = pathLength - pathTravelPx;
  float revealHead = u_path_reveal * pathLength;
  float revealFeather = max(pathLength * 0.035, pathHalfWidth * 7.0);
  float revealMask =
    1.0 - smoothstep(revealHead, revealHead + revealFeather, directionalTravelPx);

  float packetCycle = mod(max(u_packet_time - 0.1, 0.0), 3.6);
  float packetProgress = smoothstep(0.0, 1.0, clamp(packetCycle / 0.9, 0.0, 1.0));
  float directionHead = packetProgress * pathLength;
  float distanceToHead = abs(directionalTravelPx - directionHead);
  float directionTrailLength = max(pathLength * 0.085, pathHalfWidth * 12.0);
  float packetPresence = 1.0 - smoothstep(0.95, 1.2, packetCycle);
  float directionPulse =
    (1.0 - smoothstep(0.0, directionTrailLength, distanceToHead))
    * packetPresence;
  float outsideBend = smoothstep(
    -0.1,
    0.9,
    -pathBendDirection * pathSide
  );
  float bendLight =
    pow(clamp(pathBend * 42.0, 0.0, 1.0), 0.55)
    * outsideBend
    * directionPulse;
  float noiseA =
    valueNoise(
      vec2(
        directionalTravelPx * 0.012 - u_time * 0.95,
        pathDistancePx * 0.85 + u_noise_seed * 2.0
      )
    );
  float noiseB =
    valueNoise(
      vec2(
        directionalTravelPx * 0.02 - u_time * 1.45 + 13.7,
        pathDistancePx * 1.2 - u_noise_seed * 3.0
      )
    );
  float haloDrift = valueNoise(
    vec2(
      directionalTravelPx * 0.006 - u_time * 0.16,
      pathDistancePx * 0.32 + u_noise_seed * 5.0
    )
  );
  float pathShimmer = mix(noiseA, noiseB, 0.42);
  pathShimmer = smoothstep(0.18, 0.88, pathShimmer);
  pathShimmer *= 0.78 + 0.22 * noiseB;
  pathShimmer = mix(pathShimmer, 1.0, directionPulse * 0.35);
  float pathBodyNoise =
    mix(noiseA - 0.5, noiseB - 0.5, 0.5);
  float edgeNoise = mix(noiseA, noiseB, 0.45) - 0.5;
  float pathEdgeNoise = mix(edgeNoise, pathBodyNoise, 0.75);
  float warpedPathDistance =
    pathDistancePx
    + pathBodyNoise
      * pathHalfWidth
      * (0.7 + directionPulse * 1.05 + 0.6)
      * 1.15
    + pathEdgeNoise * pathHalfWidth * 0.6 * 1.15;

  float pathBase =
    u_path_strength
    * revealMask
    * (1.0 - smoothstep(pathHalfWidth * 0.28, pathHalfWidth * 0.86, pathDistancePx));
  float pathCore =
    u_path_strength
    * revealMask
    * (1.0 - smoothstep(pathHalfWidth, pathHalfWidth + pathFeather, warpedPathDistance));
  float pathRim =
    u_path_strength
    * revealMask
    * (1.0 - smoothstep(pathHalfWidth * 0.1, pathHalfWidth * 1.8, abs(warpedPathDistance)));
  float pathGlow =
    u_path_strength
    * revealMask
    * (1.0 - smoothstep(pathHalfWidth * 0.45, pathHalfWidth * 2.7, abs(warpedPathDistance)));
  float packetBody =
    u_path_strength
    * revealMask
    * directionPulse
    * (1.0 - smoothstep(pathHalfWidth * 0.65, pathHalfWidth * 1.9, pathDistancePx));
  float packetAura =
    u_path_strength
    * revealMask
    * directionPulse
    * (1.0 - smoothstep(pathHalfWidth * 1.1, pathHalfWidth * 4.4, pathDistancePx));

  float pathWave =
    0.5 + 0.5 * sin(directionalTravelPx * 0.018 - u_time * 3.1 + noiseA * 4.0);
  pathWave = mix(0.76, 1.06, pathWave);

  pathBase = clamp(pathBase, 0.0, 1.0);
  pathCore = clamp(pathCore, 0.0, 1.0);
  pathRim = clamp(pathRim, 0.0, 1.0);
  pathGlow = clamp(pathGlow, 0.0, 1.0);
  packetBody = clamp(packetBody, 0.0, 1.0);
  packetAura = clamp(packetAura, 0.0, 1.0);

  vec3 primaryColor = vec3(0.42);
  vec3 haloColor = vec3(0.78);
  vec3 pathHotColor = mix(
    primaryColor * 2.1,
    vec3(0.98),
    min(1.0, pathShimmer + directionPulse * 0.4)
  );

  vec3 color = vec3(0.0);
  color += vec3(0.76) * pathBase * 0.46;
  color += vec3(0.9) * packetBody * (0.17 + pathShimmer * 0.08);
  color += vec3(0.68) * packetAura * (0.07 + haloDrift * 0.045);
  color +=
    pathHotColor
    * pathCore
    * (0.28 + 0.18 * pathShimmer + directionPulse * 0.38 + bendLight * 0.22)
    * pathWave;
  color +=
    haloColor
    * pathRim
    * (0.16 + 0.1 * haloDrift + directionPulse * 0.08 + bendLight * 0.16);
  color +=
    primaryColor
    * pathGlow
    * (0.12 + haloDrift * 0.055 + directionPulse * 0.11 + bendLight * 0.13)
    * 1.9
    * pathWave;
  color += edgeNoise * 0.045 * pathGlow * 1.05 * pathWave;
  color += pathBodyNoise * 0.055 * pathCore * 1.05;
  color += pathEdgeNoise * 0.04 * pathRim * 1.05;

  float alpha =
    pathBase * 0.36
    + packetBody * 0.16
    + packetAura * 0.065
    + pathGlow * 0.16
    + pathRim * 0.25
    + pathCore * (0.34 + directionPulse * 0.1 + bendLight * 0.08);
  alpha = clamp(alpha, 0.0, 0.82);
  color = clamp(color, 0.0, 1.0);

  if (u_dither_strength > 0.0 && u_dither_levels > 1.0) {
    float bayer = bayer4(gl_FragCoord.xy * u_dither_coarseness);
    vec3 quantized = floor(color * u_dither_levels + bayer) / u_dither_levels;
    float ditherMix =
      u_dither_strength
      * (0.22 + pathGlow * 0.18 + pathRim * 0.12)
      * alpha;
    color = mix(color, quantized, clamp(ditherMix, 0.0, 0.35));
  }

  gl_FragColor = vec4(color, alpha);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertSource: string,
  fragSource: string,
) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSource);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
  if (!vert || !frag) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const QUAD_POSITIONS = new Float32Array([
  -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
]);

function getNoiseSeed(startTimeSeconds: number) {
  const interval = Math.floor(startTimeSeconds / 10);
  return (((Math.sin(interval * 78.233) * 43758.5453) % 1) + 1) % 1;
}

export function TimelineHighlightShader({
  width,
  height,
  activePoints,
}: {
  width: number;
  height: number;
  activePoints: Point[] | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Float32Array>(
    new Float32Array(MAX_SHADER_PATH_POINTS * 2),
  );
  const targetPointsRef = useRef<Float32Array>(
    new Float32Array(MAX_SHADER_PATH_POINTS * 2),
  );
  const pointCountRef = useRef(0);
  const strengthTargetRef = useRef(0);
  const snapStrengthRef = useRef<number | null>(null);
  const resetAnimationRef = useRef(false);
  const activeSignatureRef = useRef<string | null>(null);

  const sampledPoints = useMemo(
    () =>
      activePoints && activePoints.length > 1
        ? samplePoints(activePoints, MAX_SHADER_PATH_POINTS)
        : [],
    [activePoints],
  );

  useEffect(() => {
    const nextTarget = new Float32Array(MAX_SHADER_PATH_POINTS * 2);
    sampledPoints.forEach((point, index) => {
      const pointIndex = index * 2;
      nextTarget[pointIndex] = point.x;
      nextTarget[pointIndex + 1] = point.y;
    });

    const nextSignature =
      sampledPoints.length > 0
        ? sampledPoints
            .map((point) => `${point.x.toFixed(2)}:${point.y.toFixed(2)}`)
            .join("|")
        : null;
    const pathChanged = activeSignatureRef.current !== nextSignature;

    if (
      (pointCountRef.current === 0 && sampledPoints.length > 0) ||
      pathChanged
    ) {
      pointsRef.current.set(nextTarget);
      if (pathChanged && sampledPoints.length > 1) {
        snapStrengthRef.current = 0;
        resetAnimationRef.current = true;
      }
    }

    targetPointsRef.current = nextTarget;
    pointCountRef.current = sampledPoints.length;
    strengthTargetRef.current = sampledPoints.length > 1 ? 1 : 0;
    activeSignatureRef.current = nextSignature;
  }, [sampledPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    if (!gl) {
      console.warn("WebGL not available for timeline highlight");
      return;
    }

    const program = createProgram(
      gl,
      VERTEX_SHADER_SOURCE,
      FRAGMENT_SHADER_SOURCE,
    );
    if (!program) {
      return;
    }

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uNoiseSeed = gl.getUniformLocation(program, "u_noise_seed");
    const uDitherLevels = gl.getUniformLocation(program, "u_dither_levels");
    const uDitherStrength = gl.getUniformLocation(program, "u_dither_strength");
    const uDitherCoarseness = gl.getUniformLocation(
      program,
      "u_dither_coarseness",
    );
    const uPathPointCount = gl.getUniformLocation(
      program,
      "u_path_point_count",
    );
    const uPathPoints = gl.getUniformLocation(program, "u_path_points");
    const uPathWidth = gl.getUniformLocation(program, "u_path_width");
    const uPathStrength = gl.getUniformLocation(program, "u_path_strength");
    const uPathReveal = gl.getUniformLocation(program, "u_path_reveal");
    const uPacketTime = gl.getUniformLocation(program, "u_packet_time");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_POSITIONS, gl.STATIC_DRAW);
    const activateProgram = gl.useProgram.bind(gl);

    let rafId = 0;
    let lastTime = performance.now() * 0.001;
    let timeSeconds = 0;
    let strength = 0;
    let revealProgress = 0;
    let packetTime = 0;
    let canvasWidth = 0;
    let canvasHeight = 0;
    let renderScale = 1;
    const noiseSeed = getNoiseSeed(Date.now() * 0.001);

    const setSize = () => {
      renderScale = Math.min(window.devicePixelRatio ?? 1, 2);
      const nextWidth = Math.max(1, Math.floor(width * renderScale));
      const nextHeight = Math.max(1, Math.floor(height * renderScale));
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      canvasWidth = nextWidth;
      canvasHeight = nextHeight;
      gl.viewport(0, 0, nextWidth, nextHeight);
    };

    const draw = () => {
      const now = performance.now() * 0.001;
      const dt = Math.min(now - lastTime, 0.1);
      lastTime = now;
      timeSeconds += dt;

      if (snapStrengthRef.current !== null) {
        strength = snapStrengthRef.current;
        snapStrengthRef.current = null;
      }

      if (resetAnimationRef.current) {
        revealProgress = 0;
        packetTime = 0;
        resetAnimationRef.current = false;
      }

      if (strengthTargetRef.current > 0) {
        revealProgress = Math.min(1, revealProgress + dt / 0.34);
        packetTime += dt;
      }

      const strengthFollow =
        strengthTargetRef.current > strength ? 0.16 : 0.075;
      strength += (strengthTargetRef.current - strength) * strengthFollow;

      const currentPoints = pointsRef.current;
      const targetPoints = targetPointsRef.current;
      if (strengthTargetRef.current <= 0 && strength > 0.001) {
        for (let index = 0; index < currentPoints.length; index += 1) {
          currentPoints[index] +=
            (targetPoints[index] - currentPoints[index]) * 0.16;
        }
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (strength > 0.001 && pointCountRef.current > 1) {
        activateProgram(program);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform1f(uTime, timeSeconds);
        gl.uniform2f(uResolution, canvasWidth, canvasHeight);
        gl.uniform1f(uNoiseSeed, noiseSeed);
        gl.uniform1f(uDitherLevels, 3.0);
        gl.uniform1f(uDitherStrength, 0.28);
        gl.uniform1f(uDitherCoarseness, 0.6);
        gl.uniform1i(uPathPointCount, pointCountRef.current);

        const scaledPoints = new Float32Array(MAX_SHADER_PATH_POINTS * 2);
        for (let index = 0; index < MAX_SHADER_PATH_POINTS; index += 1) {
          const pointIndex = index * 2;
          scaledPoints[pointIndex] = currentPoints[pointIndex] * renderScale;
          scaledPoints[pointIndex + 1] =
            currentPoints[pointIndex + 1] * renderScale;
        }

        gl.uniform2fv(uPathPoints, scaledPoints);
        gl.uniform1f(
          uPathWidth,
          TIMEFRAME_HIGHLIGHT_WIDTH * 0.84 * renderScale,
        );
        gl.uniform1f(uPathStrength, strength * 0.86);
        const easedReveal = 1 - (1 - revealProgress) ** 3;
        gl.uniform1f(uPathReveal, easedReveal);
        gl.uniform1f(uPacketTime, packetTime);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      rafId = requestAnimationFrame(draw);
    };

    setSize();
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      gl.deleteProgram(program);
      if (buffer) {
        gl.deleteBuffer(buffer);
      }
    };
  }, [height, width]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute right-0 top-0 z-[12] block"
      style={{ width, height }}
    />
  );
}
