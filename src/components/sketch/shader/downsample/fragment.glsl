precision highp float;
precision mediump sampler2D;

uniform float uBlurRange;
uniform sampler2D textureSampler;
uniform sampler2D uDepthTexture;
uniform vec2 uResolution;
uniform bool uFirst;
uniform float uLuminanceThreshold;

varying vec2 vUV[5];

float luminance(vec3 color) {
  return 0.2125 * color.r + 0.7154 * color.g + 0.0721 * color.b;
}

vec3 applyThreshold(vec3 color, out float luma) {
  luma = luminance(color);
  return color * max(0., luma - uLuminanceThreshold);
}

float getLumaWeight(float luma) {
  return 1. / (1. + luma);
}

void main() {
  vec2 uv = vUV[0];
  vec2 uv1 = vUV[1];
  vec2 uv2 = vUV[2];
  vec2 uv3 = vUV[3];
  vec2 uv4 = vUV[4];

  // https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/ PPT page 164
  if(uFirst) {
    float lumac, lumatl, lumatr, lumabl, lumabr;
    vec3 c = applyThreshold(texture2D(textureSampler, uv).rgb, lumac);
    vec3 tl = applyThreshold(texture2D(textureSampler, uv1).rgb, lumatl);
    vec3 tr = applyThreshold(texture2D(textureSampler, uv2).rgb, lumatr);
    vec3 bl = applyThreshold(texture2D(textureSampler, uv3).rgb, lumabl);
    vec3 br = applyThreshold(texture2D(textureSampler, uv4).rgb, lumabr);

    float wc = getLumaWeight(lumac);
    float wtl = getLumaWeight(lumatl);
    float wtr = getLumaWeight(lumatr);
    float wbl = getLumaWeight(lumabl);
    float wbr = getLumaWeight(lumabr);

    vec3 colorSum = tl * wtl + tr * wtr + bl * wbl + br * wbr + c * wc * 4.;

    // dualBlur downSample weight combine with 1/(1 + Luma)
    float weightSum = wtl + wtr + wbl + wbr + wc * 4.;

    float depth = texture2D(uDepthTexture, uv).r;

    vec3 color = colorSum / weightSum;
    if(depth == 1.0) {
      discard;
    }
    gl_FragColor = vec4(color, 1.0);

  } else {
    vec4 col = texture2D(textureSampler, uv) * 4.;
    col += texture2D(textureSampler, uv1);
    col += texture2D(textureSampler, uv2);
    col += texture2D(textureSampler, uv3);
    col += texture2D(textureSampler, uv4);
    col *= .125;
    gl_FragColor = vec4(col.rgb, 1.);
  }
}