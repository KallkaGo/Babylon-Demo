precision highp float;

varying vec2 vUV;

uniform float uTickness;
uniform float uCameraNear;
uniform float uCameraFar;
uniform vec2 uResolution;
uniform float uOutLineDepthMul;
uniform float uOutLineDepthBias;
uniform float uOutLineNormalMul;
uniform float uOutLineNormalBias;

uniform sampler2D uDepthTexture;
uniform sampler2D uNormalTexture;

float LinearEyeDepth(float depth) {
  float x = 1. - uCameraFar / uCameraNear;
  float y = uCameraFar / uCameraNear;
  float z = x / uCameraFar;
  float w = y / uCameraFar;
  return 1.0 / (z * depth + w);
}

float Linear01Depth(float depth) {
  float x = 1. - uCameraFar / uCameraNear;
  float y = uCameraFar / uCameraNear;
  float z = x / uCameraFar;
  float w = y / uCameraFar;
  return 1.0 / (x * depth + y);
}

float SobelSampleDepth(sampler2D s, vec2 uv, vec3 offset) {
  float pixelCenter = Linear01Depth(texture2D(s, uv).r);
  float pixelLeft = Linear01Depth(texture2D(s, uv - offset.xz).r);
  float pixelRight = Linear01Depth(texture2D(s, uv + offset.xz).r);
  float pixelUp = Linear01Depth(texture2D(s, uv + offset.zy).r);
  float pixelDown = Linear01Depth(texture2D(s, uv - offset.zy).r);

  return abs(pixelLeft - pixelCenter) +
    abs(pixelRight - pixelCenter) +
    abs(pixelUp - pixelCenter) +
    abs(pixelDown - pixelCenter);
}

vec4 SobelSample(sampler2D t, vec2 uv, vec3 offset) {
  vec4 pixelCenter = texture2D(t, uv);
  vec4 pixelLeft = texture2D(t, uv - offset.xz);
  vec4 pixelRight = texture2D(t, uv + offset.xz);
  vec4 pixelUp = texture2D(t, uv + offset.zy);
  vec4 pixelDown = texture2D(t, uv - offset.zy);

  return abs(pixelLeft - pixelCenter) +
    abs(pixelRight - pixelCenter) +
    abs(pixelUp - pixelCenter) +
    abs(pixelDown - pixelCenter);
}

void main() {

  vec3 texel = vec3(1. / uResolution.x, 1. / uResolution.y, 0.0);

  float sobelDepth = SobelSampleDepth(uDepthTexture, vUV, texel) * uTickness;

  sobelDepth = pow(abs(clamp(sobelDepth * uOutLineDepthMul, 0.0, 1.0)), uOutLineDepthBias);

  sobelDepth = smoothstep(.0, .02, sobelDepth);

  vec3 sobelNormalVec = abs(SobelSample(uNormalTexture, vUV, texel).rgb);

  float sobelNormal = sobelNormalVec.r + sobelNormalVec.g + sobelNormalVec.b;

  sobelNormal = pow(abs(sobelNormal * uOutLineNormalMul), uOutLineNormalBias);

  float sobelOutline = clamp(max(sobelDepth, sobelNormal), 0., 1.);

  gl_FragColor = vec4(vec3(sobelOutline), 1.);

}