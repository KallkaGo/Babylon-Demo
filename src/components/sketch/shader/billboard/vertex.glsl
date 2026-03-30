precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;

varying vec2 vUV;

void main() {
  
  vec3 worldPos = vec3(world[3][0], world[3][1], world[3][2]);

  vec4 viewPosition = view * vec4(worldPos, 1.0);

  vec2 scale = vec2(
    length(vec3(world[0][0], world[0][1], world[0][2])), 
    length(vec3(world[1][0], world[1][1], world[1][2]))
    );

  vec2 vertex = position.xy * scale;

  vertex *= viewPosition.z;

  viewPosition.xy += vertex;

  vec4 clipPosition = projection * viewPosition;

  gl_Position = clipPosition;

  vUV = uv;

}