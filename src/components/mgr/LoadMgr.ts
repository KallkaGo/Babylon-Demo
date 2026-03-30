import { AssetContainer, CubeTexture, LoadAssetContainerAsync, Scene, Texture } from '@babylonjs/core';
import type { ILoadListener } from './types';
import { getCommonPath } from '@utils/tools';

type AssetGltf = { type: 'gltf'; data: AssetContainer | undefined };
type AssetTexture = { type: 'texture'; data: Texture | undefined };
type AssetAudio = { type: 'audio'; data: AudioBuffer | undefined };
type AssetHdr = { type: 'hdr'; data: Texture | undefined };
type AssetCube = { type: 'cube'; src: string[]; data: CubeTexture | undefined };

export type Asset = { name: string } & (((AssetGltf | AssetTexture | AssetAudio | AssetHdr ) & { src: string }) | AssetCube);

export default class LoadMgr {
  private static __ins: LoadMgr;
  public static get shared() {
    if (!this.__ins) {
      this.__ins = new LoadMgr();
    }
    return this.__ins;
  }

  constructor() {
    this.loadMap = new Map();
  }

  private loadMap: Map<string, Asset>;

  /**
   * 添加gltf
   * @param name
   * @param src
   * @returns
   */
  addGltf(name: string, src: string) {
    const { loadMap } = this;
    if (loadMap.has(name)) {
      console.warn(`LoadMgr: 资源命名重复, 请检查: ${name}`);
      return loadMap.get(name)!;
    }
    console.log('src', src);
    const asset: Asset = { type: 'gltf', name, src, data: undefined };
    loadMap.set(name, asset);

    return asset;
  }

  /**
   * 添加图片
   * @param name
   * @param src
   * @returns
   */
  addTexture(name: string, src: string) {
    const { loadMap } = this;
    if (loadMap.has(name)) {
      console.warn(`LoadMgr: 资源命名重复, 请检查: ${name}`);
      return loadMap.get(name)!;
    }
    const asset: Asset = { type: 'texture', name, src, data: undefined };
    loadMap.set(name, asset);

    return asset;
  }

  addHdr(name: string, src: string) {
    const { loadMap } = this;
    if (loadMap.has(name)) {
      console.warn(`LoadMgr: 资源命名重复, 请检查: ${name}`);
      return loadMap.get(name)!;
    }
    const asset: Asset = { type: 'hdr', name, src, data: undefined };
    loadMap.set(name, asset);

    return asset;
  }


  /**
   * 添加音频
   * @param name
   * @param src
   * @returns
   */
  addAudio(name: string, src: string) {
    const { loadMap } = this;
    if (loadMap.has(name)) {
      console.warn(`LoadMgr: 资源命名重复, 请检查: ${name}`);
      return loadMap.get(name)!;
    }
    const asset: Asset = { type: 'audio', name, src, data: undefined };
    loadMap.set(name, asset);

    return asset;
  }

  addCube(name: string, src: string[]) {
    const { loadMap } = this;
    if (loadMap.has(name)) {
      console.warn(`LoadMgr: 资源命名重复, 请检查: ${name}`);
      return loadMap.get(name)!;
    }
    const asset: Asset = { type: 'cube', name, src, data: undefined };
    loadMap.set(name, asset);
    return asset;
  }

  load(listener: ILoadListener, scene: Scene) {
    const { loadMap } = this;
    const taskList: Promise<any>[] = [];
    loadMap.forEach((asset) => {
      switch (asset.type) {
        case 'gltf':
          const meshTask = LoadAssetContainerAsync(asset.src, scene);
          meshTask.then((res) => {
            asset.data = res;
            this.loadMap.delete(asset.name);
            listener.onLoad(asset);
          });
          taskList.push(meshTask);
          break;
        case 'texture':
          const textureTask = new Promise((resolve) => {
            const texture = new Texture(asset.src, scene, false, false);
            texture.onLoadObservable.addOnce(() => {
              asset.data = texture;
              this.loadMap.delete(asset.name);
              listener.onLoad(asset);
              resolve(asset);
            });
          });
          taskList.push(textureTask);
          break;
        case 'audio':
          break;
        case 'hdr':
          break;
        case 'cube':
          const commonPath = getCommonPath(asset.src);
          const cubeTextureTask = new Promise((resolve) => {
            /* 两种加载形式 二选一 */

            /* 需要注意 数组里元素的顺序*/
            // const cubeTexture = new CubeTexture('', scene, {
            //   files: asset.src,
            // });

            const cubeTexture = new CubeTexture(commonPath, scene, ['px.png', 'py.png', 'pz.png', 'nx.png', 'ny.png', 'nz.png']);
            cubeTexture.onLoadObservable.addOnce(() => {
              asset.data = cubeTexture;
              this.loadMap.delete(asset.name);
              listener.onLoad(asset);
              resolve(asset);
            });
          });
          taskList.push(cubeTextureTask);
          break;
      }
    });

    Promise.all(taskList).then((_) => {
      listener.onLoadComplete();
    });
  }
}
