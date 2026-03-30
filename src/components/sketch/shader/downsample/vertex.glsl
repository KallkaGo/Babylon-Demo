precision highp float;

attribute vec2 position;

varying vec2 vUV[5];

uniform float uBlurRange;
uniform vec2 uSize;

void main() {
  vec2 uv = position * 0.5 + 0.5;
  vUV[0] = uv;
  vUV[1] = uv + vec2(-1.0, -1.0) * (1.0 + uBlurRange) * uSize * 0.5; // ↖
  vUV[2] = uv + vec2(-1.0, 1.0) * (1.0 + uBlurRange) * uSize * 0.5; // ↙
  vUV[3] = uv + vec2(1.0, -1.0) * (1.0 + uBlurRange) * uSize * 0.5; // ↗
  vUV[4] = uv + vec2(1.0, 1.0) * (1.0 + uBlurRange) * uSize * 0.5; // ↘
  gl_Position = vec4(position, 0.0, 1.0);
}