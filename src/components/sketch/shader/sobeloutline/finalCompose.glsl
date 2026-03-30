precision highp float;

varying vec2 vUV;

uniform sampler2D uSceneTexture;
uniform sampler2D textureSampler;


void main() {
  vec4 baseColor = texture2D(uSceneTexture, vUV);

  vec4 outlineColor = vec4(0.0, 0.0, 0.0, 1.0);

  float sobelOutline = texture2D(textureSampler, vUV).r;

  sobelOutline = smoothstep(.1, .2, sobelOutline);

  vec4 finalColor = mix(baseColor, outlineColor, sobelOutline);

  gl_FragColor = finalColor;

  // gl_FragColor = vec4(vec3(sobelOutline), 1.);

}