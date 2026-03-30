import { Material, MaterialPluginBase, RenderTargetTexture, UniformBuffer, type Nullable } from '@babylonjs/core';

class OutlineDepthComparisonPlugin extends MaterialPluginBase {
  public _isEnabled = false;
  public depthTexture: RenderTargetTexture | null;
  public cameraNear: number;
  public cameraFar: number;

  constructor(material: Material) {
    super(material, 'DepthComparison', 200);
    this.depthTexture = null;
    this.cameraNear = 0.1;
    this.cameraFar = 100;
  }

  get isEnabled() {
    return this._isEnabled;
  }

  set isEnabled(enabled) {
    if (this._isEnabled === enabled) {
      return;
    }
    this._isEnabled = enabled;
    this.markAllDefinesAsDirty();
    this._enable(this._isEnabled);
  }

  getSamplers(_samplers: string[]): void {
    _samplers.push('uDepthTexture');
  }

  getUniforms() {
    return {
      ubo: [
        {
          name: 'uCameraNear',
          size: 1,
          type: 'float',
        },
        {
          name: 'uCameraFar',
          size: 1,
          type: 'float',
        },
      ],
      fragment: `
      uniform float uCameraNear;
      uniform float uCameraFar;
      `,
    };
  }

  bindForSubMesh(uniformBuffer: UniformBuffer) {
    if (this._isEnabled) {
      uniformBuffer.updateFloat('uCameraNear', this.cameraNear);
      uniformBuffer.updateFloat('uCameraFar', this.cameraFar);
      uniformBuffer.setTexture('uDepthTexture', this.depthTexture!);
    }
  }

  getClassName() {
    return 'DepthComparisonPluginMaterial';
  }

  getCustomCode(shaderType: string): Nullable<{
    [pointName: string]: string;
  }> {
    return shaderType === 'vertex'
      ? {
          CUSTOM_VERTEX_DEFINITIONS: /*glsl*/ `
            varying vec4 vClipPos;


        `,
          CUSTOM_VERTEX_MAIN_END: `
            vClipPos = gl_Position; 
        `,
        }
      : {
          CUSTOM_FRAGMENT_DEFINITIONS: `
            varying vec4 vClipPos;

            uniform sampler2D uDepthTexture;

            float LinearEyeDepth(float depth) {
              float x = 1. - uCameraFar / uCameraNear;
              float y = uCameraFar / uCameraNear;
              float z = x / uCameraFar;
              float w = y / uCameraFar;
              return 1.0 / (z * depth + w);
            }

        `,
          CUSTOM_FRAGMENT_MAIN_END: `
            vec2 clipTexCoord = (vClipPos.xy / vClipPos.w) * 0.5 + 0.5;

            clipTexCoord = clamp(clipTexCoord,0.002,0.998);

            float depth = texture2D(uDepthTexture, clipTexCoord).r;

            float eyeDepth = LinearEyeDepth(depth);
            /**  
              * 投影矩阵 P_pers:  
              *   
              * ┌                                          ┐  
              * │  2n/(r-l)      0           0        0    │  
              * │                                          │  
              * │     0       2n/(t-b)       0        0    │  
              * │                                          │  
              * │  (r+l)/(r-l) -(t+b)/(t-b) f/(f-n)   1    │  
              * │                                          │  
              * │     0           0       -fn/(f-n)    0   │  
              * └                                          ┘   
              */  
            float viewZ = vClipPos.w;

            float depthTest = (viewZ > eyeDepth) ? 1.0 : 0.0;

            gl_FragColor =vec4(vec3(0.,depthTest,0.),1.);
        `,
        };
  }
}

export { OutlineDepthComparisonPlugin };
