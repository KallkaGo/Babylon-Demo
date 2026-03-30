import { PBRMaterial, Scene, type Nullable } from '@babylonjs/core';
import { ShadowDepthPluginMaterial } from '../plugin/ShadowDepthPlugin';

export default class DepthShadowMaterial {
  private static __ins: Nullable<DepthShadowMaterial>;

  public static get shared() {
    if (!this.__ins) {
      this.__ins = new DepthShadowMaterial();
    }

    return this.__ins;
  }

  constructor() {
    const baseMaterial = new PBRMaterial('baseDepthShadowMaterial');

    baseMaterial.unlit = true;

    const plugin = new ShadowDepthPluginMaterial(baseMaterial);
    plugin.isEnabled = true;

    // @ts-ignore
    baseMaterial.depthShadowMat = plugin;

    this._plugin = plugin;
    this._material = baseMaterial;
  }

  private _material: PBRMaterial;
  private _plugin: ShadowDepthPluginMaterial;

  public get material() {
    return this._material;
  }

  public get plugin() {
    return this._plugin;
  }
}
