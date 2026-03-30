import { Material, MaterialDefines, MaterialPluginBase, UniformBuffer, type Nullable } from '@babylonjs/core';

export class ShadowDepthPluginMaterial extends MaterialPluginBase {
  public opacity: number;
  public _isEnabled = false;

  constructor(material: Material) {
    super(material, 'Depth', 200, { DEPTHMAT: false });
    this.opacity = 1;
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

  prepareDefines(defines: MaterialDefines) {
    defines.DEPTHMAT = this._isEnabled;
  }

  getUniforms() {
    return {
      ubo: [{ name: 'uOpacity', size: 1, type: 'float' }],
      fragment: `#ifdef DEPTHMAT
            uniform float uOpacity;
        #endif`,
    };
  }

  bindForSubMesh(uniformBuffer: UniformBuffer) {
    if (this._isEnabled) {
      uniformBuffer.updateFloat('uOpacity', this.opacity);
    }
  }

  getClassName() {
    return 'DepthPluginMaterial';
  }

  getCustomCode(shaderType: string): Nullable<{
    [pointName: string]: string;
  }> {
    return shaderType === 'vertex'
      ? {
          CUSTOM_VERTEX_DEFINITIONS: `
            varying vec2 vClipSpaceZW;
        `,
          CUSTOM_VERTEX_MAIN_END: `
            vClipSpaceZW = gl_Position.zw;
        `,
        }
      : {
          CUSTOM_FRAGMENT_DEFINITIONS: `
            varying vec2 vClipSpaceZW;
        `,
          CUSTOM_FRAGMENT_MAIN_BEGIN: `
            #ifdef DEPTHMAT
                float d = 0.5 * (vClipSpaceZW.x / vClipSpaceZW.y) + 0.5;
                // gl_FragColor = vec4(mix(vec3(uColor), vec3(0.0), clamp((1.0 - d)*uOpacity, 0., 1.)), 1.);
                gl_FragColor = vec4(vec3(0.),(1.-d)*uOpacity);
                return;
            #endif
        `,
        };
  }
}
