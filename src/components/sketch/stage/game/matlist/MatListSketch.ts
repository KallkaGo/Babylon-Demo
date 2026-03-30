import {
  AbstractMesh,
  ArcRotateCamera,
  AssetContainer,
  BoundingInfo,
  Camera,
  Color3,
  Color4,
  Constants,
  CreateSphere,
  HemisphericLight,
  Material,
  Mesh,
  NullBlock,
  PBRMaterial,
  RenderTargetTexture,
  Texture,
  TransformNode,
  Vector3,
  type ISize,
  type Nullable,
} from '@babylonjs/core';
import type { Asset } from '../../../../mgr/LoadMgr';
import RES from './RES';
import { Inspector } from '@babylonjs/inspector';
import PanelMgr from '../../../../mgr/PanelMgr';
import PaneMgr from '@/components/mgr/PaneMgr';
import { debounce, float32ToUint8, getRootNode } from '@utils/tools';
import { GameSkecth } from '../../GameSketch';
import { EStageID } from '@/components/enum/Enum';
import { mergeTexture } from '@utils/mergeTexture';

interface ISnapShotTask {
  name: string;
  data: ImageData;
  sizes: ISize;
}

interface ISnapShotMap {
  name: string;
  maeterial: PBRMaterial;
  fboTexture: RenderTargetTexture;
}

const materialList = [
  {
    name: 'Onyx002',
    albedoTexture: 'Onyx002Color',
    bumpTexture: 'Onyx002Normal',
    metallicTexture: 'Onyx002Metallic',
    roughnessTexture: 'Onyx002Roughness',
    normalTexture: 'Onyx002Normal',
    ormTexture: 'Onyx002ORMTex',
    aoTexture: 'Onyx002Ao',
  },
  {
    name: 'Onyx006',
    albedoTexture: 'Onyx006Color',
    bumpTexture: 'Onyx006Normal',
    metallicTexture: 'Onyx006Metallic',
    roughnessTexture: 'Onyx006Roughness',
    normalTexture: 'Onyx006Normal',
    ormTexture: 'Onyx006ORMTex',
    aoTexture: 'Onyx006Ao',
  },
  {
    name: 'Travertine013',
    albedoTexture: 'Travertine013Color',
    bumpTexture: 'Travertine013Normal',
    metallicTexture: 'Travertine013Metallic',
    roughnessTexture: 'Travertine013Roughness',
    normalTexture: 'Travertine013Normal',
    ormTexture: 'Travertine013RMTex',
    aoTexture: 'Travertine013Ao',
  },
];

class MatListSkecth extends GameSkecth {
  constructor() {
    super(EStageID.INTRO);
    this.bindAssets(RES);

    this.addLight();

    this.sphere = CreateSphere('sphere', {
      diameter: 1,
      segments: 32,
    });

    this.snapShotMap = new Map();

    this.snapShotCamera = new ArcRotateCamera('snapShotCamera', 0, 0, 1, Vector3.Zero(), this.scene);
    this.snapShotCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this.snapShotCamera.setPosition(new Vector3(0, 0, -1));
    this.snapShotCamera.radius = 1;
    this.snapShotCamera.minZ = 0;
    this.snapShotCamera.maxZ = 2;
    this.snapShotCamera.orthoLeft = -1;
    this.snapShotCamera.orthoRight = 1;
    this.snapShotCamera.orthoTop = 1;
    this.snapShotCamera.orthoBottom = -1;
    this.snapShotCamera.beta = Math.PI / 2;
    this.snapShotCamera.alpha = 0;

    this.materListMaterial = new PBRMaterial('materialListMaterial', this.scene);

    location.hash.includes('debug') && Inspector.Show(this.scene, {});
  }

  private snapShotMap: Map<string, ISnapShotMap>;
  private time: number = 0;
  private sphere: Nullable<Mesh>;
  private snapShotCamera: Nullable<ArcRotateCamera>;
  private curIndex: number = 0;
  private materListMaterial: PBRMaterial;

  private addLight() {
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.5;
    const light2 = new HemisphericLight('light2', new Vector3(0, -1, 0), this.scene);
    light2.intensity = 0.5;
  }

  private preloadAssets() {
    const taskList = materialList.map((item) => {
      return new Promise<void>((ok, no) => {
        const { assets } = this;
        const ormTex = assets.get(item.ormTexture)?.data as Texture;
        if (ormTex) return ok();
        const aoTex = assets.get(item.aoTexture)?.data as Texture;
        const roughnessTex = assets.get(item.roughnessTexture)?.data as Texture;
        const metalicTex = assets.get(item.metallicTexture)?.data as Texture;
        mergeTexture(aoTex, roughnessTex, metalicTex).then((tex) => {
          tex.displayName = item.ormTexture;
          assets.set(item.ormTexture, {
            data: tex,
            type: 'texture',
            name: item.ormTexture,
            src: tex.url!,
          });
          ok();
        });
      });
    });

    return Promise.all(taskList);
  }

