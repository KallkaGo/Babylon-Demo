// Attributes
attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

// Uniforms
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;

varying mat4 vViewMat;
varying mat4 vProjectionMat;

void main() {
  vec4 worldPosition = world * vec4(position, 1.0);
  vec4 viewPosition = view * worldPosition;
  gl_Position = projection * viewPosition;
  vWorldNormal = (world * vec4(normal, 0.0)).xyz;
  vNormal = normal;
  vWorldPosition = worldPosition.xyz;
  vViewPosition = viewPosition.xyz;
  vUv = uv;
}