precision highp float;

varying vec2 vUV;

uniform sampler2D uSceneTexture;
uniform sampler2D uMaskTexture;
uniform sampler2D uEdgeTexture;
/* from last pass */
uniform sampler2D textureSampler;

uniform vec3 uLineColor;
uniform float uOpacity;
uniform float uEdgeStrength;

uniform bool uX_Ray;
uniform bool uEnable;
uniform int uMode;

// #ifdef ALPHA

// vec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {

//   return mix(x, y, min(y.a, opacity));

// }

// #elif SCREEN

// vec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {

//   return mix(x, x + y - min(x * y, 1.0), opacity);

// }

// #else

// vec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {

//   return mix(x, y, opacity);

// }

// #endif

vec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {
  vec4 result;

  if(uMode == 1) {  
        // Alpha blend mode  
    result = mix(x, y, min(y.a, opacity));
  } else if(uMode == 2) {  
        // Screen blend mode  
    result = mix(x, x + y - min(x * y, 1.0), opacity);
  } else {  
        // Normal blend mode (default)  
    result = mix(x, y, opacity);
  }

  return result;
}

void main() {

  vec4 baseColor = texture2D(uSceneTexture, vUV);

  vec2 edge = texture2D(textureSampler, vUV).rg;
  vec2 mask = texture2D(uMaskTexture, vUV).rg;

  // #ifndef X_RAY

  // edge.y = 0.;

  // #endif

  edge.y *= uX_Ray ? 1.0 : 0.0;

  edge *= (uEdgeStrength * mask.x);

  vec3 color = edge.x * uLineColor + edge.y * uLineColor;

  float visibilityFactor = 0.0;

  float alpha = max(max(edge.x, edge.y), visibilityFactor);

  vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);

  // #ifdef ALPHA

  // finalColor = vec4(color, alpha);

  // #else

  // finalColor = vec4(color, max(alpha, baseColor.a));

  // #endif

  bool flag = uMode == 1;

  finalColor = flag ? vec4(color, alpha) : vec4(color, max(alpha, baseColor.a));

  finalColor = blend(baseColor, finalColor, uOpacity);

  // #ifndef ENABLE

  // finalColor = baseColor;

  // #endif

  finalColor = uEnable ? finalColor : baseColor;

  gl_FragColor = finalColor;

  // gl_FragColor = vec4(edge, 0., 1.);

}
