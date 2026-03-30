precision highp float;

varying vec2 vUV;

uniform sampler2D uMaskTexture;
uniform vec2 uResolution;

void main() {

  vec3 texel = vec3(1.0 / uResolution.x, 1.0 / uResolution.y, 0.);

  vec2 c0 = texture2D(uMaskTexture, vUV + texel.xz).rg;
  vec2 c1 = texture2D(uMaskTexture, vUV - texel.xz).rg;
  vec2 c2 = texture2D(uMaskTexture, vUV + texel.zy).rg;
  vec2 c3 = texture2D(uMaskTexture, vUV - texel.zy).rg;

  float d0 = (c0.x - c1.x) * 0.5;
  float d1 = (c2.x - c3.x) * 0.5;
  float d = length(vec2(d0, d1));

  float a0 = min(c0.y, c1.y);
  float a1 = min(c2.y, c3.y);
  float visibilityFactor = min(a0, a1);

  vec2 edge = (1.0 - visibilityFactor > 0.001) ? vec2(d, 0.0) : vec2(0.0, d);

  gl_FragColor = vec4(edge, 0., 1.);

}