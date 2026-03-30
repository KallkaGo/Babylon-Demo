precision highp float;

// Attributes
attribute vec3 position;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;

varying vec2 vUv;

void main() {
  vec4 worldPosition = world * vec4(position, 1.0);
  vec4 viewPosition = view * worldPosition;
  vec4 clipPosition = projection * viewPosition;
  gl_Position = clipPosition;
  vUv = uv;
}