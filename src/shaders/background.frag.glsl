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
