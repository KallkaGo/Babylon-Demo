precision highp float;

varying vec2 vUV;

uniform sampler2D uDiffuseTexture;
uniform float uOpacity;
uniform vec2 uCellSize;
uniform vec2 uOffset;

void main() {
  vec2 newUV = vUV * uCellSize + uOffset;
  vec4 diffuse = texture2D(uDiffuseTexture, newUV);
  gl_FragColor = vec4(diffuse.rgb, diffuse.a * uOpacity);
}