precision highp float;
precision highp int;
precision mediump sampler2D;

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform float uToneMappingExposure;
uniform float uToneMappingSaturation;
uniform float uToneMappingContrast;

vec3 RRTAndODTFit(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}
vec3 ACESFilmicToneMapping(vec3 color) {
  const mat3 ACESInputMat = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 ACESOutputMat = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color *= uToneMappingExposure / 0.6;
  color = ACESInputMat * color;
  color = RRTAndODTFit(color);
  color = ACESOutputMat * color;
  return clamp(color, 0.0, 1.0);
}

vec3 TonemappingSaturation(vec3 rgb) {
  const vec3 W = vec3(0.2125, 0.7154, 0.0721);
  vec3 intensity = vec3(dot(rgb, W));
  return mix(intensity, rgb, uToneMappingSaturation);
}
vec3 TonemappingContrast(vec3 color) {
  return (color - vec3(0.5)) * uToneMappingContrast + vec3(0.5);
}

vec4 sRGBTransferOETF(in vec4 value) {
  return vec4(mix(pow(value.rgb, vec3(0.41666)) * 1.055 - vec3(0.055), value.rgb * 12.92, vec3(lessThanEqual(value.rgb, vec3(0.0031308)))), value.a);
}

vec4 linearToOutputTexel(vec4 value) {
  return (sRGBTransferOETF(value));
}

void main() {
  vec2 uv = vUV;
  vec4 color = texture2D(textureSampler, uv);
  color.rgb = TonemappingContrast(color.rgb);
  color.rgb = TonemappingSaturation(color.rgb);
  color.rgb = ACESFilmicToneMapping(color.rgb);
  gl_FragColor = linearToOutputTexel(color);
}