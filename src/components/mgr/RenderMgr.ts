import { Config } from '@/Config';
import { Engine } from '@babylonjs/core';

export default class RenderMgr {
  private static __ins: RenderMgr;

  public static init() {
    this.__ins = new RenderMgr();
  }

  public static get shared(): RenderMgr {
    return this.__ins;
  }

  constructor() {
    const canvas = document.querySelector('.webgl') as HTMLCanvasElement;

    const renderer = new Engine(canvas, true);

    renderer.setHardwareScalingLevel(Math.max(1 / devicePixelRatio, 1 / Config.hardwareScale));

    this._renderer = renderer;
  }

  private _renderer: Engine;

  public get canvas() {
    return this._renderer.getRenderingCanvas();
  }

  init() {}

  get renderer(): Engine {
    return this._renderer;
  }
}
