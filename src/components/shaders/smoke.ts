export const SMOKE_LAYER_COUNT = 3;
export const SMOKE_TIME_FRAMES = 16;
export const SMOKE_TIME_PERIOD = 200;

// Each tile integrates a different slab of the same periodic 3D density field.
export const SMOKE_DENSITY_FRAGMENT_SOURCE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float u_seed;
uniform float u_layer;
uniform float u_time;
varying vec2 v_uv;

vec3 latticeGradient(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0;
}

float noise3(vec3 p, float period) {
  vec3 cell = floor(p);
  vec3 offset = fract(p);
  vec3 f = offset;
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec3 a = mod(cell, period);
  vec3 b = mod(cell + 1.0, period);
  return 0.5 + 0.85 * mix(
    mix(
      mix(
        dot(latticeGradient(a), offset),
        dot(latticeGradient(vec3(b.x, a.yz)), offset - vec3(1.0, 0.0, 0.0)),
        f.x
      ),
      mix(
        dot(latticeGradient(vec3(a.x, b.y, a.z)), offset - vec3(0.0, 1.0, 0.0)),
        dot(latticeGradient(vec3(b.xy, a.z)), offset - vec3(1.0, 1.0, 0.0)),
        f.x
      ),
      f.y
    ),
    mix(
      mix(
        dot(latticeGradient(vec3(a.xy, b.z)), offset - vec3(0.0, 0.0, 1.0)),
        dot(latticeGradient(vec3(b.x, a.y, b.z)), offset - vec3(1.0, 0.0, 1.0)),
        f.x
      ),
      mix(
        dot(latticeGradient(vec3(a.x, b.yz)), offset - vec3(0.0, 1.0, 1.0)),
        dot(latticeGradient(b), offset - vec3(1.0, 1.0, 1.0)),
        f.x
      ),
      f.y
    ),
    f.z
  );
}

float fractal(vec3 p, float period) {
  float result = 0.0;
  float amplitude = 0.54;
  for (int i = 0; i < 5; i++) {
    result += noise3(p, period) * amplitude;
    p = p * 2.0 + vec3(13.0, 7.0, 5.7);
    period *= 2.0;
    amplitude *= 0.46;
  }
  return result;
}

float cellular(vec3 p) {
  vec3 cell = floor(p);
  vec3 offset = fract(p);
  float nearest = 2.0;
  for (int z = -1; z <= 1; z++) {
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec3 neighbor = vec3(float(x), float(y), float(z));
        vec3 lattice = cell + neighbor;
        lattice = mod(lattice, 8.0);
        vec3 point = latticeGradient(lattice) * 0.5 + 0.5;
        vec3 delta = neighbor + point - offset;
        nearest = min(nearest, dot(delta, delta));
      }
    }
  }
  return 1.0 - clamp(sqrt(nearest), 0.0, 1.0);
}

float density(vec3 p) {
  vec3 warp = vec3(
    noise3(p * 0.5 + vec3(2.0, 3.0, 1.7), 4.0),
    noise3(p * 0.5 + vec3(7.0, 1.0, 9.2), 4.0),
    noise3(p * 0.5 + vec3(3.0, 6.0, 4.5), 4.0)
  );
  vec3 folded = p + (warp - 0.5) * 1.8;
  folded.xy += vec2(
    fractal(folded + vec3(1.0, 5.0, 2.3), 8.0),
    fractal(folded + vec3(6.0, 2.0, 7.1), 8.0)
  ) * 0.85;
  float coverage = noise3(p * 0.5 + vec3(4.0, 3.0, 0.0), 4.0);
  float billow = fractal(folded, 8.0) * 0.74 + cellular(folded) * 0.26;
  float erosion = fractal(folded * 8.0 + vec3(3.0, 7.0, 2.1), 64.0);
  float ridge = 1.0 - abs(noise3(folded * 2.0, 16.0) * 2.0 - 1.0);
  float shape = billow + (ridge - 0.6) * 0.13 - erosion * 0.11;
  float cloud = smoothstep(0.32, 0.65, shape);
  cloud *= smoothstep(0.18, 0.68, coverage);
  return max(0.0, cloud - erosion * 0.22 * (1.0 - cloud));
}

vec2 integrateSmoke(float time) {
  vec3 p = vec3(v_uv * 8.0, u_layer * 4.7 + u_seed * 19.0 + time * 0.04);
  p.xy += vec2(u_seed * 8.0, u_seed * 5.0);
  float transmittance = 1.0;
  float scattering = 0.0;
  for (int i = 0; i < 7; i++) {
    vec3 samplePosition = p + vec3(0.0, 0.0, float(i) * 0.09);
    float smoke = density(samplePosition);
    float shadow = density(samplePosition + vec3(-0.16, 0.2, -0.18));
    float light = 0.12 + 0.88 * exp(-shadow * 5.2);
    float absorption = 1.0 - exp(-smoke * 0.58);
    scattering += transmittance * absorption * light;
    transmittance *= 1.0 - absorption;
  }
  return vec2(scattering, 1.0 - transmittance);
}

void main() {
  vec2 smoke = integrateSmoke(u_time);
  // Separate masked passes pack the present in RG and the future in BA.
  gl_FragColor = vec4(smoke, smoke);
}
`;
