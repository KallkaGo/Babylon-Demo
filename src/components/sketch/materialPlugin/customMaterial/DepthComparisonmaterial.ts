import { PBRMaterial,  type Nullable } from '@babylonjs/core';
import { OutlineDepthComparisonPlugin } from '../plugin/OutlineDepthComparisonPlugin';

export default class DepthComparisonmaterial {
  private static __ins: Nullable<DepthComparisonmaterial>;

  public static get shared() {
    if (!this.__ins) {
      this.__ins = new DepthComparisonmaterial();
    }

    return this.__ins;
  }

  constructor() {
    const baseMaterial = new PBRMaterial('baseDepthComparisonMaterial');
    baseMaterial.unlit = true;

    const plugin = new OutlineDepthComparisonPlugin(baseMaterial);
    plugin.isEnabled = true;

    this._plugin = plugin;
    this._material = baseMaterial;
  }

  private _material: PBRMaterial;
  private _plugin: OutlineDepthComparisonPlugin;

  public get material() {
    return this._material;
  }

  public get plugin() {
    return this._plugin;
  }
}
