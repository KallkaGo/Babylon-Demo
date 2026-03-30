precision highp float;
precision mediump sampler2D;

uniform float uIntensity;
uniform vec3 uGlowColor;
uniform float uBlendOpacity;
uniform float uInvDownsampleCount;

uniform sampler2D textureSampler;
uniform sampler2D baseSampler;

varying vec2 vUv[8];
varying vec2 vOriUV;

vec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {

  return mix(x, vec4(x.rgb + y.rgb - min(x.rgb * y.rgb, 1.0), y.a), opacity);

}

void main() {

  vec4 col = texture2D(textureSampler, vUv[0]) * 2.;
  col += texture2D(textureSampler, vUv[1]) * 2.;
  col += texture2D(textureSampler, vUv[2]) * 2.;
  col += texture2D(textureSampler, vUv[3]) * 2.;
  col += texture2D(textureSampler, vUv[4]);
  col += texture2D(textureSampler, vUv[5]);
  col += texture2D(textureSampler, vUv[6]);
  col += texture2D(textureSampler, vUv[7]);
  col *= 0.0833;

  col.rgb = col.rgb * uIntensity * uGlowColor * uInvDownsampleCount;

  vec4 baseColor = texture2D(baseSampler, vOriUV);

  vec4 finalColor = blend(baseColor, col, uBlendOpacity);

  gl_FragColor = vec4(finalColor.rgb, baseColor.a);
}