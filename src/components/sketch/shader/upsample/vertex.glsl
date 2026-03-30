precision highp float;

attribute vec2 position;

varying vec2 vUv[8];
varying vec2 vOriUV;
uniform float uBlurRange;
uniform vec2 uSize;

void main() {

  vec2 uv = position * 0.5 + 0.5;
  vUv[0] = uv + vec2(-1., -1.) * (1. + uBlurRange) * uSize.xy;
  vUv[1] = uv + vec2(-1., 1.) * (1. + uBlurRange) * uSize.xy;
  vUv[2] = uv + vec2(1., -1.) * (1. + uBlurRange) * uSize.xy;
  vUv[3] = uv + vec2(1., 1.) * (1. + uBlurRange) * uSize.xy;
  vUv[4] = uv + vec2(-2., 0.) * (1. + uBlurRange) * uSize.xy;
  vUv[5] = uv + vec2(0., -2.) * (1. + uBlurRange) * uSize.xy;
  vUv[6] = uv + vec2(2., 0.) * (1. + uBlurRange) * uSize.xy;
  vUv[7] = uv + vec2(0., 2.) * (1. + uBlurRange) * uSize.xy;
  vOriUV = uv;
  gl_Position = vec4(position, 0., 1.0);
}