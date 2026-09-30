"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  type ShaderHighlightController,
  type ShaderHighlightPayload,
  ShaderHighlightProvider,
} from "./ShaderHighlight";
import {
  SMOKE_DENSITY_FRAGMENT_SOURCE,
  SMOKE_LAYER_COUNT,
  SMOKE_TIME_FRAMES,
  SMOKE_TIME_PERIOD,
} from "./shaders/smoke";

const MAX_HIGHLIGHT_RECTS = 4;
const MAX_CONTENT_RECTS = 8;

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_base_color;
uniform vec3 u_primary_color;
uniform float u_intensity;
uniform sampler2D u_trail;
uniform sampler2D u_smoke_texture;
uniform float u_smoke_mix;
uniform float u_mouse_glow_intensity;
uniform float u_color_intensity;
uniform float u_vignette_strength;
uniform float u_vignette_radius;
uniform float u_band_strength;
uniform float u_noise_band_warp;
uniform float u_noise_band_strength;
uniform float u_noise_global_strength;
uniform float u_dither_levels;
uniform float u_dither_strength;
uniform float u_dither_coarseness;
uniform float u_scroll;
uniform float u_scroll_parallax;
uniform float u_smoke_texel;
uniform float u_density_preview;
uniform float u_noise_seed;
uniform float u_depth_strength;
uniform float u_rgb_split;
uniform int u_highlight_count;
uniform vec2 u_highlight_centers[4];
uniform vec2 u_highlight_sizes[4];
uniform float u_highlight_radii[4];
uniform float u_highlight_strength;
uniform float u_highlight_age;
uniform float u_highlight_edge_boost;
uniform float u_highlight_dither_repel;
uniform float u_highlight_noise;
uniform float u_highlight_halo;
uniform float u_highlight_halo_spread;
uniform int u_content_count;
uniform vec4 u_content_rects[8];

