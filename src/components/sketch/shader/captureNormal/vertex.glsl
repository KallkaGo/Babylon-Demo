// Attributes
attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

// Uniforms
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;

varying vec3 vNormal;
varying vec3 vecPosition;

uniform mat4 offsetMatrixInv;
uniform vec3 offsetCenter;

void main() {
  vNormal = normalize((offsetMatrixInv * vec4(normal, 0.)).xyz);
  vec3 transformed = position;
  transformed -= offsetCenter;
  vec4 offsetPos = offsetMatrixInv * vec4(transformed, 1.);
  vecPosition = (world * offsetPos).xyz;
  gl_Position = projection * view * world * offsetPos;
}