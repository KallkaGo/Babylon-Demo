precision highp float;
precision mediump sampler2D;

uniform sampler2D textureSampler;
uniform sampler2D uCurDownSample;

varying vec2 vUv[8];
varying vec2 vOriUV;

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
  vec3 curDownSample = texture2D(uCurDownSample, vOriUV).rgb;
  gl_FragColor = vec4(col.rgb + curDownSample, 1.);
}