varying vec2 v_uv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 seedOffset(float phase) {
  float angle = hash(vec2(u_noise_seed + phase, 13.7 + phase)) * 6.28318;
  float radius = mix(3.5, 8.5, hash(vec2(29.1 - phase, u_noise_seed * 2.0 + phase)));
  return vec2(cos(angle), sin(angle)) * radius;
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

vec2 toWorld(vec2 uv) {
  return (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
}

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

vec2 smokeFrame(vec2 tileUv, float layer, float frame) {
  float pair = floor(frame * 0.5);
  vec2 atlasUv = vec2((tileUv.x + layer) / 3.0, (tileUv.y + pair) / ${SMOKE_TIME_FRAMES / 2}.0);
  vec4 density = texture2D(u_smoke_texture, atlasUv);
  return mod(frame, 2.0) < 0.5 ? density.rg : density.ba;
}

vec2 smokeLayer(vec2 p, float layer, float localTime) {
  vec2 tileUv = mix(vec2(u_smoke_texel * 0.5), vec2(1.0 - u_smoke_texel * 0.5), fract(p));
  float phase = fract(u_time / ${SMOKE_TIME_PERIOD}.0 + localTime) * ${SMOKE_TIME_FRAMES}.0;
  float frame = floor(phase);
  return mix(smokeFrame(tileUv, layer, frame),
    smokeFrame(tileUv, layer, mod(frame + 1.0, ${SMOKE_TIME_FRAMES}.0)), fract(phase));
}

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec4 organicFlow(vec2 p) {
  vec2 fieldUv = p * 9.0 + seedOffset(19.4) + vec2(u_time * 0.32, -u_time * 0.24);
  vec2 domainWarp = vec2(valueNoise(fieldUv * 0.45 + 13.2),
    valueNoise(fieldUv * 0.45 + 47.8)) - 0.5;
  fieldUv += domainWarp * 1.6;
  vec2 turbulence = vec2(valueNoise(fieldUv), valueNoise(fieldUv + 31.7)) - 0.5;
  float curlX = valueNoise(fieldUv + vec2(0.12, 0.0))
    - valueNoise(fieldUv - vec2(0.12, 0.0));
  float curlY = valueNoise(fieldUv + vec2(0.0, 0.12))
    - valueNoise(fieldUv - vec2(0.0, 0.12));
  return vec4(turbulence, -curlY, curlX);
}

// A single pressure front gives way to continuously evolving local flow.
vec4 highlightFlow(vec2 p, vec4 field) {
  if (u_highlight_strength < 0.001 || u_highlight_count == 0) return vec4(0.0);
  float distance = 1e5;
  vec2 boundaryNormal = vec2(1.0, 0.0);
  for (int i = 0; i < 4; i++) {
    if (i >= u_highlight_count) break;
    vec2 offset = p - toWorld(u_highlight_centers[i]);
    vec2 size = u_highlight_sizes[i] * vec2(u_resolution.x / u_resolution.y, 1.0);
    float radius = min(u_highlight_radii[i], min(size.x, size.y));
    float d = sdRoundedBox(offset, size, radius);
    if (d < distance) {
      distance = d;
      vec2 core = max(size - vec2(radius), vec2(0.0));
      vec2 edgeDelta = offset - clamp(offset, -core, core);
      vec2 faceDistance = size - abs(offset);
      boundaryNormal = length(edgeDelta) > 0.0001 ? normalize(edgeDelta)
        : (faceDistance.x < faceDistance.y
          ? vec2(sign(offset.x + 0.0001), 0.0)
          : vec2(0.0, sign(offset.y + 0.0001)));
    }
  }
  vec2 turbulence = field.xy;
  vec2 circulation = field.zw;
  float shimmer = smoothstep(0.3, 0.75, valueNoise(p * 24.0 + turbulence * 2.0
    + seedOffset(32.8) + vec2(u_time * 1.1, -u_time * 0.8)));
  float outside = max(0.0, distance);
  float localDistance = max(0.0, distance + turbulence.x * 0.012);
  float local = exp(-localDistance * localDistance / 0.0064);
  float contourWidth = max(0.012, 12.0 / min(u_resolution.x, u_resolution.y))
    * (0.9 + (turbulence.x + 0.5) * 0.8);
  float contourDistance = distance - 0.006 + turbulence.y * 0.016 + circulation.x * 0.018;
  float contour = exp(-contourDistance * contourDistance / (contourWidth * contourWidth));
  vec2 boundaryTangent = vec2(-boundaryNormal.y, boundaryNormal.x);
  vec2 contourFlow = boundaryTangent * dot(circulation, boundaryTangent) * 0.1
    + boundaryNormal * (0.008 + turbulence.x * 0.018);
  // The travelling impulse catches existing density folds, not a uniform rim.
  vec2 rippleUv = p * 0.27 + vec2(0.68,
    -u_scroll * u_scroll_parallax * 0.167 + u_time * 0.0015);
  vec2 rippleMist = smokeLayer(rippleUv, 2.0, 0.0);
  float fogFold = 0.2 + 0.8 * smoothstep(0.12, 0.65, rippleMist.g)
    * (0.25 + smoothstep(0.06, 0.4, rippleMist.r) * 0.75);
  contour *= smoothstep(0.35, 0.7, turbulence.y + 0.5) * (0.3 + fogFold * 0.7);
  float front = outside + turbulence.x * 0.085 + circulation.y * 0.06
    - u_highlight_age * 0.19;
  float envelope = exp(-front * front / 0.0025) * exp(-u_highlight_age * 1.1)
    * smoothstep(-0.025, 0.02, distance) * fogFold;
  vec2 direction = boundaryNormal * 0.45 + circulation * 3.0 + turbulence * 0.5;
  vec2 displacement = direction * envelope * 0.15
    + (circulation * 0.18 + turbulence * 0.035) * local
    + contourFlow * contour * (1.0 + shimmer * 0.4);
  float compression = envelope * (0.18 + fogFold * 0.45)
    + local * (0.38 + turbulence.x * 0.2 + turbulence.y * 0.1
      + shimmer * fogFold * 0.18)
    + contour * (0.95 + turbulence.y * 0.2 + shimmer * 0.35);
  return vec4(displacement, compression, max(local, envelope)) * u_highlight_strength;
}

vec4 interactionFlow(vec2 p, vec4 wake) {
  if (wake.r < 0.001 && u_highlight_strength < 0.001) return vec4(0.0);
  vec4 field = organicFlow(p);
  vec4 highlight = highlightFlow(p, field);
  float presence = pow(clamp(wake.r / 0.85, 0.0, 1.0), 0.85) * 0.8;
  vec2 momentum = (wake.gb - 0.5) * 2.0;
  vec2 displacement = field.zw * 0.18 + field.xy * 0.035 + momentum * 0.012;
  float compression = 0.7 + field.x * 0.65 + field.y * 0.25;
  vec4 cursor = vec4(displacement, compression, 1.0) * presence;
  return highlight + cursor * (1.0 - clamp(highlight.w, 0.0, 1.0) * 0.6);
}

float smokeDensity(vec2 uv, float contentMask, float detailMix) {
  vec2 p = toWorld(uv);
  vec4 wake = texture2D(u_trail, uv);
  vec4 pressure = interactionFlow(p, wake);
  vec2 flowPosition = p * 2.5 + vec2(u_time * 0.015, -u_time * 0.012);
  float flowX = valueNoise(flowPosition + vec2(0.1, 0.0))
    - valueNoise(flowPosition - vec2(0.1, 0.0));
  float flowY = valueNoise(flowPosition + vec2(0.0, 0.1))
    - valueNoise(flowPosition - vec2(0.0, 0.1));
  vec2 flow = vec2(-flowY, flowX) * 2.5;
  float opening = smoothstep(0.0, 0.8, wake.a);
  vec2 wakeStep = vec2(0.006) / vec2(u_resolution.x / u_resolution.y, 1.0);
  vec4 wakeRight = texture2D(u_trail, uv + vec2(wakeStep.x, 0.0));
  vec4 wakeLeft = texture2D(u_trail, uv - vec2(wakeStep.x, 0.0));
  vec4 wakeUp = texture2D(u_trail, uv + vec2(0.0, wakeStep.y));
  vec4 wakeDown = texture2D(u_trail, uv - vec2(0.0, wakeStep.y));
  vec2 wakeGradient = vec2(
    wakeRight.a - wakeLeft.a, wakeUp.a - wakeDown.a
  );
  vec2 parting = wakeGradient * (0.7 + valueNoise(p * 16.0 + seedOffset(91.2)) * 0.6);
  float response = pow(clamp(wake.r / 0.65, 0.0, 1.0), 0.7);
  float detailDrive = smoothstep(0.02, 0.85, length((wake.gb - 0.5) * 2.0));
  float shear = smoothstep(0.02, 0.3,
    length(wakeRight.gb - wakeLeft.gb) + length(wakeUp.gb - wakeDown.gb));
  float localTime = response * u_depth_strength * 0.22 + opening * 0.018
    + pressure.w * (0.008 + pressure.z * 0.018);
  float scroll = u_scroll * u_scroll_parallax;
  vec2 farUv = p * 0.14 + vec2(0.18, -scroll * 0.011 + u_time * 0.0006);
  vec2 middleUv = p * 0.20 + vec2(0.43, -scroll * 0.048 - u_time * 0.0011);
  vec2 nearUv = p * 0.27 + vec2(0.68, -scroll * 0.167 + u_time * 0.0015);
  vec2 farLayer = smokeLayer(farUv + flow * 0.007 - pressure.xy * 0.035, 0.0, localTime * 0.2);
  vec2 middleLayer = smokeLayer(middleUv + flow * 0.016 - pressure.xy * 0.12 + parting * 0.007, 1.0, localTime * 0.55);
  vec2 nearLayer = smokeLayer(nearUv + flow * 0.027 - pressure.xy * 0.27 + parting * 0.022, 2.0, localTime);
  nearLayer.r *= 1.0 + pressure.z * 0.65;
  // Fine density folds exist everywhere, but only scatter light in the wake.
  vec2 detailWarp = vec2(valueNoise(p * 6.0 + seedOffset(71.2)),
    valueNoise(p * 6.0 + seedOffset(73.4))) - 0.5;
  vec2 detailUv = p * 28.0 + detailWarp * 2.5 + flow * 0.3
    - pressure.xy * 18.0 + seedOffset(83.1)
    + vec2(u_time * 0.025, -u_time * 0.018);
  // Reveal progressively finer structure as local motion and shear build up.
  float fineReveal = clamp(detailDrive * 0.8 + shear * 0.4, 0.0, 1.0);
  float detail = valueNoise(detailUv) * mix(0.56, 0.34, fineReveal)
    + valueNoise(detailUv * 2.0 + 9.7) * mix(0.28, 0.35, fineReveal)
    + valueNoise(detailUv * 4.0 + 21.3) * mix(0.16, 0.31, fineReveal) - 0.5;
  float filaments = pow(max(0.0, 1.0 - abs(detail) * 5.0), 4.0);
  float revealVariation = 0.8 + valueNoise(p * 9.0 + seedOffset(97.4)
    + vec2(u_time * 0.18, -u_time * 0.13)) * 0.4;
  float detailAmount = max(
    response * (0.2 + detailDrive * 0.2 + shear * 0.1) * revealVariation,
    pressure.w * 0.4);
  detailAmount = min(detailAmount, 1.35) * detailMix;
  nearLayer.r *= 1.0 + detail * detailAmount * 1.4;
  nearLayer.r = max(0.0, nearLayer.r
    + (filaments - 0.45) * detailAmount * (0.025 + nearLayer.g * 0.065));
  nearLayer.g = clamp(nearLayer.g + detail * detailAmount * 0.16, 0.0, 1.0);
  // Re-form the layers in depth order, like a local replay of the entrance.
  middleLayer *= 1.0 - opening * 0.16;
  nearLayer *= 1.0 - opening * 0.52;

  float farLight = farLayer.r * 0.5;
  float middleCoverage = middleLayer.g * (0.68 - contentMask * 0.18);
  float nearCoverage = nearLayer.g * (0.82 - contentMask * 0.3);
  float middleLight = middleLayer.r * (1.0 - contentMask * 0.2);
  float nearLight = nearLayer.r * (1.0 - contentMask * 0.4);
  float light = farLight * (1.0 - middleCoverage) + middleLight * 0.9;
  light = light * (1.0 - nearCoverage) + nearLight * 1.05;
  return 1.0 - exp(-light * 2.3);
}

vec3 baseScene(vec2 uv, float contentMask, float detailMix) {
  vec2 p = toWorld(uv);
  float minRes = min(u_resolution.x, u_resolution.y);
  float rScale = clamp(520.0 / minRes, 1.0, 1.6);
  float t = u_time * 1.2;
  vec2 bandSeed = seedOffset(0.0);
  vec2 detailSeed = seedOffset(7.3);
  float sceneRotation = (hash(vec2(u_noise_seed, 41.0)) - 0.5) * 0.8;
  mat2 sceneBasis = rotate2d(sceneRotation);
  p = sceneBasis * p;
  p -= sceneBasis * vec2(0.0, u_scroll * u_scroll_parallax * 0.07);
  vec2 sceneOffsetA = sceneBasis * (seedOffset(31.4) * 0.028);
  vec2 sceneOffsetB = sceneBasis * (seedOffset(47.2) * 0.022);
  vec2 sceneOffsetC = sceneBasis * (seedOffset(59.8) * 0.028);
  vec2 baseA = sceneBasis * vec2(-0.34, 0.0);
  vec2 baseB = sceneBasis * vec2(0.0, -0.05);
  vec2 baseC = sceneBasis * vec2(0.34, 0.0);
  vec2 c1 =
    baseA
    + sceneOffsetA
    + 0.04 * vec2(sin(t * 0.1), cos(t * 0.12));
  vec2 c2 =
    baseB
    + sceneOffsetB
    + 0.03 * vec2(cos(t * 0.08), sin(t * 0.1));
  vec2 c3 =
    baseC
    + sceneOffsetC
    + 0.04 * vec2(sin(t * 0.11 + 1.0), cos(t * 0.09));
  vec3 b1 = vec3(0.09);
  vec3 b2 = vec3(0.14);
  vec3 b3 = vec3(0.08);
  float r = 0.45 * rScale;
  float rCenter = 0.55 * rScale;
  vec3 col = u_base_color;
  col += u_intensity * (blob(p, c1, r) * b1 + blob(p, c2, rCenter) * b2 + blob(p, c3, r) * b3);
  float d = length(toWorld(uv));
  float vig = 1.0 - smoothstep(u_vignette_radius * 0.5, u_vignette_radius, d);
  vig = mix(1.0 - u_vignette_strength, 1.0, vig);
  col *= vig;
  float bandAngle = (hash(vec2(u_noise_seed, 67.0)) - 0.5) * 1.4;
  mat2 bandBasis = rotate2d(bandAngle);
  vec2 bandP = bandBasis * p;
  float bandX =
    bandP.x
    + u_noise_band_warp
      * valueNoise(bandP * 2.0 + bandSeed + vec2(t * 0.2, 0.0));
  float band = sin(bandX * 6.28318 * 2.0 + t * 0.1) * 0.5 + 0.5;
  band +=
    (valueNoise(
      bandP * 4.0 + bandSeed * 1.35 + vec2(t * 0.15, -t * 0.08)
    ) - 0.5)
    * u_noise_band_strength;
  col += u_band_strength * band;
  col +=
    (valueNoise(bandP * 8.0 + detailSeed + vec2(t * 0.1, -t * 0.06)) - 0.5)
    * u_noise_global_strength;
  float ambientLight = clamp(length(col - u_base_color) * 7.0, 0.0, 1.0);
  float mist = smokeDensity(uv, contentMask, detailMix);
  float scatteredLight = pow(mist, 1.1) * u_intensity * (0.66 + ambientLight * 0.08);
  vec3 smokeScene = u_base_color * 1.05 + vec3(scatteredLight);
  smokeScene += max(col - u_base_color, 0.0) * (0.08 + mist * 0.12);
  return mix(col, smokeScene, u_smoke_mix);
}

void main() {
  vec2 uv = v_uv;
  float trail = texture2D(u_trail, uv).r;
  vec2 worldUv = toWorld(uv);
  float contentMask = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= u_content_count) break;
    vec4 rect = u_content_rects[i];
    vec2 delta = worldUv - toWorld(rect.xy);
    vec2 size = rect.zw * vec2(u_resolution.x / u_resolution.y, 1.0);
    float distance = sdRoundedBox(delta, size, 0.035);
    contentMask = max(contentMask, 1.0 - smoothstep(-0.03, 0.18, distance));
  }
  if (u_density_preview > 0.5) {
    gl_FragColor = vec4(vec3(smokeDensity(uv, 0.0, 1.0) * u_smoke_mix), 1.0);
    return;
  }
  float highlightFeather = max(0.005, 12.0 / min(u_resolution.x, u_resolution.y));
  float highlightMask = 0.0;
  float highlightEdge = 0.0;
  vec2 highlightDelta = vec2(1.0, 0.0);
  float nearestRectDist = 1e5;

  for (int i = 0; i < 4; i++) {
    if (i >= u_highlight_count) break;
    vec2 rectDelta = worldUv - toWorld(u_highlight_centers[i]);
    vec2 rectSize = max(
      u_highlight_sizes[i] * vec2(u_resolution.x / u_resolution.y, 1.0),
      vec2(0.0001)
    );
    float rectRadius = min(
      u_highlight_radii[i],
      min(rectSize.x, rectSize.y)
    );
    float rectSdf = sdRoundedBox(rectDelta, rectSize, rectRadius);
    float rectMask = 1.0 - smoothstep(0.0, highlightFeather, rectSdf);
    float rectEdge =
      1.0 - smoothstep(highlightFeather * 0.35, highlightFeather * 2.4, abs(rectSdf));

    if (rectSdf < nearestRectDist) {
      nearestRectDist = rectSdf;
      highlightDelta = rectDelta;
    }

    highlightMask = max(highlightMask, rectMask);
    highlightEdge = max(highlightEdge, rectEdge);
  }

  highlightMask *= u_highlight_strength;
  highlightEdge *= u_highlight_strength;
  vec3 centerScene = baseScene(uv, contentMask, 1.0);
  vec4 pressure = interactionFlow(worldUv, texture2D(u_trail, uv));
  float highlightFog = pressure.w > 0.001
    ? smokeDensity(uv, 0.0, 0.0) : 0.0;
  vec2 noiseUv =
    worldUv * 7.0
    + seedOffset(19.4)
    + vec2(u_time * 0.015, -u_time * 0.012);
  float noiseA = valueNoise(noiseUv);
  float noiseB = valueNoise(noiseUv * 1.9 + 17.3);
  float edgeNoise = mix(noiseA, noiseB, 0.45) - 0.5;
  float fogStructure = smoothstep(0.12, 0.7, highlightFog);
  float noisyEdge =
    highlightEdge * (0.45 + fogStructure * 0.55)
    * max(0.35, 1.0 + edgeNoise * 1.5 * u_highlight_noise);
  float organicSpread = mix(0.55, 1.45, fogStructure * 0.65 + noiseB * 0.35);
  float halo =
    u_highlight_strength
    * (1.0 - smoothstep(
      highlightFeather * 1.6,
      highlightFeather * u_highlight_halo_spread * organicSpread,
      abs(nearestRectDist)
    ));
  halo *= (0.45 + fogStructure * 0.55) * (0.65 + noiseB * 0.35);
  halo *= u_highlight_halo;
  highlightMask = clamp(highlightMask, 0.0, 1.0);
  highlightEdge = clamp(noisyEdge, 0.0, 1.5);
  halo = clamp(halo, 0.0, 1.0);
  float trailEff = pow(max(0.0, trail), 0.65);
  vec2 radialDir =
    length(highlightDelta) > 0.0001 ? normalize(highlightDelta) : vec2(1.0, 0.0);
  vec2 tangentDir = vec2(-radialDir.y, radialDir.x);

  vec3 col = centerScene;
  vec2 momentum = (texture2D(u_trail, uv).gb - 0.5) * 2.0;
  float motionEnergy = smoothstep(0.012, 0.32, length(momentum));
  float wakeRim = 0.0;
  vec3 primaryHue = u_primary_color / max(max(u_primary_color.r, u_primary_color.g), max(u_primary_color.b, 0.001));
  vec3 primaryLight = primaryHue / max(dot(primaryHue, vec3(0.2126, 0.7152, 0.0722)), 0.001);
  vec3 primaryChroma = primaryHue - vec3(dot(primaryHue, vec3(0.2126, 0.7152, 0.0722)));
  float hoverFlow = valueNoise(worldUv * 9.0 + seedOffset(19.4)
    + vec2(u_time * 0.32, -u_time * 0.24));
  float hoverDistance = max(0.0, nearestRectDist);
  float hoverShimmer = smoothstep(0.3, 0.75, valueNoise(worldUv * 24.0
    + vec2(hoverFlow - 0.5) * 2.0 + seedOffset(32.8)
    + vec2(u_time * 1.1, -u_time * 0.8)));
  float hoverAccent = u_highlight_strength * exp(-hoverDistance * hoverDistance / 0.005)
    * (0.35 + smoothstep(0.38, 0.7, hoverFlow) * 0.75)
    * (0.5 + fogStructure * 0.5) * (1.0 + hoverShimmer * 0.35);
  float colorHighlight = smoothstep(0.68, 0.98, pressure.z / max(pressure.w, 0.001))
    * (0.35 + fogStructure * 0.65);
  colorHighlight = max(colorHighlight, hoverAccent);
  float rgbSplitStrength =
    u_rgb_split
    + pressure.w * u_highlight_edge_boost * 0.14;
  if (
    rgbSplitStrength > 0.0 &&
    (trail > 0.005 || pressure.w > 0.001)
  ) {
    vec2 velDir = length(momentum) > 0.01 ? normalize(momentum) : vec2(1.0, 0.0);
    vec2 flowDir = normalize(pressure.xy + tangentDir * 0.008);
    velDir = normalize(mix(velDir, flowDir, min(0.95, pressure.w)));
    float rs =
      max(
        trailEff * motionEnergy,
        pressure.z * 1.5 + pressure.w * 0.25
      )
      * rgbSplitStrength
      * 0.48;
    rs = min(rs, 10.0 / min(u_resolution.x, u_resolution.y));
    vec2 splitOffset = rs * velDir / vec2(u_resolution.x / u_resolution.y, 1.0);
    vec3 broadScene = baseScene(uv, contentMask, 0.0);
    vec3 cr = baseScene(uv - splitOffset, contentMask, 0.0);
    vec3 cb = baseScene(uv + splitOffset, contentMask, 0.0);
    vec3 splitDifference = vec3(cr.r - broadScene.r, 0.0, cb.b - broadScene.b);
    vec3 splitChroma = splitDifference
      - vec3(dot(splitDifference, vec3(0.2126, 0.7152, 0.0722)));
    colorHighlight = max(colorHighlight,
      smoothstep(0.006, 0.025, abs(cb.g - cr.g)) * (0.35 + fogStructure * 0.65));
    float colorContrast = 0.18 + colorHighlight * 1.8;
    col += clamp(splitChroma * 4.5 * colorContrast, vec3(-0.14), vec3(0.14));
    // Add the brand hue on the leading fringe, without coloring neutral fog.
    float primaryFringe = max(0.0, cr.g - broadScene.g)
      + max(0.0, cr.g - cb.g) * 0.35;
    col += primaryChroma * primaryFringe * u_color_intensity * 1.4 * colorContrast;
    wakeRim = clamp((cb.g - cr.g) * 14.0, 0.0, 1.0) * motionEnergy;
  }
  float foldLight = smoothstep(0.035, 0.16, centerScene.g);
  float wakeLight = trailEff * motionEnergy * (wakeRim * 0.85 + foldLight * 0.12);
  col += wakeLight * u_mouse_glow_intensity * vec3(0.8);
  col += wakeLight * u_color_intensity * 0.055 * u_mouse_glow_intensity
    * primaryHue * (0.2 + colorHighlight * 1.6);
  col = mix(col, u_base_color * 0.68, highlightMask * 0.18);
  float pressureLight = pressure.z * (0.05 + fogStructure * 0.09) * u_highlight_halo;
  float warmth = clamp(u_color_intensity * 0.24, 0.0, 0.85)
    * (0.08 + colorHighlight * 0.9);
  col += pressureLight * mix(vec3(1.0), primaryLight, warmth);
  col += pressureLight * primaryLight * colorHighlight * 0.16;
  // Moving glints light existing fog folds rather than tracing a solid outline.
  col += hoverAccent * (0.015 + hoverShimmer * fogStructure * 0.045)
    * mix(vec3(1.0), primaryLight, warmth * 0.6);
  col += primaryChroma * hoverAccent * (0.04 + fogStructure * 0.11)
    * clamp(u_color_intensity / 2.5, 0.0, 2.0);
  col += halo * vec3(0.01) * fogStructure * smoothstep(0.45, 0.7, noiseB);

  col = clamp(col, 0.0, 1.0);

  if (u_dither_strength > 0.0 && u_dither_levels > 1.0) {
    float bayer = bayer4(gl_FragCoord.xy * u_dither_coarseness);
    vec3 quantized = floor(col * u_dither_levels + bayer) / u_dither_levels;
    float ditherStrength = max(
      0.0,
      u_dither_strength * (1.0 - highlightMask * u_highlight_dither_repel)
    );
    col = mix(col, quantized, ditherStrength);
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

const TRAIL_FRAGMENT_SHADER_SOURCE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D u_prev_trail;
uniform vec2 u_mouse;
uniform vec2 u_previous_mouse;
uniform vec2 u_resolution;
uniform float u_decay;
uniform float u_step;
uniform float u_splat;
uniform float u_splat_amount;
uniform float u_radius;
uniform vec2 u_velocity;

varying vec2 v_uv;

void main() {
  vec4 prev = texture2D(u_prev_trail, v_uv);
  vec2 momentum = (prev.gb - 0.5) * 2.0;
  vec2 advectedUv = clamp(v_uv - momentum * u_step * 0.002, 0.0, 1.0);
  prev = texture2D(u_prev_trail, advectedUv);
  float trail = max(0.0, prev.r * u_decay - (1.0 - u_decay) * 0.04);
  vec2 velocity = (prev.gb - 0.5) * 2.0 * u_decay;
  vec2 texel = 1.0 / u_resolution;
  float neighbors = (
    texture2D(u_prev_trail, advectedUv + vec2(texel.x, 0.0)).a
    + texture2D(u_prev_trail, advectedUv - vec2(texel.x, 0.0)).a
    + texture2D(u_prev_trail, advectedUv + vec2(0.0, texel.y)).a
    + texture2D(u_prev_trail, advectedUv - vec2(0.0, texel.y)).a
  ) * 0.25;
  float recovery = pow(u_decay, 0.45);
  float opening = max(0.0,
    mix(prev.a, neighbors, min(0.18 * u_step, 0.35)) * recovery
      - (1.0 - recovery) * 0.12);
  if (u_splat_amount > 0.0 && u_mouse.x >= 0.0 && u_mouse.x <= 1.0 && u_mouse.y >= 0.0 && u_mouse.y <= 1.0) {
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 segment = (u_mouse - u_previous_mouse) * aspect;
    vec2 delta = (v_uv - u_previous_mouse) * aspect;
    float along = clamp(dot(delta, segment) / max(dot(segment, segment), 0.000001), 0.0, 1.0);
    float d = length(delta - segment * along);
    float splat = exp(-d * d / max(u_radius * u_radius * 0.28, 0.0001));
    trail = min(1.0, trail + u_splat * u_splat_amount * u_step * splat);
    float narrowSplat = exp(-d * d / max(u_radius * u_radius * 0.008, 0.00001));
    opening = max(opening, narrowSplat * pow(u_splat_amount, 0.35) * 0.85);
    float velLen = length(u_velocity);
    if (velLen > 0.0001) {
      vec2 dir = u_velocity / velLen;
      velocity = mix(velocity, dir * u_splat_amount, splat * 0.32 * min(u_step, 1.0));
    }
  }
  gl_FragColor = vec4(trail, velocity * 0.5 + 0.5, opening);
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
const PRIMARY_COLOR = [0.18, 0.07, 0.055] as const;

const DEFAULT_PARAMS = {
  intensity: 0.3,
  colorIntensity: 2.5,
  mouseGlowIntensity: 0.1,
  mouseGlowRadius: 0.2,
  vignetteStrength: 1,
  vignetteRadius: 0.45,
  bandStrength: 0.055,
  noiseBandWarp: 0.12,
  noiseBandStrength: 0.07,
  noiseGlobalStrength: 0.04,
  ditherLevels: 3,
  ditherStrength: 0.35,
  ditherCoarseness: 0.5,
  depthStrength: 0.22,
  scrollParallax: 1,
  densityPreview: 0,
  rgbSplit: 0.125,
  opacity: 0.56,
  highlightEdgeBoost: 1.55,
  highlightDitherRepel: 1,
  highlightNoise: 1.15,
  highlightHalo: 1.08,
  highlightHaloSpread: 5.8,
} as const;

type ShaderParams = Record<keyof typeof DEFAULT_PARAMS, number>;

function getNoiseSeed(startTimeSeconds: number) {
  const interval = Math.floor(startTimeSeconds / 10);
  return (((Math.sin(interval * 78.233) * 43758.5453) % 1) + 1) % 1;
}

const BackgroundShader: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef<ShaderParams>({ ...DEFAULT_PARAMS });
  const [params, setParams] = useState<ShaderParams>({ ...DEFAULT_PARAMS });
  const [panelOpen, setPanelOpen] = useState(false);
  const highlightTargetRef = useRef<
    (ShaderHighlightPayload & { active: boolean }) | null
  >(null);
  const highlightControllerRef = useRef<ShaderHighlightController | null>(null);

  if (!highlightControllerRef.current) {
    highlightControllerRef.current = {
      activate(payload) {
        highlightTargetRef.current = { ...payload, active: true };
      },
      update(payload) {
        if (highlightTargetRef.current?.id !== payload.id) return;
        highlightTargetRef.current = {
          ...payload,
          active: highlightTargetRef.current.active,
        };
      },
      deactivate(id) {
        if (highlightTargetRef.current?.id !== id) return;
        highlightTargetRef.current = {
          ...highlightTargetRef.current,
          active: false,
        };
      },
    };
  }

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
      powerPreference: "high-performance",
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
    const uTrail = gl.getUniformLocation(program, "u_trail");
    const uSmokeTexture = gl.getUniformLocation(program, "u_smoke_texture");
    const uSmokeMix = gl.getUniformLocation(program, "u_smoke_mix");
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
    const uDitherCoarseness = gl.getUniformLocation(
      program,
      "u_dither_coarseness",
    );
    const uMouseGlowIntensity = gl.getUniformLocation(
      program,
      "u_mouse_glow_intensity",
    );
    const uColorIntensity = gl.getUniformLocation(program, "u_color_intensity");
    const uScroll = gl.getUniformLocation(program, "u_scroll");
    const uScrollParallax = gl.getUniformLocation(program, "u_scroll_parallax");
    const uSmokeTexel = gl.getUniformLocation(program, "u_smoke_texel");
    const uDensityPreview = gl.getUniformLocation(program, "u_density_preview");
    const uNoiseSeed = gl.getUniformLocation(program, "u_noise_seed");
    const uDepthStrength = gl.getUniformLocation(program, "u_depth_strength");
    const uRgbSplit = gl.getUniformLocation(program, "u_rgb_split");
    const uHighlightCount = gl.getUniformLocation(program, "u_highlight_count");
    const uHighlightCenters = gl.getUniformLocation(
      program,
      "u_highlight_centers",
    );
    const uHighlightSizes = gl.getUniformLocation(program, "u_highlight_sizes");
    const uHighlightRadii = gl.getUniformLocation(program, "u_highlight_radii");
    const uHighlightStrength = gl.getUniformLocation(
      program,
      "u_highlight_strength",
    );
    const uHighlightAge = gl.getUniformLocation(program, "u_highlight_age");
    const uHighlightEdgeBoost = gl.getUniformLocation(
      program,
      "u_highlight_edge_boost",
    );
    const uHighlightDitherRepel = gl.getUniformLocation(
      program,
      "u_highlight_dither_repel",
    );
    const uHighlightNoise = gl.getUniformLocation(program, "u_highlight_noise");
    const uHighlightHalo = gl.getUniformLocation(program, "u_highlight_halo");
    const uHighlightHaloSpread = gl.getUniformLocation(
      program,
      "u_highlight_halo_spread",
    );

    const uContentCount = gl.getUniformLocation(program, "u_content_count");
    const uContentRects = gl.getUniformLocation(program, "u_content_rects");
    const densityProgram = createProgram(
      gl,
      VERTEX_SHADER_SOURCE,
      SMOKE_DENSITY_FRAGMENT_SOURCE,
    );
    if (!densityProgram) {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      return;
    }
    const densityPositionLoc = gl.getAttribLocation(
      densityProgram,
      "a_position",
    );
    const uDensitySeed = gl.getUniformLocation(densityProgram, "u_seed");
    const uDensityLayer = gl.getUniformLocation(densityProgram, "u_layer");
    const uDensityTime = gl.getUniformLocation(densityProgram, "u_time");
    const densitySize = window.innerWidth < 640 ? 128 : 256;
    const densityRows = SMOKE_TIME_FRAMES / 2;
    const densityTileCount = densityRows * SMOKE_LAYER_COUNT;
    let generatedLayers = 0;
    const densityTargets: {
      texture: WebGLTexture;
      framebuffer: WebGLFramebuffer;
    }[] = [];
    for (let i = 0; i < 1; i += 1) {
      const texture = gl.createTexture();
      const framebuffer = gl.createFramebuffer();
      if (texture && framebuffer) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          densitySize * SMOKE_LAYER_COUNT,
          densitySize * densityRows,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
        if (
          gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
        ) {
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          densityTargets.push({ texture, framebuffer });
          continue;
        }
      }
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
      break;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (densityTargets.length !== 1) {
      gl.deleteProgram(program);
      gl.deleteProgram(densityProgram);
      gl.deleteBuffer(buffer);
      for (const target of densityTargets) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      return;
    }

    const trailProgram = createProgram(
      gl,
      VERTEX_SHADER_SOURCE,
      TRAIL_FRAGMENT_SHADER_SOURCE,
    );
    if (!trailProgram) {
      gl.deleteProgram(program);
      gl.deleteProgram(densityProgram);
      gl.deleteBuffer(buffer);
      for (const target of densityTargets) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      return;
    }
    const trailPositionLoc = gl.getAttribLocation(trailProgram, "a_position");
    const uPrevTrail = gl.getUniformLocation(trailProgram, "u_prev_trail");
    const uTrailMouse = gl.getUniformLocation(trailProgram, "u_mouse");
    const uTrailPreviousMouse = gl.getUniformLocation(
      trailProgram,
      "u_previous_mouse",
    );
    const uTrailResolution = gl.getUniformLocation(
      trailProgram,
      "u_resolution",
    );
    const uTrailDecay = gl.getUniformLocation(trailProgram, "u_decay");
    const uTrailStep = gl.getUniformLocation(trailProgram, "u_step");
    const uTrailSplat = gl.getUniformLocation(trailProgram, "u_splat");
    const uTrailSplatAmount = gl.getUniformLocation(
      trailProgram,
      "u_splat_amount",
    );
    const uTrailRadius = gl.getUniformLocation(trailProgram, "u_radius");
    const uTrailVelocity = gl.getUniformLocation(trailProgram, "u_velocity");

    let trailTexA: WebGLTexture | null = null;
    let trailTexB: WebGLTexture | null = null;
    let trailFboA: WebGLFramebuffer | null = null;
    let trailFboB: WebGLFramebuffer | null = null;
    let trailWidth = 0;
    let trailHeight = 0;
    let trailWriteIdx = 0;
    let canvasWidth = 0;
    let canvasHeight = 0;
    const TRAIL_DECAY = 0.975;
    const TRAIL_SPLAT = 0.22;

    function createTrailTexture(): WebGLTexture | null {
      if (!gl) return null;
      const tex = gl.createTexture();
      if (!tex) return null;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    }
    function resizeTrailTargets(w: number, h: number) {
      if (!gl) return;
      w = Math.max(1, w);
      h = Math.max(1, h);
      if (trailWidth === w && trailHeight === h) return;
      const previousA = trailTexA;
      const previousB = trailTexB;
      const previousRead = trailWriteIdx === 0 ? previousB : previousA;
      const nextA = createTrailTexture();
      const nextB = createTrailTexture();
      if (!nextA || !nextB) {
        gl.deleteTexture(nextA);
        gl.deleteTexture(nextB);
        return;
      }
      trailWidth = w;
      trailHeight = h;
      trailTexA = nextA;
      trailTexB = nextB;
      if (!trailFboA) trailFboA = gl.createFramebuffer();
      if (!trailFboB) trailFboB = gl.createFramebuffer();
      if (!trailTexA || !trailTexB || !trailFboA || !trailFboB) return;
      const texA = trailTexA;
      const texB = trailTexB;
      gl.bindTexture(gl.TEXTURE_2D, texA);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        w,
        h,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.bindTexture(gl.TEXTURE_2D, texB);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        w,
        h,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, trailFboA);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texA,
        0,
      );
      gl.clearColor(0, 0.5, 0.5, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, trailFboB);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texB,
        0,
      );
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (previousRead) {
        // Preserve the wake across viewport changes.
        // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API, not a React hook
        gl.useProgram(trailProgram);
        gl.viewport(0, 0, w, h);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, previousRead);
        gl.uniform1i(uPrevTrail, 0);
        gl.uniform1f(uTrailStep, 0);
        gl.uniform1f(uTrailDecay, 1);
        gl.uniform1f(uTrailSplatAmount, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(trailPositionLoc);
        gl.vertexAttribPointer(trailPositionLoc, 2, gl.FLOAT, false, 0, 0);
        for (const framebuffer of [trailFboA, trailFboB]) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }
      gl.deleteTexture(previousA);
      gl.deleteTexture(previousB);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    const mouse = { x: -1, y: -1 };
    let smoothedMouseX = -1;
    let smoothedMouseY = -1;
    let prevSmoothedMouseX = -1;
    let prevSmoothedMouseY = -1;
    let smokeMix = 0;
    let pointerEnergy = 0;
    let wakeDiagnosticFrame = 0;
    const MOUSE_SMOOTHING = 1;
    const SPLAT_MOVE_SCALE = 40;
    let scrollTarget = window.scrollY;
    let scrollPosition = scrollTarget;
    let contentBoundsDirty = true;
    const contentElements = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>(
        "main h1, main h2, main article, main footer",
      ) ?? [],
    );
    const contentRects = new Float32Array(MAX_CONTENT_RECTS * 4);
    let contentCount = 0;
    let activeHighlightId: string | null = null;
    let highlightStrength = 0.0;
    let highlightAge = 10;
    let highlightWasActive = false;
    let highlightHaloSpread = DEFAULT_PARAMS.highlightHaloSpread;
    const highlightCenters = new Float32Array(MAX_HIGHLIGHT_RECTS * 2);
    const highlightSizes = new Float32Array(MAX_HIGHLIGHT_RECTS * 2);
    const highlightRadii = new Float32Array(MAX_HIGHLIGHT_RECTS);

    const onMouseMove = (e: MouseEvent) => {
      const nextX = e.clientX / window.innerWidth;
      const nextY = 1 - e.clientY / window.innerHeight;
      if (Math.hypot(nextX - mouse.x, nextY - mouse.y) > 0.35) {
        smoothedMouseX = nextX;
        smoothedMouseY = nextY;
        prevSmoothedMouseX = nextX;
        prevSmoothedMouseY = nextY;
      }
      mouse.x = nextX;
      mouse.y = nextY;
    };
    const onMouseLeave = () => {
      mouse.x = -1;
      mouse.y = -1;
      smoothedMouseX = -1;
      smoothedMouseY = -1;
      prevSmoothedMouseX = -1;
      prevSmoothedMouseY = -1;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    const onScroll = () => {
      scrollTarget = window.scrollY;
      contentBoundsDirty = true;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let timeSeconds = 0;
    let rafId = 0;
    let lastTime = performance.now() * 0.001;
    const noiseSeed = getNoiseSeed(Date.now() * 0.001);

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      canvasWidth = w;
      canvasHeight = h;
      const trailScale = Math.min(1, 480 / Math.max(w, h));
      resizeTrailTargets(
        Math.round(w * trailScale),
        Math.round(h * trailScale),
      );
      contentBoundsDirty = true;
    };

    const draw = () => {
      const now = performance.now() * 0.001;
      const reduce = reducedMotionQuery.matches;
      const hidden = document.hidden;

      const dt = Math.min(now - lastTime, 0.1);
      if (!reduce && !hidden) {
        timeSeconds += dt;
      }
      lastTime = now;

      scrollPosition +=
        (scrollTarget - scrollPosition) * (1 - Math.exp(-dt * 16));
      if (contentBoundsDirty) {
        contentCount = 0;
        for (const element of contentElements) {
          const rect = element.getBoundingClientRect();
          if (rect.bottom < -100 || rect.top > window.innerHeight + 100)
            continue;
          if (contentCount === MAX_CONTENT_RECTS) break;
          const index = contentCount * 4;
          contentRects[index] =
            (rect.left + rect.width * 0.5) / window.innerWidth;
          contentRects[index + 1] =
            1 - (rect.top + rect.height * 0.5) / window.innerHeight;
          contentRects[index + 2] = (rect.width * 0.5) / window.innerWidth;
          contentRects[index + 3] = (rect.height * 0.5) / window.innerHeight;
          contentCount += 1;
        }
        contentBoundsDirty = false;
      }

      if (generatedLayers < densityTileCount) {
        const layer = generatedLayers % SMOKE_LAYER_COUNT;
        const row = Math.floor(generatedLayers / SMOKE_LAYER_COUNT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, densityTargets[0].framebuffer);
        gl.viewport(
          layer * densitySize,
          row * densitySize,
          densitySize,
          densitySize,
        );
        // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API, not a React hook
        gl.useProgram(densityProgram);
        gl.uniform1f(uDensitySeed, noiseSeed);
        gl.uniform1f(uDensityLayer, layer);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(densityPositionLoc);
        gl.vertexAttribPointer(densityPositionLoc, 2, gl.FLOAT, false, 0, 0);
        for (let moment = 0; moment < 2; moment += 1) {
          gl.colorMask(moment === 0, moment === 0, moment === 1, moment === 1);
          gl.uniform1f(
            uDensityTime,
            ((row * 2 + moment) * SMOKE_TIME_PERIOD) / SMOKE_TIME_FRAMES,
          );
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        gl.colorMask(true, true, true, true);
        generatedLayers += 1;
        if (process.env.NODE_ENV === "development" && row === 0) {
          const pixels = new Uint8Array(32 * 32 * 4);
          gl.readPixels(
            layer * densitySize + Math.floor(densitySize * 0.5),
            Math.floor(densitySize * 0.5),
            32,
            32,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixels,
          );
          let min = 255;
          let max = 0;
          let temporalDifference = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            min = Math.min(min, pixels[i]);
            max = Math.max(max, pixels[i]);
            temporalDifference += Math.abs(pixels[i] - pixels[i + 2]);
          }
          canvas.dataset[`densityLayer${generatedLayers}`] = `${min},${max}`;
          canvas.dataset[`densityAdvance${generatedLayers}`] = (
            temporalDifference /
            (pixels.length / 4)
          ).toFixed(2);
        }
      }

      if (mouse.x >= 0) {
        if (smoothedMouseX < 0) {
          smoothedMouseX = mouse.x;
          smoothedMouseY = mouse.y;
          prevSmoothedMouseX = mouse.x;
          prevSmoothedMouseY = mouse.y;
        } else {
          const mouseFollow = 1 - (1 - MOUSE_SMOOTHING) ** (dt * 60);
          smoothedMouseX += (mouse.x - smoothedMouseX) * mouseFollow;
          smoothedMouseY += (mouse.y - smoothedMouseY) * mouseFollow;
        }
      }

      let splatAmount = 0;
      let velX = 0;
      let velY = 0;
      if (
        smoothedMouseX >= 0 &&
        smoothedMouseY >= 0 &&
        prevSmoothedMouseX >= 0 &&
        prevSmoothedMouseY >= 0
      ) {
        const dx = smoothedMouseX - prevSmoothedMouseX;
        const dy = smoothedMouseY - prevSmoothedMouseY;
        const moved = Math.hypot((dx * canvasWidth) / canvasHeight, dy);
        const movementEnergy = Math.min(
          1,
          (moved * SPLAT_MOVE_SCALE) / Math.max(dt * 60, 0.25),
        );
        // Lift small movements without adding energy when the cursor is still.
        splatAmount = reduce ? 0 : movementEnergy ** 0.6;
        velX = dx;
        velY = dy;
      }
      smokeMix +=
        ((generatedLayers === densityTileCount ? 1 : 0) - smokeMix) *
        (1 - Math.exp(-dt * 1.5));
      pointerEnergy +=
        (splatAmount - pointerEnergy) *
        (1 - Math.exp(-dt * (splatAmount > pointerEnergy ? 18 : 6)));

      const highlightTarget = highlightTargetRef.current;
      highlightAge += dt;
      if (highlightTarget) {
        if (
          highlightTarget.active &&
          (!highlightWasActive || highlightTarget.id !== activeHighlightId)
        ) {
          highlightAge = 0;
        }
        if (highlightTarget.id !== activeHighlightId) {
          activeHighlightId = highlightTarget.id;
          for (let i = 0; i < MAX_HIGHLIGHT_RECTS; i += 1) {
            const centerIndex = i * 2;
            const rect = highlightTarget.rects[i];

            if (rect) {
              highlightCenters[centerIndex] = rect.centerX;
              highlightCenters[centerIndex + 1] = rect.centerY;
            }

            highlightSizes[centerIndex] = rect?.halfWidth ?? 0.0001;
            highlightSizes[centerIndex + 1] = rect?.halfHeight ?? 0.0001;
            highlightRadii[i] = rect?.radius ?? 0;
          }

          highlightStrength = 0;
        }

        const highlightFollow = reduce ? 0.14 : 0.03;
        const haloSpreadTarget =
          highlightTarget.haloSpread ?? paramsRef.current.highlightHaloSpread;
        highlightHaloSpread +=
          (haloSpreadTarget - highlightHaloSpread) * (reduce ? 0.18 : 0.08);
        const snapHighlight = Boolean(highlightTarget.snap);
        for (let i = 0; i < MAX_HIGHLIGHT_RECTS; i += 1) {
          const rect = highlightTarget.rects[i];
          const centerIndex = i * 2;

          if (rect) {
            if (snapHighlight) {
              highlightCenters[centerIndex] = rect.centerX;
              highlightCenters[centerIndex + 1] = rect.centerY;
              highlightSizes[centerIndex] = rect.halfWidth;
              highlightSizes[centerIndex + 1] = rect.halfHeight;
              highlightRadii[i] = rect.radius;
            } else {
              highlightCenters[centerIndex] +=
                (rect.centerX - highlightCenters[centerIndex]) *
                highlightFollow;
              highlightCenters[centerIndex + 1] +=
                (rect.centerY - highlightCenters[centerIndex + 1]) *
                highlightFollow;
              highlightSizes[centerIndex] +=
                (rect.halfWidth - highlightSizes[centerIndex]) *
                highlightFollow;
              highlightSizes[centerIndex + 1] +=
                (rect.halfHeight - highlightSizes[centerIndex + 1]) *
                highlightFollow;
              highlightRadii[i] +=
                (rect.radius - highlightRadii[i]) * highlightFollow;
            }
          } else {
            if (snapHighlight) {
              highlightSizes[centerIndex] = 0.0001;
              highlightSizes[centerIndex + 1] = 0.0001;
              highlightRadii[i] = 0;
            } else {
              highlightSizes[centerIndex] +=
                (0.0001 - highlightSizes[centerIndex]) * highlightFollow;
              highlightSizes[centerIndex + 1] +=
                (0.0001 - highlightSizes[centerIndex + 1]) * highlightFollow;
              highlightRadii[i] += (0 - highlightRadii[i]) * highlightFollow;
            }
          }
        }

        if (snapHighlight) {
          highlightTargetRef.current = { ...highlightTarget, snap: false };
        }

        const strengthTarget = highlightTarget.active ? 1 : 0;
        const strengthFollow = reduce
          ? 1
          : 1 - Math.exp(-dt * (highlightTarget.active ? 14 : 3.5));
        highlightStrength +=
          (strengthTarget - highlightStrength) * strengthFollow;

        if (!highlightTarget.active && highlightStrength < 0.001) {
          highlightTargetRef.current = null;
        }
      } else {
        activeHighlightId = null;
        highlightStrength += (0 - highlightStrength) * 0.018;
        highlightHaloSpread +=
          (paramsRef.current.highlightHaloSpread - highlightHaloSpread) * 0.05;
        for (let i = 0; i < MAX_HIGHLIGHT_RECTS * 2; i += 1) {
          highlightSizes[i] += (0.0001 - highlightSizes[i]) * 0.018;
        }
        for (let i = 0; i < MAX_HIGHLIGHT_RECTS; i += 1) {
          highlightRadii[i] += (0 - highlightRadii[i]) * 0.018;
        }
      }

      const p = paramsRef.current;
      const readIdx = 1 - trailWriteIdx;
      const writeFbo = trailWriteIdx === 0 ? trailFboA : trailFboB;
      const readTex = readIdx === 0 ? trailTexA : trailTexB;
      const writeTex = trailWriteIdx === 0 ? trailTexA : trailTexB;

      gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
      gl.viewport(0, 0, trailWidth, trailHeight);
      // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API, not a React hook
      gl.useProgram(trailProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.uniform1i(uPrevTrail, 0);
      gl.uniform2f(uTrailMouse, smoothedMouseX, smoothedMouseY);
      gl.uniform2f(uTrailPreviousMouse, prevSmoothedMouseX, prevSmoothedMouseY);
      gl.uniform2f(uTrailResolution, trailWidth, trailHeight);
      gl.uniform1f(uTrailDecay, TRAIL_DECAY ** (dt * 60));
      gl.uniform1f(uTrailStep, Math.min(dt * 60, 2));
      gl.uniform1f(uTrailSplat, TRAIL_SPLAT);
      gl.uniform1f(uTrailSplatAmount, splatAmount);
      gl.uniform1f(
        uTrailRadius,
        p.mouseGlowRadius * (0.8 + pointerEnergy * 0.65),
      );
      gl.uniform2f(uTrailVelocity, velX, velY);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(trailPositionLoc);
      gl.vertexAttribPointer(trailPositionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (
        process.env.NODE_ENV === "development" &&
        smoothedMouseX >= 0 &&
        wakeDiagnosticFrame++ % 30 === 0
      ) {
        const wakePixel = new Uint8Array(4);
        gl.readPixels(
          Math.min(
            trailWidth - 1,
            Math.max(0, Math.floor(smoothedMouseX * trailWidth)),
          ),
          Math.min(
            trailHeight - 1,
            Math.max(0, Math.floor(smoothedMouseY * trailHeight)),
          ),
          1,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          wakePixel,
        );
        canvas.dataset.wake = (wakePixel[0] / 255).toFixed(4);
        canvas.dataset.opening = (wakePixel[3] / 255).toFixed(4);
      }
      prevSmoothedMouseX = smoothedMouseX;
      prevSmoothedMouseY = smoothedMouseY;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvasWidth, canvasHeight);
      // biome-ignore lint/correctness/useHookAtTopLevel: WebGL API, not a React hook
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, writeTex);
      gl.uniform1i(uTrail, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, densityTargets[0].texture);
      gl.uniform1i(uSmokeTexture, 1);
      gl.uniform1f(uSmokeMix, smokeMix);
      gl.uniform1f(uTime, timeSeconds);
      gl.uniform1f(uScroll, scrollPosition / Math.max(canvas.clientHeight, 1));
      gl.uniform1f(uScrollParallax, reduce ? 0 : p.scrollParallax);
      gl.uniform1f(uSmokeTexel, 1 / densitySize);
      gl.uniform1f(uDensityPreview, p.densityPreview);
      gl.uniform1i(uContentCount, contentCount);
      gl.uniform4fv(uContentRects, contentRects);
      gl.uniform1f(uNoiseSeed, noiseSeed);
      gl.uniform1f(uDepthStrength, p.depthStrength);
      gl.uniform2f(uResolution, canvasWidth, canvasHeight);
      gl.uniform3f(uBaseColor, BASE_COLOR[0], BASE_COLOR[1], BASE_COLOR[2]);
      gl.uniform3f(
        uPrimaryColor,
        PRIMARY_COLOR[0],
        PRIMARY_COLOR[1],
        PRIMARY_COLOR[2],
      );
      gl.uniform1f(uIntensity, p.intensity);
      gl.uniform1f(uVignetteStrength, p.vignetteStrength);
      gl.uniform1f(uVignetteRadius, p.vignetteRadius);
      gl.uniform1f(uBandStrength, p.bandStrength);
      gl.uniform1f(uNoiseBandWarp, p.noiseBandWarp);
      gl.uniform1f(uNoiseBandStrength, p.noiseBandStrength);
      gl.uniform1f(uNoiseGlobalStrength, p.noiseGlobalStrength);
      gl.uniform1f(uDitherLevels, p.ditherLevels);
      gl.uniform1f(uDitherStrength, p.ditherStrength);
      gl.uniform1f(uDitherCoarseness, p.ditherCoarseness);
      gl.uniform1f(uRgbSplit, p.rgbSplit);
      gl.uniform1i(
        uHighlightCount,
        Math.min(
          highlightTargetRef.current?.rects.length ?? 0,
          MAX_HIGHLIGHT_RECTS,
        ),
      );
      gl.uniform2fv(uHighlightCenters, highlightCenters);
      gl.uniform2fv(uHighlightSizes, highlightSizes);
      gl.uniform1fv(uHighlightRadii, highlightRadii);
      gl.uniform1f(uHighlightStrength, highlightStrength);
      gl.uniform1f(uHighlightAge, reduce ? 10 : highlightAge);
      highlightWasActive = highlightTarget?.active ?? false;
      if (process.env.NODE_ENV === "development") {
        canvas.dataset.highlightStrength = highlightStrength.toFixed(3);
        canvas.dataset.highlightAge = highlightAge.toFixed(2);
      }
      gl.uniform1f(uHighlightEdgeBoost, p.highlightEdgeBoost);
      gl.uniform1f(uHighlightDitherRepel, p.highlightDitherRepel);
      gl.uniform1f(uHighlightNoise, p.highlightNoise);
      gl.uniform1f(uHighlightHalo, p.highlightHalo);
      gl.uniform1f(uHighlightHaloSpread, highlightHaloSpread);
      gl.uniform1f(uMouseGlowIntensity, p.mouseGlowIntensity);
      gl.uniform1f(uColorIntensity, p.colorIntensity);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      trailWriteIdx = readIdx;

      rafId = requestAnimationFrame(draw);
    };

    setSize();
    rafId = requestAnimationFrame(draw);

    const onResize = () => setSize();
    const resizeObserver = new ResizeObserver(() => setSize());
    resizeObserver.observe(canvas);
    if (rootRef.current) resizeObserver.observe(rootRef.current);
    for (const element of contentElements) resizeObserver.observe(element);
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
      gl.deleteProgram(program);
      gl.deleteProgram(trailProgram);
      gl.deleteProgram(densityProgram);
      gl.deleteBuffer(buffer);
      for (const target of densityTargets) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      if (trailTexA) gl.deleteTexture(trailTexA);
      if (trailTexB) gl.deleteTexture(trailTexB);
      if (trailFboA) gl.deleteFramebuffer(trailFboA);
      if (trailFboB) gl.deleteFramebuffer(trailFboB);
    };
  }, []);

  return (
    <ShaderHighlightProvider controller={highlightControllerRef.current}>
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
                    <span className="block text-xs text-white/70">
                      Intensity
                    </span>
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
                        updateParam(
                          "mouseGlowIntensity",
                          Number(e.target.value),
                        )
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
                        updateParam(
                          "noiseGlobalStrength",
                          Number(e.target.value),
                        )
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
                    <span className="block text-xs text-white/70">
                      Dither coarseness
                    </span>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={params.ditherCoarseness}
                      onChange={(e) =>
                        updateParam("ditherCoarseness", Number(e.target.value))
                      }
                      className="w-full accent-[#ff2f00]"
                    />
                    <span className="text-xs text-white/50">
                      {params.ditherCoarseness.toFixed(2)}
                    </span>
                  </label>
                  <label className="block">
                    <span className="block text-xs text-white/70">
                      Wake evolution
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={0.35}
                      step={0.01}
                      value={params.depthStrength}
                      onChange={(e) =>
                        updateParam("depthStrength", Number(e.target.value))
                      }
                      className="w-full accent-[#ff2f00]"
                    />
                    <span className="text-xs text-white/50">
                      {params.depthStrength.toFixed(3)}
                    </span>
                  </label>
                  <label className="block">
                    <span className="flex items-center gap-2 text-xs text-white/70">
                      <input
                        type="checkbox"
                        checked={params.densityPreview > 0}
                        onChange={(e) =>
                          updateParam(
                            "densityPreview",
                            e.target.checked ? 1 : 0,
                          )
                        }
                        className="accent-[#ff2f00]"
                      />
                      Density preview
                    </span>
                  </label>
                  <label className="block">
                    <span className="block text-xs text-white/70">
                      Scroll parallax
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.05}
                      value={params.scrollParallax}
                      onChange={(e) =>
                        updateParam("scrollParallax", Number(e.target.value))
                      }
                      className="w-full accent-[#ff2f00]"
                    />
                    <span className="text-xs text-white/50">
                      {params.scrollParallax.toFixed(2)}
                    </span>
                  </label>
                  <label className="block">
                    <span className="block text-xs text-white/70">
                      RGB split
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={0.2}
                      step={0.01}
                      value={params.rgbSplit}
                      onChange={(e) =>
                        updateParam("rgbSplit", Number(e.target.value))
                      }
                      className="w-full accent-[#ff2f00]"
                    />
                    <span className="text-xs text-white/50">
                      {params.rgbSplit.toFixed(3)}
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
                  <label className="block">
                    <span className="block text-xs text-white/70">
                      Highlight halo spread
                    </span>
                    <input
                      type="range"
                      min={3}
                      max={8}
                      step={0.1}
                      value={params.highlightHaloSpread}
                      onChange={(e) =>
                        updateParam(
                          "highlightHaloSpread",
                          Number(e.target.value),
                        )
                      }
                      className="w-full accent-[#ff2f00]"
                    />
                    <span className="text-xs text-white/50">
                      {params.highlightHaloSpread.toFixed(1)}
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
    </ShaderHighlightProvider>
  );
};

export default BackgroundShader;
