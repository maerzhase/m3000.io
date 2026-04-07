precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_base_color;
uniform vec3 u_primary_color;
uniform float u_intensity;
uniform sampler2D u_trail;
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
uniform float u_scroll_phase;
uniform float u_noise_seed;
uniform float u_displace_strength;
uniform float u_rgb_split;
uniform int u_highlight_count;
uniform vec2 u_highlight_centers[4];
uniform vec2 u_highlight_sizes[4];
uniform float u_highlight_radii[4];
uniform float u_highlight_strength;
uniform float u_highlight_edge_boost;
uniform float u_highlight_dither_repel;
uniform float u_highlight_noise;
uniform float u_highlight_halo;

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

vec3 baseScene(vec2 p) {
  float minRes = min(u_resolution.x, u_resolution.y);
  float rScale = clamp(520.0 / minRes, 1.0, 1.6);
  float t = u_time * 1.2 + u_scroll_phase;
  vec2 bandSeed = seedOffset(0.0);
  vec2 detailSeed = seedOffset(7.3);
  vec2 c1 = vec2(0.25, 0.5) + 0.04 * vec2(sin(t * 0.1), cos(t * 0.12));
  vec2 c2 = vec2(0.5, 0.45) + 0.03 * vec2(cos(t * 0.08), sin(t * 0.1));
  vec2 c3 = vec2(0.75, 0.5) + 0.04 * vec2(sin(t * 0.11 + 1.0), cos(t * 0.09));
  vec3 b1 = vec3(0.09);
  vec3 b2 = vec3(0.14);
  vec3 b3 = vec3(0.08);
  float r = 0.45 * rScale;
  float rCenter = 0.55 * rScale;
  vec3 col = u_base_color;
  col += u_intensity * (blob(p, c1, r) * b1 + blob(p, c2, rCenter) * b2 + blob(p, c3, r) * b3);
  float d = length(p - 0.5);
  float vig = 1.0 - smoothstep(u_vignette_radius * 0.5, u_vignette_radius, d);
  vig = mix(1.0 - u_vignette_strength, 1.0, vig);
  col *= vig;
  float bandX =
    p.x + u_noise_band_warp * valueNoise(p * 2.0 + bandSeed + vec2(t * 0.2));
  float band = sin(bandX * 6.28318 * 2.0 + t * 0.1) * 0.5 + 0.5;
  band +=
    (valueNoise(p * 4.0 + bandSeed * 1.35 + vec2(t * 0.15, -t * 0.08)) - 0.5)
    * u_noise_band_strength;
  col += u_band_strength * band;
  col +=
    (valueNoise(p * 8.0 + detailSeed + vec2(t * 0.1, -t * 0.06)) - 0.5)
    * u_noise_global_strength;
  return col;
}

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 uv = v_uv;
  float trail = texture2D(u_trail, uv).r;
  float highlightFeather = max(0.005, 12.0 / min(u_resolution.x, u_resolution.y));
  float highlightMask = 0.0;
  float highlightEdge = 0.0;
  vec2 highlightDelta = vec2(1.0, 0.0);
  float nearestRectDist = 1e5;

  for (int i = 0; i < 4; i++) {
    if (i >= u_highlight_count) break;
    vec2 rectDelta = uv - u_highlight_centers[i];
    vec2 rectSize = max(u_highlight_sizes[i], vec2(0.0001));
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
  vec2 noiseUv =
    uv * vec2(26.0, 18.0)
    + seedOffset(19.4)
    + vec2(u_time * 0.22, -u_time * 0.17);
  float noiseA = valueNoise(noiseUv);
  float noiseB = valueNoise(noiseUv * 1.9 + 17.3);
  float edgeNoise = mix(noiseA, noiseB, 0.45) - 0.5;
  float edgeRipple =
    sin((nearestRectDist * 1600.0) - u_time * 6.0 + noiseA * 8.0) * 0.5 + 0.5;
  float noisyEdge =
    highlightEdge * (1.0 + edgeNoise * 1.8 * u_highlight_noise)
    + highlightEdge * edgeRipple * 0.45 * u_highlight_noise;
  float halo =
    u_highlight_strength
    * (1.0 - smoothstep(highlightFeather * 1.6, highlightFeather * 8.0, abs(nearestRectDist)));
  halo *= 0.45 + 0.55 * noiseB;
  halo *= u_highlight_halo;
  highlightMask = clamp(highlightMask, 0.0, 1.0);
  highlightEdge = clamp(max(highlightEdge, noisyEdge), 0.0, 1.35);
  halo = clamp(halo, 0.0, 1.0);
  // Boost trail for displacement/split so faint trail still shows effect (trail is often 0.1–0.3)
  float trailEff = pow(max(0.0, trail), 0.65);

  // Displacement: large UV offset so it's visible even at mid trail strength
  vec2 displaceDir = vec2(1.2, 0.35);
  vec2 radialDir =
    length(highlightDelta) > 0.0001 ? normalize(highlightDelta) : vec2(1.0, 0.0);
  vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
  float displaceStrength = u_displace_strength * (1.0 + highlightEdge * 1.65 + halo * 0.6);
  vec2 uv_d = uv + trailEff * displaceStrength * displaceDir;
  uv_d += radialDir * highlightMask * u_highlight_edge_boost * 0.055;
  uv_d += tangentDir * edgeNoise * highlightEdge * 0.03 * u_highlight_noise;

  vec3 col;
  float rgbSplitStrength =
    u_rgb_split
    + highlightEdge * u_highlight_edge_boost * 0.075
    + halo * u_highlight_halo * 0.04;
  if (rgbSplitStrength > 0.0 && (trail > 0.005 || highlightEdge > 0.001)) {
    // RGB split along velocity direction (stored in trail.gb); fallback to horizontal if no velocity
    vec2 velDir = vec2(texture2D(u_trail, uv).g * 2.0 - 1.0, texture2D(u_trail, uv).b * 2.0 - 1.0);
    if (length(velDir) < 0.01) velDir = vec2(1.0, 0.0);
    else velDir = normalize(velDir);
    velDir = normalize(mix(velDir, tangentDir, min(1.0, highlightEdge * 1.4)));
    velDir = normalize(mix(velDir, radialDir, min(1.0, halo * 0.8)));
    float rs = max(trailEff, highlightEdge * 0.9 + halo * 0.75) * rgbSplitStrength * 4.8;
    vec3 cr = baseScene(uv_d - rs * velDir);
    vec3 cg = baseScene(uv_d);
    vec3 cb = baseScene(uv_d + rs * velDir);
    col = vec3(cr.r, cg.g, cb.b);
  } else {
    col = baseScene(uv_d);
  }
  col += trail * u_color_intensity * 1.5 * u_mouse_glow_intensity * u_primary_color;
  vec3 haloColor = vec3(0.9, 0.24, 0.08);
  col += halo * haloColor * (0.35 + highlightEdge * 0.25);
  col = mix(col, u_base_color * 0.72, highlightMask * 0.58);
  col += edgeNoise * 0.06 * highlightEdge * u_highlight_noise;

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