  private materialSnapShot() {
    const { scene, snapShotCamera, sphere, assets } = this;
    const snapShotTask: Promise<ISnapShotTask>[] = [];
    for (let i = 0; i < materialList.length; i++) {
      const item = materialList[i];

      let sphereMaterial;
      let fboTexture;
      if (!this.snapShotMap.has(item.name)) {
        fboTexture = new RenderTargetTexture(item.name, 512, scene, { generateMipMaps: false, type: Constants.TEXTURETYPE_HALF_FLOAT, samples: 16 });
        fboTexture.activeCamera = snapShotCamera;
        fboTexture.clearColor = new Color4(0, 0, 0, 0);
        sphereMaterial = this.materListMaterial.clone(item.name);
        this.snapShotMap.set(item.name, {
          name: item.name,
          maeterial: sphereMaterial,
          fboTexture,
        });
      } else {
        sphereMaterial = this.snapShotMap.get(item.name)?.maeterial as PBRMaterial;
        const { name, uniqueId, id, ...restMaterialProps } = sphere?.material as PBRMaterial;
        Object.assign(sphereMaterial, restMaterialProps);
        fboTexture = this.snapShotMap.get(item.name)?.fboTexture as RenderTargetTexture;
      }

      sphereMaterial.metallic = 1;
      sphereMaterial.roughness = 1;
      sphereMaterial.metallicTexture = assets.get(item.ormTexture)?.data as Texture;
      sphereMaterial.albedoTexture = assets.get(item.albedoTexture)?.data as Texture;
      sphereMaterial.bumpTexture = assets.get(item.normalTexture)?.data as Texture;
      sphereMaterial.useRoughnessFromMetallicTextureAlpha = false;
      sphereMaterial.useRoughnessFromMetallicTextureGreen = true;
      sphereMaterial.useMetallnessFromMetallicTextureBlue = true;
      fboTexture.setMaterialForRendering(sphere!, sphereMaterial);
      fboTexture.renderList = [sphere!];

      const task = new Promise<ISnapShotTask>((ok, no) => {
        let t = setInterval(() => {
          if (fboTexture.isReadyForRendering() && snapShotCamera?.isReady(true)) {
            fboTexture.render();
            clearInterval(t);
            fboTexture.readPixels()?.then((data) => {
              const unit8Array = float32ToUint8(data as Float32Array);
              const sizes = fboTexture.getSize();
              const imageData = new ImageData(new Uint8ClampedArray(unit8Array), sizes.width, sizes.width);
              ok({
                name: item.name,
                data: imageData,
                sizes,
              });
            });
          }
        }, 16);
      });

      snapShotTask.push(task);
    }

    return Promise.all(snapShotTask);
  }

  private generateMarble(index: number) {
    const { assets, scene, sphere } = this;
    const info = materialList[index];

    const diffuseTex = assets.get(info.albedoTexture)?.data as Texture;
    const normalTex = assets.get(info.normalTexture)?.data as Texture;
    // RGB —> AO/roughness/metalness
    const ormTex = assets.get(info.ormTexture)?.data as Texture;

    const sphereMaterial = new PBRMaterial('sphereMaterial', scene);
    sphereMaterial.metallic = 1;
    sphereMaterial.roughness = 1;
    sphereMaterial.metallicTexture = ormTex;
    sphereMaterial.albedoTexture = diffuseTex;
    sphereMaterial.bumpTexture = normalTex;
    sphereMaterial.useRoughnessFromMetallicTextureAlpha = false;
    sphereMaterial.useRoughnessFromMetallicTextureGreen = true;
    sphereMaterial.useMetallnessFromMetallicTextureBlue = true;
    sphere!.material = sphereMaterial;

    const handleFn = debounce(async () => {
      const data = await this.materialSnapShot();
      PanelMgr.shared.get('game')?.lerpUpdate({ materialList: data });
    });

    const params = {
      albedoColor: '#FFFFFF',
    };

    const pane = PaneMgr.shared.pane;
    const folder = pane.addFolder({ title: 'material' });
    folder.addBinding(sphereMaterial, 'indexOfRefraction', { min: 1, max: 3, step: 0.01 }).on('change', handleFn);

    folder
      .addBinding(params, 'albedoColor', {
        view: 'color',
      })
      .on('change', () => {
        sphereMaterial.albedoColor = Color3.FromHexString(params.albedoColor);
        handleFn();
      });

    this.curIndex = index;
  }

  updateBefore(dt: number): void {
    super.updateBefore(dt);
  }

  update(dt: number): void {
    super.update(dt);

    this.time += dt;
  }

  updateAfter(dt: number): void {
    super.updateAfter(dt);
  }
  onLoad(asset: Asset): void {
    super.onLoad(asset);
    switch (asset.type) {
      case 'gltf':
        const gltfContainer = asset.data!;
        const root = getRootNode(gltfContainer);

        break;

      case 'texture':
        break;
      case 'cube':
        const cubeTexture = asset.data!;
        if (asset.name === 'skybox') {
          this.scene.createDefaultSkybox(cubeTexture, false, 1000, 0, true);
          return;
        }

        break;
    }
  }
  async onLoadComplete(): Promise<void> {
    super.onLoadComplete();
    console.log('onLoadComplete');
    await this.preloadAssets();
    this.generateMarble(0);
    this.scene.onReadyObservable.addOnce(async () => {
      const materialList = await this.materialSnapShot();
      PanelMgr.shared.hide('load').then(() => {
        PaneMgr.shared.pane.hidden = false;
      });
      PanelMgr.shared.show('game', {
        materialList: materialList,
      });
    });
  }
}

export default MatListSkecth;
