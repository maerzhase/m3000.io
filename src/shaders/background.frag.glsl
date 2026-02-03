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
uniform float u_displace_strength;
uniform float u_rgb_split;

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

vec3 baseScene(vec2 p) {
  float minRes = min(u_resolution.x, u_resolution.y);
  float rScale = clamp(520.0 / minRes, 1.0, 1.6);
  float t = u_time * 1.2 + u_scroll_phase;
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
  float bandX = p.x + u_noise_band_warp * valueNoise(p * 2.0 + t * 0.2);
  float band = sin(bandX * 6.28318 * 2.0 + t * 0.1) * 0.5 + 0.5;
  band += (valueNoise(p * 4.0 + t * 0.15) - 0.5) * u_noise_band_strength;
  col += u_band_strength * band;
  col += (valueNoise(p * 8.0 + t * 0.1) - 0.5) * u_noise_global_strength;
  return col;
}

void main() {
  vec2 uv = v_uv;
  float trail = texture2D(u_trail, uv).r;
  // Boost trail for displacement/split so faint trail still shows effect (trail is often 0.1–0.3)
  float trailEff = pow(max(0.0, trail), 0.65);

  // Displacement: large UV offset so it's visible even at mid trail strength
  vec2 displaceDir = vec2(1.2, 0.35);
  vec2 uv_d = uv + trailEff * u_displace_strength * displaceDir;

  vec3 col;
  if (u_rgb_split > 0.0 && trail > 0.005) {
    // RGB split along velocity direction (stored in trail.gb); fallback to horizontal if no velocity
    vec2 velDir = vec2(texture2D(u_trail, uv).g * 2.0 - 1.0, texture2D(u_trail, uv).b * 2.0 - 1.0);
    if (length(velDir) < 0.01) velDir = vec2(1.0, 0.0);
    else velDir = normalize(velDir);
    float rs = trailEff * u_rgb_split * 4.0;
    vec3 cr = baseScene(uv_d - rs * velDir);
    vec3 cg = baseScene(uv_d);
    vec3 cb = baseScene(uv_d + rs * velDir);
    col = vec3(cr.r, cg.g, cb.b);
  } else {
    col = baseScene(uv_d);
  }
  col += trail * u_color_intensity * 1.5 * u_mouse_glow_intensity * u_primary_color;

  col = clamp(col, 0.0, 1.0);

  if (u_dither_strength > 0.0 && u_dither_levels > 1.0) {
    float bayer = bayer4(gl_FragCoord.xy * u_dither_coarseness);
    vec3 quantized = floor(col * u_dither_levels + bayer) / u_dither_levels;
    col = mix(col, quantized, u_dither_strength);
  }

  gl_FragColor = vec4(col, 1.0);
}
