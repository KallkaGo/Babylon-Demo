import { Material, MaterialDefines, MaterialPluginBase, type Nullable } from '@babylonjs/core';

class OutlineDepthPluginMaterial extends MaterialPluginBase {
  public _isEnabled = false;

  constructor(material: Material) {
    super(material, 'Depth', 200, { DEPTHMAT: false });
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
          CUSTOM_FRAGMENT_MAIN_END: `
            #ifdef DEPTHMAT
                float d = 0.5 * (vClipSpaceZW.x / vClipSpaceZW.y) + 0.5;
                gl_FragColor = vec4( vec3(d),1.);
            #endif
        `,
        };
  }
}

export { OutlineDepthPluginMaterial };
