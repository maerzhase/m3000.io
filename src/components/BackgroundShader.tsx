"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

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
uniform vec3 u_base_color;
uniform vec3 u_primary_color;
uniform float u_intensity;
uniform vec2 u_mouse;
uniform float u_mouse_glow_intensity;
uniform float u_mouse_glow_radius;
uniform float u_color_intensity;
uniform float u_vignette_strength;
uniform float u_vignette_radius;
uniform float u_band_strength;
uniform float u_noise_band_warp;
uniform float u_noise_band_strength;
uniform float u_noise_global_strength;
uniform float u_dither_levels;
uniform float u_dither_strength;

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

float blob(vec2 uv, vec2 center, float radius) {
  float d = length(uv - center);
  return exp(-(d * d) / (2.0 * radius * radius));
}

void main() {
  vec2 uv = v_uv;

  vec3 col = u_base_color;

  float minRes = min(u_resolution.x, u_resolution.y);
  float rScale = clamp(520.0 / minRes, 1.0, 1.6);
  vec2 c1 = vec2(0.25, 0.5) + 0.04 * vec2(sin(u_time * 0.1), cos(u_time * 0.12));
  vec2 c2 = vec2(0.5, 0.45) + 0.03 * vec2(cos(u_time * 0.08), sin(u_time * 0.1));
  vec2 c3 = vec2(0.75, 0.5) + 0.04 * vec2(sin(u_time * 0.11 + 1.0), cos(u_time * 0.09));
  vec3 b1 = vec3(0.09);
  vec3 b2 = vec3(0.14);
  vec3 b3 = vec3(0.08);
  float r = 0.45 * rScale;
  float rCenter = 0.55 * rScale;
  col += u_intensity * (blob(uv, c1, r) * b1 + blob(uv, c2, rCenter) * b2 + blob(uv, c3, r) * b3);

  float d = length(uv - 0.5);
  float vig = 1.0 - smoothstep(u_vignette_radius * 0.5, u_vignette_radius, d);
  vig = mix(1.0 - u_vignette_strength, 1.0, vig);
  col *= vig;

  float bandX = uv.x + u_noise_band_warp * valueNoise(uv * 2.0 + u_time * 0.2);
  float band = sin(bandX * 6.28318 * 2.0 + u_time * 0.1) * 0.5 + 0.5;
  band += (valueNoise(uv * 4.0 + u_time * 0.15) - 0.5) * u_noise_band_strength;
  col += u_band_strength * band;

  col += (valueNoise(uv * 8.0 + u_time * 0.1) - 0.5) * u_noise_global_strength;

  if (u_mouse.x >= 0.0 && u_mouse.x <= 1.0 && u_mouse.y >= 0.0 && u_mouse.y <= 1.0) {
    float mouseGlow = blob(uv, u_mouse, u_mouse_glow_radius);
    col += u_color_intensity * 1.85 * u_mouse_glow_intensity * mouseGlow * u_primary_color;
  }

  col = clamp(col, 0.0, 1.0);

  if (u_dither_strength > 0.0 && u_dither_levels > 1.0) {
    float bayer = bayer4(gl_FragCoord.xy);
    vec3 quantized = floor(col * u_dither_levels + bayer) / u_dither_levels;
    col = mix(col, quantized, u_dither_strength);
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    console.error("Shader compile error:", log);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertSource: string,
  fragSource: string,
): WebGLProgram | null {
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

// Fullscreen quad: two triangles (clip-space)
const QUAD_POSITIONS = new Float32Array([
  -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
]);

const BASE_COLOR = [7 / 255, 7 / 255, 7 / 255] as const;
const PRIMARY_COLOR = [0.45, 0.1, 0.02] as const;

const DEFAULT_PARAMS = {
  intensity: 0.3,
  colorIntensity: 2.5,
  mouseGlowIntensity: 0.1,
  mouseGlowRadius: 0.17,
  vignetteStrength: 1,
  vignetteRadius: 0.35,
  bandStrength: 0.065,
  noiseBandWarp: 0.15,
  noiseBandStrength: 0.08,
  noiseGlobalStrength: 0.04,
  ditherLevels: 3,
  ditherStrength: 0.3,
  opacity: 0.62,
} as const;

type ShaderParams = Record<keyof typeof DEFAULT_PARAMS, number>;

const BackgroundShader: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef<ShaderParams>({ ...DEFAULT_PARAMS });
  const [params, setParams] = useState<ShaderParams>({ ...DEFAULT_PARAMS });
  const [panelOpen, setPanelOpen] = useState(false);

  const updateParam = (key: keyof ShaderParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    paramsRef.current[key] = value;
  };

  useEffect(() => {
    const root = rootRef.current;
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const setReducedMotionAttr = () => {
      if (root) {
        root.setAttribute(
          "data-reduced-motion",
          reducedMotionQuery.matches ? "true" : "false",
        );
      }
    };
    setReducedMotionAttr();
    reducedMotionQuery.addEventListener("change", setReducedMotionAttr);
    return () =>
      reducedMotionQuery.removeEventListener("change", setReducedMotionAttr);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
    });
    if (!gl) {
      console.warn("WebGL not available");
      return;
    }

    const program = createProgram(
      gl,
      VERTEX_SHADER_SOURCE,
      FRAGMENT_SHADER_SOURCE,
    );
    if (!program) return;

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_POSITIONS, gl.STATIC_DRAW);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uBaseColor = gl.getUniformLocation(program, "u_base_color");
    const uPrimaryColor = gl.getUniformLocation(program, "u_primary_color");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uIntensity = gl.getUniformLocation(program, "u_intensity");
    const uVignetteStrength = gl.getUniformLocation(
      program,
      "u_vignette_strength",
    );
    const uVignetteRadius = gl.getUniformLocation(program, "u_vignette_radius");
    const uBandStrength = gl.getUniformLocation(program, "u_band_strength");
    const uNoiseBandWarp = gl.getUniformLocation(program, "u_noise_band_warp");
    const uNoiseBandStrength = gl.getUniformLocation(
      program,
      "u_noise_band_strength",
    );
    const uNoiseGlobalStrength = gl.getUniformLocation(
      program,
      "u_noise_global_strength",
    );
    const uDitherLevels = gl.getUniformLocation(program, "u_dither_levels");
    const uDitherStrength = gl.getUniformLocation(program, "u_dither_strength");
    const uMouseGlowIntensity = gl.getUniformLocation(
      program,
      "u_mouse_glow_intensity",
    );
    const uMouseGlowRadius = gl.getUniformLocation(
      program,
      "u_mouse_glow_radius",
    );
    const uColorIntensity = gl.getUniformLocation(program, "u_color_intensity");

    const mouse = { x: -1, y: -1 };

    const setMouseFromEvent = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1 - e.clientY / window.innerHeight;
    };
    const onPointerMove = setMouseFromEvent;
    const onPointerDown = setMouseFromEvent;
    const onPointerLeave = () => {
      mouse.x = -1;
      mouse.y = -1;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerleave", onPointerLeave);

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let timeSeconds = 0;
    let rafId = 0;
    let lastTime = performance.now() * 0.001;

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = () => {
      setSize();

      const now = performance.now() * 0.001;
      const reduce = reducedMotionQuery.matches;
      const hidden = document.hidden;

      if (!reduce && !hidden) {
        timeSeconds += now - lastTime;
      }
      lastTime = now;

      gl.useProgram(program);

      const p = paramsRef.current;
      gl.uniform1f(uTime, timeSeconds);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform3f(uBaseColor, BASE_COLOR[0], BASE_COLOR[1], BASE_COLOR[2]);
      gl.uniform3f(
        uPrimaryColor,
        PRIMARY_COLOR[0],
        PRIMARY_COLOR[1],
        PRIMARY_COLOR[2],
      );
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uIntensity, p.intensity);
      gl.uniform1f(uVignetteStrength, p.vignetteStrength);
      gl.uniform1f(uVignetteRadius, p.vignetteRadius);
      gl.uniform1f(uBandStrength, p.bandStrength);
      gl.uniform1f(uNoiseBandWarp, p.noiseBandWarp);
      gl.uniform1f(uNoiseBandStrength, p.noiseBandStrength);
      gl.uniform1f(uNoiseGlobalStrength, p.noiseGlobalStrength);
      gl.uniform1f(uDitherLevels, p.ditherLevels);
      gl.uniform1f(uDitherStrength, p.ditherStrength);
      gl.uniform1f(uMouseGlowIntensity, p.mouseGlowIntensity);
      gl.uniform1f(uMouseGlowRadius, p.mouseGlowRadius);
      gl.uniform1f(uColorIntensity, p.colorIntensity);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafId = requestAnimationFrame(draw);
    };

    setSize();
    rafId = requestAnimationFrame(draw);

    const onResize = () => setSize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerleave", onPointerLeave);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative min-h-dvh bg-[#070707] text-white"
      data-reduced-motion="false"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0 block h-full w-full"
        style={{ width: "100%", height: "100%", opacity: params.opacity }}
        aria-hidden
      />
      <div className="relative z-10">{children}</div>

      {process.env.NEXT_PUBLIC_SHOW_SHADER_PARAMS === "true" && (
        <div className="fixed bottom-4 left-4 z-20">
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            className="rounded-md border border-white/20 bg-black/80 px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            {panelOpen ? "Hide params" : "Shader params"}
          </button>
          {panelOpen && (
            <div className="mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-md border border-white/20 bg-black/90 p-3 text-sm text-white shadow-lg">
              <p className="mb-2 font-medium text-white/90">
                Background shader
              </p>
              <div className="space-y-3">
                <label className="block">
                  <span className="block text-xs text-white/70">Intensity</span>
                  <input
                    type="range"
                    min={0}
                    max={0.3}
                    step={0.01}
                    value={params.intensity}
                    onChange={(e) =>
                      updateParam("intensity", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.intensity.toFixed(2)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Color intensity
                  </span>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={params.colorIntensity}
                    onChange={(e) =>
                      updateParam("colorIntensity", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.colorIntensity.toFixed(2)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Mouse glow intensity
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={0.1}
                    step={0.005}
                    value={params.mouseGlowIntensity}
                    onChange={(e) =>
                      updateParam("mouseGlowIntensity", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.mouseGlowIntensity.toFixed(3)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Mouse glow radius
                  </span>
                  <input
                    type="range"
                    min={0.05}
                    max={0.5}
                    step={0.01}
                    value={params.mouseGlowRadius}
                    onChange={(e) =>
                      updateParam("mouseGlowRadius", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.mouseGlowRadius.toFixed(2)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Vignette strength
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={params.vignetteStrength}
                    onChange={(e) =>
                      updateParam("vignetteStrength", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.vignetteStrength.toFixed(2)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Vignette radius
                  </span>
                  <input
                    type="range"
                    min={0.3}
                    max={1}
                    step={0.05}
                    value={params.vignetteRadius}
                    onChange={(e) =>
                      updateParam("vignetteRadius", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.vignetteRadius.toFixed(2)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Band strength
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={0.1}
                    step={0.005}
                    value={params.bandStrength}
                    onChange={(e) =>
                      updateParam("bandStrength", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.bandStrength.toFixed(3)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Noise band warp
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={0.15}
                    step={0.01}
                    value={params.noiseBandWarp}
                    onChange={(e) =>
                      updateParam("noiseBandWarp", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.noiseBandWarp.toFixed(2)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Noise band strength
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={0.08}
                    step={0.005}
                    value={params.noiseBandStrength}
                    onChange={(e) =>
                      updateParam("noiseBandStrength", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.noiseBandStrength.toFixed(3)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Noise global strength
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={0.04}
                    step={0.005}
                    value={params.noiseGlobalStrength}
                    onChange={(e) =>
                      updateParam("noiseGlobalStrength", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.noiseGlobalStrength.toFixed(3)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Dither levels
                  </span>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    step={1}
                    value={params.ditherLevels}
                    onChange={(e) =>
                      updateParam("ditherLevels", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.ditherLevels}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">
                    Dither strength
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={params.ditherStrength}
                    onChange={(e) =>
                      updateParam("ditherStrength", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.ditherStrength.toFixed(2)}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs text-white/70">Opacity</span>
                  <input
                    type="range"
                    min={0.5}
                    max={1}
                    step={0.02}
                    value={params.opacity}
                    onChange={(e) =>
                      updateParam("opacity", Number(e.target.value))
                    }
                    className="w-full accent-[#ff2f00]"
                  />
                  <span className="text-xs text-white/50">
                    {params.opacity.toFixed(2)}
                  </span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  const text = JSON.stringify(params, null, 2);
                  void navigator.clipboard.writeText(text);
                }}
                className="mt-3 w-full rounded border border-white/20 py-1.5 text-xs text-white/80 hover:bg-white/10"
              >
                Copy param settings to clipboard
              </button>
              <button
                type="button"
                onClick={() => {
                  const def = { ...DEFAULT_PARAMS };
                  setParams(def);
                  paramsRef.current = def;
                }}
                className="mt-2 w-full rounded border border-white/20 py-1.5 text-xs text-white/80 hover:bg-white/10"
              >
                Reset to default
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BackgroundShader;
