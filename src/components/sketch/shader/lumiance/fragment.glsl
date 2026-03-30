precision highp float;

uniform float uThreshold;
uniform float uSmoothing;
uniform sampler2D textureSampler;

varying vec2 vUV;

float luminance(const in vec3 rgb) {

	// assumes rgb is in linear color space with sRGB primaries and D65 white point

  const vec3 weights = vec3(0.2126729, 0.7151522, 0.0721750);

  return dot(weights, rgb);

}

void main() {
  vec4 texel = texture2D(textureSampler, vUV);
  float lum = luminance(texel.rgb);
  float mask = 1.0;
  mask = smoothstep(uThreshold, uThreshold + uSmoothing, lum);
  gl_FragColor = vec4(texel.rgb * mask, texel.a);
}