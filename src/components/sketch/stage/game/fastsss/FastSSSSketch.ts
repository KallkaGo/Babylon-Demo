import {
  AbstractMesh,
  ArcRotateCamera,
  AssetContainer,
  BoundingInfo,
  Camera,
  Color3,
  Color4,
  Constants,
  CreateBox,
  CreateSphere,
  CubeTexture,
  DirectionalLight,
  HemisphericLight,
  ImageProcessingConfiguration,
  Material,
  Matrix,
  Mesh,
  NullBlock,
  PBRMaterial,
  PointLight,
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
import { getRootNode } from '@utils/tools';
import { GameSkecth } from '../../GameSketch';
import { EStageID } from '@/components/enum/Enum';
import { SSSPlugin } from '@/components/sketch/materialPlugin/plugin/SSSPlugin.ts';
import envDDS from '@textures/env/environment.dds';

class FastSSSkecth extends GameSkecth {
  constructor() {
    super(EStageID.FASTSSS);
    this.bindAssets(RES);

    this.addLight();

    // this.camera.setPosition(new Vector3(0, 0, -0.5));
    this.camera.setPosition(new Vector3(0, 0.5, -2));

    this.sphere = CreateSphere('sphere', { diameter: 0.1, segments: 32 }, this.scene);

    const sphereMaterial = new PBRMaterial('sphere-material', this.scene);

    sphereMaterial.metallic = 0;
    sphereMaterial.roughness = 1;
    sphereMaterial.unlit = true;
    sphereMaterial.albedoColor = new Color3(1, 1, 1);
    this.sphere.material = sphereMaterial;

    // this.sphere.setPivotMatrix(Matrix.Translation(0, 0.1, 0.3), false);
    this.sphere.setPivotMatrix(Matrix.Translation(0, 2, 5), false);
    // this.sphere.isVisible = false;

    location.hash.includes('debug') && Inspector.Show(this.scene, {});
  }

  private time = 0;

  private thumbnail: Nullable<AssetContainer> = null;

  private haloweenpumpkin: Nullable<AssetContainer> = null;

  private sphere: Nullable<Mesh> = null;

  private candles: Nullable<AssetContainer> = null;

  private addLight() {
    const directLight = new DirectionalLight('directLight', new Vector3(10, -10, -10), this.scene);
    directLight.position = new Vector3(-10, 10, 10);
    directLight.intensity = 1;

    const directLight2 = new DirectionalLight('directLight2', new Vector3(0, 0, 1), this.scene);
    directLight2.intensity = 1;

    const directLight3 = new DirectionalLight('directLight3', new Vector3(-1, 1, -1), this.scene);
    directLight3.intensity = 1;
  }

  private initFassThumbnail() {
    const { thumbnail, scene, assets } = this;
    const param = {
      thicknessPower: 2,
      subsurfaceDistortion: 0.5,
      thicknessScale: 5,
      thicknessAmbient: 0,
      thicknessAttenuation: 0.2,
      thicknessColor: new Color3(1, 1, 1).toLinearSpace().toHexString(),
      albeoColor: new Color3(1, 1, 1).toLinearSpace().toHexString(),
    };

    const aoTex = assets.get('thumbnailAO')?.data as Texture;
    const thicknessMap = assets.get('thumbnailThickness')?.data as Texture;
    const albedoTexture = assets.get('commonAlbedo')?.data as Texture;

    const material = new PBRMaterial('thumbnailFastSSSMat', scene);
    material.albedoTexture = albedoTexture;
    material.albedoColor = Color3.FromHexString(param.albeoColor);
    material.backFaceCulling = false;
    material.roughness = 0.2;
    material.metallic = 0;

    const plugin = new SSSPlugin(material);
    plugin.isEnabled = true;

    // @ts-ignore
    material.sssPlugin = plugin;

    plugin.thicknessMap = thicknessMap;
    plugin.thicknessPower = param.thicknessPower;
    plugin.subsurfaceDistortion = param.subsurfaceDistortion;
    plugin.thicknessScale = param.thicknessScale;
    plugin.thicknessAmbient = param.thicknessAmbient;
    plugin.thicknessAttenuation = param.thicknessAttenuation;
    plugin.thicknessColor = Color3.FromHexString(param.thicknessColor);

    material.ambientTexture = aoTex;
    thumbnail?.meshes.forEach((mesh) => {
      if (mesh.name !== '__root__') {
        console.log('@@@@@@');
        mesh.material = material;
      }
    });

    const pane = PaneMgr.shared.pane;

    pane
      .addBinding(param, 'thicknessPower', {
        min: 0.01,
        max: 10,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessPower = param.thicknessPower;
      });

    pane
      .addBinding(param, 'subsurfaceDistortion', {
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', () => {
        plugin.subsurfaceDistortion = param.subsurfaceDistortion;
      });
    pane
      .addBinding(param, 'thicknessScale', {
        min: 0,
        max: 50,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessScale = param.thicknessScale;
      });

    pane
      .addBinding(param, 'thicknessAmbient', {
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessAmbient = param.thicknessAmbient;
      });

    pane
      .addBinding(param, 'thicknessAttenuation', {
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessAttenuation = param.thicknessAttenuation;
      });

    pane.addBinding(param, 'thicknessColor').on('change', () => {
      plugin.thicknessColor = Color3.FromHexString(param.thicknessColor);
    });

    pane.addBinding(param, 'albeoColor').on('change', () => {
      material.albedoColor = Color3.FromHexString(param.albeoColor);
    });
  }

  private initFastSSShaloweenpumpkin() {
    const { haloweenpumpkin, scene, assets } = this;
    const param = {
      thicknessPower: 1.16,
      subsurfaceDistortion: 0.56,
      thicknessScale: 10.5,
      thicknessAmbient: 0.5,
      thicknessAttenuation: 0.8,
      thicknessColor: '#d5520a',
      albeoColor: '#d5520a',
    };

    const thicknessMap = assets.get('haloweenpumpkinThickness')?.data as Texture;

    const material = haloweenpumpkin?.meshes[1].material as PBRMaterial;

    const plugin = new SSSPlugin(material);
    plugin.isEnabled = true;

    // @ts-ignore
    material.sssPlugin = plugin;

    plugin.thicknessMap = thicknessMap;
    plugin.thicknessPower = param.thicknessPower;
    plugin.subsurfaceDistortion = param.subsurfaceDistortion;
    plugin.thicknessScale = param.thicknessScale;
    plugin.thicknessAmbient = param.thicknessAmbient;
    plugin.thicknessAttenuation = param.thicknessAttenuation;
    plugin.thicknessColor = Color3.FromHexString(param.thicknessColor);

    // material.ambientTexture = aoTex;
    haloweenpumpkin?.meshes.forEach((mesh) => {
      if (mesh.name !== '__root__') {
        mesh.material = material;
      }
    });

    /* Light */
    const activePointLight = new PointLight('activePointLight', new Vector3(0, 0, 0), this.scene);
    activePointLight.diffuse = Color3.FromHexString('#d5850b');
    activePointLight.specular = Color3.FromHexString('#d5850b');
    activePointLight.intensity = 5;
    activePointLight.position = new Vector3(0, 0.1, 0);

    const pane = PaneMgr.shared.pane;

    pane
      .addBinding(param, 'thicknessPower', {
        min: 0.01,
        max: 10,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessPower = param.thicknessPower;
      });

    pane
      .addBinding(param, 'subsurfaceDistortion', {
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', () => {
        plugin.subsurfaceDistortion = param.subsurfaceDistortion;
      });
    pane
      .addBinding(param, 'thicknessScale', {
        min: 0,
        max: 50,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessScale = param.thicknessScale;
      });

    pane
      .addBinding(param, 'thicknessAmbient', {
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessAmbient = param.thicknessAmbient;
      });

    pane
      .addBinding(param, 'thicknessAttenuation', {
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessAttenuation = param.thicknessAttenuation;
      });

    pane.addBinding(param, 'thicknessColor').on('change', () => {
      plugin.thicknessColor = Color3.FromHexString(param.thicknessColor);
    });

    pane.addBinding(param, 'albeoColor').on('change', () => {
      material.albedoColor = Color3.FromHexString(param.albeoColor);
    });
  }

  private initFastSSSCandle() {
    const { candles, scene, assets } = this;
    const param = {
      thicknessPower: 1.16,
      subsurfaceDistortion: 0.56,
      thicknessScale: 10.5,
      thicknessAmbient: 0.5,
      thicknessAttenuation: 0.8,
      thicknessColor: '#d5520a',
      albeoColor: '#ffffff',
    };

    const thicknessMap = assets.get('candlesThickness')?.data as Texture;

    const material = scene.getMaterialByName('Candle') as PBRMaterial;

    material.metallic = 0;
    material.roughness = 1;

    const bindMeshes = material.getBindedMeshes();

    const plugin = new SSSPlugin(material);
    plugin.isEnabled = true;

    // @ts-ignore
    material.sssPlugin = plugin;

    plugin.thicknessMap = thicknessMap;
    plugin.thicknessPower = param.thicknessPower;
    plugin.subsurfaceDistortion = param.subsurfaceDistortion;
    plugin.thicknessScale = param.thicknessScale;
    plugin.thicknessAmbient = param.thicknessAmbient;
    plugin.thicknessAttenuation = param.thicknessAttenuation;
    plugin.thicknessColor = Color3.FromHexString(param.thicknessColor);

    /* Light */
    const activePointLight = new PointLight('activePointLight', new Vector3(0, 0, 0), this.scene);
    activePointLight.diffuse = Color3.FromHexString('#d5850b');
    activePointLight.specular = Color3.FromHexString('#d5850b');
    activePointLight.intensity = 5;
    activePointLight.position = new Vector3(0, 1, 0);

    bindMeshes.forEach((mesh) => {
      mesh.material = material;
    });

    const pane = PaneMgr.shared.pane;

    pane
      .addBinding(param, 'thicknessPower', {
        min: 0.01,
        max: 10,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessPower = param.thicknessPower;
      });

    pane
      .addBinding(param, 'subsurfaceDistortion', {
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', () => {
        plugin.subsurfaceDistortion = param.subsurfaceDistortion;
      });
    pane
      .addBinding(param, 'thicknessScale', {
        min: 0,
        max: 50,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessScale = param.thicknessScale;
      });

    pane
      .addBinding(param, 'thicknessAmbient', {
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessAmbient = param.thicknessAmbient;
      });

    pane
      .addBinding(param, 'thicknessAttenuation', {
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', () => {
        plugin.thicknessAttenuation = param.thicknessAttenuation;
      });

    pane.addBinding(param, 'thicknessColor').on('change', () => {
      plugin.thicknessColor = Color3.FromHexString(param.thicknessColor);
    });

    pane.addBinding(param, 'albeoColor').on('change', () => {
      material.albedoColor = Color3.FromHexString(param.albeoColor);
    });
  }

  private initWorld() {
    const { scene } = this;
    const envTexture = CubeTexture.CreateFromPrefilteredData(envDDS, scene);
    scene.environmentTexture = envTexture;
    scene.createDefaultSkybox(envTexture, true, 1000, 0.7, true);
    scene.imageProcessingConfiguration.exposure = 1;
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  }

  updateBefore(dt: number): void {
    super.updateBefore(dt);
    this.sphere!.rotation.y += dt;
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
        // if (asset.name === 'thumbnail') {
        //   root.parent = this.world;
        //   this.thumbnail = gltfContainer;
        //   root.scaling.setAll(0.1);
        //   gltfContainer.addToScene();
        //   return;
        // }

        // if (asset.name === 'haloweenpumpkin') {
        //   root.parent = this.world;
        //   root.scaling.setAll(1);
        //   root.position.y = -0.25;
        //   this.haloweenpumpkin = gltfContainer;
        //   gltfContainer.addToScene();
        //   return;
        // }

        if (asset.name === 'candles') {
          root.parent = this.world;
          root.scaling.setAll(0.02);
          this.candles = gltfContainer;
          gltfContainer.addToScene();
          return;
        }

        break;

      case 'texture':
        break;
      case 'cube':
        const cubeTexture = asset.data!;
        break;
    }
  }
  async onLoadComplete(): Promise<void> {
    super.onLoadComplete();
    console.log('onLoadComplete');
    // this.initFastSSShaloweenpumpkin();
    this.initFastSSSCandle();
    this.initWorld();
    this.scene.onReadyObservable.addOnce(async () => {
      PanelMgr.shared.hide('load').then(() => {
        PaneMgr.shared.pane.hidden = false;
      });
    });
  }
}

export default FastSSSkecth;
