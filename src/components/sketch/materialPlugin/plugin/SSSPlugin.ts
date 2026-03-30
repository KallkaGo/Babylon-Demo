import { AbstractEngine, Color3, Material, MaterialDefines, MaterialPluginBase, Scene, SubMesh, Texture, UniformBuffer, type Nullable } from '@babylonjs/core';

class SSSPlugin extends MaterialPluginBase {
  public _isEnabled = false;

  constructor(material: Material) {
    super(material, 'SSS', 200, { FAST_SUBSURFACE: false });
    this.thicknessPower = 2.0;
    this.thicknessAmbient = 0.0;
    this.thicknessScale = 1;
    this.subsurfaceDistortion = 0.1;
    this.thicknessAttenuation = 0.8;
    this.thicknessColor = new Color3(0.5, 0.3, 0.0);
    this.thicknessMap = null;
    this.modifyShader(material);
  }

  public thicknessPower: number;
  public subsurfaceDistortion: number;
  public thicknessScale: number;
  public thicknessAmbient: number;
  public thicknessAttenuation: number;
  public thicknessColor: Color3;
  public thicknessMap: Nullable<Texture>;

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

  modifyShader(material: Material) {
    material.customShaderNameResolve = (shaderName, uniforms, uniformBuffers, samplers, defines, attributes, options) => {
      if (options) {
        options.processFinalCode = (type, code) => {
          if (type === 'fragment') {
            console.log('code', code);
            const newCode = code.replace(
              `vec3 computeDiffuseLighting(preLightingInfo info,vec3 lightColor) {vec3 diffuseTerm=vec3(1.0/PI);\nvec3 clampedAlbedo=clamp(info.surfaceAlbedo,vec3(0.1),vec3(1.0));\ndiffuseTerm=diffuseBRDF_EON(clampedAlbedo,info.diffuseRoughness,info.NdotL,info.NdotV,info.LdotV);\ndiffuseTerm/=clampedAlbedo;\nreturn diffuseTerm*info.attenuation*info.NdotL*lightColor;\n}`,
              /*glsl*/ `
              vec3 computeDiffuseLighting(preLightingInfo info,vec3 lightColor) {
                vec3 diffuseTerm = vec3(1.0/PI);
                vec3 clampedAlbedo = clamp(info.surfaceAlbedo, vec3(0.1), vec3(1.0));
                diffuseTerm = diffuseBRDF_EON(clampedAlbedo, info.diffuseRoughness, info.NdotL, info.NdotV, info.LdotV);
                diffuseTerm /= clampedAlbedo;
                vec3 result = diffuseTerm*info.attenuation*info.NdotL*lightColor;
                /* FAST SSS */
                #ifdef FAST_SUBSURFACE
                vec3 csmThicknessMap = uThicknessColor * texture(uThicknessMap, vAlbedoUV).r;
                vec3 L = info.L;
                vec3 V = normalize(vEyePosition.xyz - vPositionW);
                vec3 N = normalize(vNormalW);
                vec3 H = normalize(L + N * uSubsurfaceDistortion);
                // “Simplified” Spherical Gaussian Exponentiation
                // float VDotH = pow(saturate(dot(V, -H)), uThicknessPower) * uThicknessScale;
                float VDotH = exp2(saturate(dot(V, -H))*uThicknessPower - uThicknessPower) * uThicknessScale;
                vec3 I = uThicknessAttenuation * (VDotH + uThicknessAmbient) * csmThicknessMap;
                result += I * lightColor;
                #endif
                return result;
              }
`
            );
            console.log('new code', newCode);
            return newCode;
          }
          return code;
        };
      }
      return shaderName;
    };
  }

  prepareDefines(defines: MaterialDefines) {
    defines.FAST_SUBSURFACE = this._isEnabled;
  }

  getUniforms() {
    return {
      ubo: [
        {
          name: 'uThicknessPower',
          size: 1,
          type: 'float',
        },
        {
          name: 'uSubsurfaceDistortion',
          size: 1,
          type: 'float',
        },
        {
          name: 'uThicknessScale',
          size: 1,
          type: 'float',
        },
        {
          name: 'uThicknessAmbient',
          size: 1,
          type: 'float',
        },
        {
          name: 'uThicknessAttenuation',
          size: 1,
          type: 'float',
        },
        {
          name: 'uThicknessColor',
          size: 3,
          type: 'vec3',
        },
      ],
      fragment: `
        uniform float uThicknessPower;
        uniform float uSubsurfaceDistortion;
        uniform float uThicknessScale;
        uniform float uThicknessAmbient;
        uniform float uThicknessAttenuation;
        uniform vec3 uThicknessColor;
      `,
    };
  }

  getSamplers(_samplers: string[]): void {
    _samplers.push('uThicknessMap');
  }
  bindForSubMesh(_uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, _subMesh: SubMesh): void {
    if (this._isEnabled) {
      _uniformBuffer.updateFloat('uThicknessPower', this.thicknessPower);
      _uniformBuffer.updateFloat('uSubsurfaceDistortion', this.subsurfaceDistortion);
      _uniformBuffer.updateFloat('uThicknessScale', this.thicknessScale);
      _uniformBuffer.updateFloat('uThicknessAmbient', this.thicknessAmbient);
      _uniformBuffer.updateFloat('uThicknessAttenuation', this.thicknessAttenuation);
      _uniformBuffer.updateColor3('uThicknessColor', this.thicknessColor);
      _uniformBuffer.setTexture('uThicknessMap', this.thicknessMap);
    }
  }

  getClassName() {
    return 'SSSPlugin';
  }

  getCustomCode(shaderType: string): Nullable<{
    [pointName: string]: string;
  }> {
    if (shaderType === 'fragment') {
      return {
        CUSTOM_FRAGMENT_BEGIN: /*glsl*/ `
        uniform sampler2D uThicknessMap;
        `,
        CUSTOM_FRAGMENT_MAIN_END: /*glsl*/ `
        // gl_FragColor = vec4(reflectivityOut.surfaceAlbedo,1.);
        `,
      };
    }

    return null;
  }
}

export { SSSPlugin };
