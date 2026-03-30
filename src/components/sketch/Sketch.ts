import type { ILoadListener, IUpdate, IResize } from '@/components/mgr/types';
import LoadMgr, { type Asset } from '../mgr/LoadMgr';
import { Config } from '@/Config';
import { Scene } from '@babylonjs/core';
import { nanoid } from 'nanoid';
import RenderMgr from '../mgr/RenderMgr';

interface IRes {
  gltf: { [name: string]: string };
  audio: { [name: string]: string };
  texture: { [name: string]: string };
  hdr: { [name: string]: string };
  cube: { [name: string]: string[] };
}

export default abstract class Sketch implements IUpdate, IResize, ILoadListener {
  constructor() {
    this.uuid = nanoid();
    this.scene = new Scene(RenderMgr.shared.renderer);
    this.assets = new Map();
  }

  /**添加需要加载的资源 */
  protected bindAssets(res: IRes) {
    for (let key in res.gltf) {
      if (this.assets.has(key)) {
        Config.debug && console.warn(`[Scene:bindAssets]资源命名重复：${key}`);
      }
      this.assets.set(key, LoadMgr.shared.addGltf(key, res.gltf[key]));
    }

    for (let key in res.texture) {
      if (this.assets.has(key)) {
        Config.debug && console.warn(`[Scene:bindAssets]资源命名重复：${key}`);
      }
      this.assets.set(key, LoadMgr.shared.addTexture(key, res.texture[key]));
    }

    for (let key in res.hdr) {
      if (this.assets.has(key)) {
        Config.debug && console.warn(`[Scene:bindAssets]资源命名重复：${key}`);
      }
      this.assets.set(key, LoadMgr.shared.addHdr(key, res.hdr[key]));
    }

    for (let key in res.audio) {
      if (this.assets.has(key)) {
        Config.debug && console.warn(`[Scene:bindAssets]资源命名重复：${key}`);
      }
      this.assets.set(key, LoadMgr.shared.addAudio(key, res.audio[key]));
    }

    for (let key in res.cube) {
      if (this.assets.has(key)) {
        Config.debug && console.warn(`[Scene:bindAssets]资源命名重复：${key}`);
      }
      this.assets.set(key, LoadMgr.shared.addCube(key, res.cube[key]));
    }
  }

  /**
   * 摄像机
   */

  public scene: Scene;

  public uuid: string;

  protected assets: Map<string, Asset>;

  abstract update(dt: number): void;
  abstract updateBefore(dt: number): void;
  abstract updateAfter(dt: number): void;

  protected loaded: boolean = false;

  load() {
    LoadMgr.shared.load(this, this.scene);
  }

  abstract onLoad(asset: Asset): void;

  abstract onLoadComplete(): void;

  abstract onResize(width: number, height: number): void;
}
