import { PBRMaterial, Scene, type Nullable } from '@babylonjs/core';
import { OutlineDepthPluginMaterial } from '../plugin/OutlineDepthPlugin';

export default class DepthOutlineMaterial {
  private static __ins: Nullable<DepthOutlineMaterial>;

  public static get shared() {
    if (!this.__ins) {
      this.__ins = new DepthOutlineMaterial();
    }

    return this.__ins;
  }

  constructor() {
    const baseMaterial = new PBRMaterial('baseDepthOutlineMaterial');
    baseMaterial.unlit = true;

    const plugin = new OutlineDepthPluginMaterial(baseMaterial);
    plugin.isEnabled = true;

    this._plugin = plugin;
    this._material = baseMaterial;
  }

  private _material: PBRMaterial;
  private _plugin: OutlineDepthPluginMaterial;

  public get material() {
    return this._material;
  }

  public get plugin() {
    return this._plugin;
  }
}
