import { AbstractEngine, Color3, Material, MaterialDefines, MaterialPluginBase, Quaternion, Scene, SubMesh, Texture, UniformBuffer, type Nullable } from '@babylonjs/core';

class FixedEnvPlugin extends MaterialPluginBase {
  public _isEnabled = false;
  public _fixedEnv = false;
  public rotateQuaternion: Quaternion;

  constructor(material: Material) {
    super(material, 'FixedEnv', 200, { FIXEDENV: false });
    this.rotateQuaternion = new Quaternion(0, 0, 0, 1);
    this.modifyShader(material);
  }

  get fixedEnv() {
    return this._fixedEnv;
  }

  set fixedEnv(fixedEnv) {
    if (this._fixedEnv === fixedEnv) {
      return;
    }
    this._fixedEnv = fixedEnv;
    this.markAllDefinesAsDirty();
  }

  get isEnabled() {
    return this._isEnabled;
  }

  set isEnabled(enabled) {
    if (this._isEnabled === enabled) {
      return;
    }
    this._isEnabled = enabled;
    this._fixedEnv = enabled;
    this.markAllDefinesAsDirty();
    this._enable(this._isEnabled);
  }

  modifyShader(material: Material) {
    material.customShaderNameResolve = (shaderName, uniforms, uniformBuffers, samplers, defines, attributes, options) => {
      if (options) {
        options.processFinalCode = (type, code) => {
          if (type === 'fragment') {
            const newCode = code
              .replace(
                `vec3 computeCubicCoords(vec4 worldPos,vec3 worldNormal,vec3 eyePosition,mat4 reflectionMatrix)\n{vec3 viewDir=normalize(worldPos.xyz-eyePosition);\nvec3 coords=reflect(viewDir,worldNormal);\ncoords=vec3(reflectionMatrix*vec4(coords,0));\nreturn coords;\n}`,
                `
              vec3 rotateByQuaternion(vec3 v, vec4 q) {
                vec3 qvec = q.xyz;
                vec3 uv = cross(qvec, v);
                vec3 uuv = cross(qvec, uv);
                return v + ((uv * q.w) + uuv) * 2.0;
              }

              vec3 computeCubicCoords(vec4 worldPos,vec3 worldNormal,vec3 eyePosition,mat4 reflectionMatrix){
                vec3 viewDir=normalize(worldPos.xyz-eyePosition);
                vec3 coords=reflect(viewDir,worldNormal);
                #ifdef FIXEDENV
                coords = (view * vec4(coords,0.)).xyz;
                #endif
                coords=vec3(reflectionMatrix*vec4(coords,0));

                coords = rotateByQuaternion(coords, uRotationQuat);

                return coords;
                }`
              )
              .replace(
                `normalW = perturbNormal(TBN, texture(bumpSampler, vMainUV1+uvOffset).xyz, vBumpInfos.y);`,
                `
                normalW = perturbNormal(TBN, texture(bumpSampler, vMainUV1+uvOffset).xyz, vBumpInfos.y);
                normalW = (view * vec4(normalW,0.)).xyz;
              `
              );

            return newCode;
          }
          return code;
        };
      }
      return shaderName;
    };
  }

  prepareDefines(defines: MaterialDefines) {
    defines.FIXEDENV = this._fixedEnv;
  }

  getUniforms() {
    return {
      ubo: [
        {
          name: 'uRotationQuat',
          size: 4,
          type: 'vec4',
        },
      ],
    };
  }

  getSamplers(_samplers: string[]): void {}
  bindForSubMesh(_uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, _subMesh: SubMesh): void {
    if (this._isEnabled) {
      _uniformBuffer.updateVector4('uRotationQuat', this.rotateQuaternion);
    }
  }

  getClassName() {
    return 'FixedEnvPlugin';
  }

  getCustomCode(shaderType: string): Nullable<{
    [pointName: string]: string;
  }> {
    return null;
  }
}

export { FixedEnvPlugin };
