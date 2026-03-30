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

class SSSSkecth extends GameSkecth {
  constructor() {
    super(EStageID.SSS);
    this.bindAssets(RES);

    this.addLight();

    // this.camera.setPosition(new Vector3(0, 0, -0.5));
    this.camera.setPosition(new Vector3(0, 0, -2));

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

  private bunny: Nullable<AssetContainer> = null;

  private dragon: Nullable<AssetContainer> = null;

  private people: Nullable<AssetContainer> = null;

  private thumbnail: Nullable<AssetContainer> = null;

  private haloweenpumpkin: Nullable<AssetContainer> = null;

  private sphere: Nullable<Mesh> = null;

  private activePointLight: Nullable<PointLight> = null;

  private directLight: Nullable<DirectionalLight> = null;

  // private addLight() {
  //   const directLight = new DirectionalLight('directLight', new Vector3(-0.2, -0.2, 0.2), this.scene);
  //   directLight.position = new Vector3(0.2, 0.2, -0.2);
  //   directLight.intensity = 0.5;

  //   const pointLight1 = new PointLight('pointLight1', new Vector3(0, 0.1, -0.2), this.scene);
  //   // pointLight1.diffuse = new Color3().fromHexString('#c10020');
  //   pointLight1.diffuse = Color3.FromHexString('#fb0000');
  //   pointLight1.specular = Color3.FromHexString('#fb0000');
  //   pointLight1.range = 100;
  //   pointLight1.intensity = 0.0;

  //   const sphere1 = CreateSphere('sphere', { diameter: 0.005, segments: 32 }, this.scene);
  //   sphere1.position = new Vector3(0, 0.1, -0.2);
  //   const mat = new PBRMaterial('sphere1-material', this.scene);
  //   mat.unlit = true;
  //   mat.albedoColor = Color3.FromHexString('#fb0000');
  //   sphere1.material = mat;

  //   // const pointLight2 = new PointLight('pointLight2', new Vector3(0, 1, 2), this.scene);
  //   // pointLight2.diffuse = new Color3().fromHexString('#2cdd00');
  //   // const pointLight2 = new PointLight('pointLight2', new Vector3(0, 0.1, 0.2), this.scene);
  //   // pointLight2.diffuse = Color3.FromHexString('#5300ff');
  //   // pointLight2.specular = Color3.FromHexString('#5300ff');
  //   // pointLight2.range = 100;
  //   // pointLight2.intensity = 0.05;

  //   // const sphere2 = CreateSphere('sphere', { diameter: 0.005, segments: 32 }, this.scene);
  //   // sphere2.position = new Vector3(0, 0.1, 0.2);
  //   // const mat2 = new PBRMaterial('sphere2-material', this.scene);
  //   // mat2.unlit = true;
  //   // mat2.albedoColor = Color3.FromHexString('#5300ff');
  //   // sphere2.material = mat2;

  //   const activePointLight = new PointLight('activePointLight', new Vector3(0, 0, 0), this.scene);
  //   activePointLight.diffuse = new Color3(1, 1, 1);
  //   activePointLight.specular = new Color3(1, 1, 1);
  //   // activePointLight.intensity = 0.02;
  //   // activePointLight.intensity = 0.1;
  //   activePointLight.range = 500;
  //   activePointLight.intensity = 0.1;

  //   this.activePointLight = activePointLight;
  // }

  private addLight() {
    // const directLight = new DirectionalLight('directLight', new Vector3(-6, -4, 5), this.scene);
    // directLight.position = new Vector3(6, 4, -5);
    // directLight.intensity = 1;

    const directLight = new DirectionalLight('directLight', new Vector3(10, -10, -10), this.scene);
    directLight.position = new Vector3(-10, 10, 10);
    directLight.intensity = 1;

    const directLight2 = new DirectionalLight('directLight2', new Vector3(0, 0, 1), this.scene);
    directLight2.intensity = 0.5;

    const directLight3 = new DirectionalLight('directLight3', new Vector3(-1, 1, -1), this.scene);
    directLight3.intensity = 1;

    const activePointLight = new PointLight('activePointLight', new Vector3(0, 0, 0), this.scene);
    activePointLight.diffuse = new Color3(1, 1, 1);
    activePointLight.specular = new Color3(1, 1, 1);
    activePointLight.intensity = 1;
    activePointLight.range = 100;
    activePointLight.position = new Vector3(0, 0.25, 0);
    // activePointLight.intensity = 0.1;
    // activePointLight.intensity = 20;

    this.activePointLight = activePointLight;

    this.directLight = directLight;
  }

  private initFastSSSBunny() {
    const { bunny, scene, assets, world } = this;
    const param = {
      thicknessPower: 2,
      subsurfaceDistortion: 0.1,
      thicknessScale: 0.5,
      thicknessAmbient: 0,
      thicknessAttenuation: 0.8,
      thicknessColor: new Color3(0.5, 0.3, 0.0).toHexString(),
    };

    const bunnyRoot = getRootNode(bunny!);

    const fastsssBunny = bunnyRoot.clone('fastsssBunny', world, false);

    bunnyRoot.position.x = -3;

    fastsssBunny!.position.x = 3;

    const albedoTexture = assets.get('commonAlbedo')?.data as Texture;
    const thicknessTexture = assets.get('bunnyThickness')?.data as Texture;
    const material = new PBRMaterial('material', scene);
    // material.albedoColor = new Color3(1, 0.2, 0.2);
    material.backFaceCulling = false;
    material.roughness = 0.16;
    material.metallic = 0;

    const plugin = new SSSPlugin(material);
    plugin.isEnabled = true;

    // @ts-ignore
    material.sssPlugin = plugin;

    plugin.thicknessMap = thicknessTexture;
    plugin.thicknessPower = param.thicknessPower;
    plugin.subsurfaceDistortion = param.subsurfaceDistortion;
    plugin.thicknessScale = param.thicknessScale;
    plugin.thicknessAmbient = param.thicknessAmbient;
    plugin.thicknessAttenuation = param.thicknessAttenuation;
    plugin.thicknessColor = Color3.FromHexString(param.thicknessColor);

    material.albedoTexture = albedoTexture;
    fastsssBunny?.getChildMeshes().forEach((mesh) => {
      mesh.material = material;
    });

    const pane = PaneMgr.shared.pane;

    pane
      .addBinding(param, 'thicknessPower', {
        min: 0,
        max: 10,
        step: 0.1,
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
        max: 10,
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
  }

  private initBunny() {
    const { bunny, scene, assets } = this;
    const albedoTexture = assets.get('bunnyAlbedo')?.data as Texture;
    const thicknessMap = assets.get('bunnyThickness')?.data as Texture;
    const material = new PBRMaterial('bunnyMaterial', scene);
    // material.albedoColor = new Color3(1, 0.2, 0.2);
    material.backFaceCulling = false;
    material.roughness = 0.16;
    material.metallic = 0;
    material.albedoTexture = albedoTexture;
    material.subSurface;
    bunny?.meshes.forEach((mesh) => {
      mesh.material = material;
    });
    scene.enableSubSurfaceForPrePass()!.metersPerUnit = 0.4;

    material.subSurface.thicknessTexture = thicknessMap;
    material.subSurface.maximumThickness = 3.3;
    material.subSurface.isTranslucencyEnabled = true;
    material.subSurface.isScatteringEnabled = true;
  }

  private initFastSSSDragon() {
    const { dragon, scene, assets, world } = this;
    const param = {
      thicknessPower: 2,
      subsurfaceDistortion: 0.5,
      // thicknessScale: 0.5,
      thicknessScale: 5,
      thicknessAmbient: 0,
      // thicknessAttenuation: 0.8,
      thicknessAttenuation: 0.2,
      // thicknessColor: new Color3(0.5, 0.3, 0.0).toHexString(),
      thicknessColor: new Color3(1, 1, 1).toLinearSpace().toHexString(),
      albeoColor: new Color3(0, 1, 0).toLinearSpace().toHexString(),
    };

    const dragonRoot = getRootNode(dragon!);

    const fastSSSDragon = dragonRoot.clone('fastsssdragon', world, false);

    dragonRoot.position.x = -0.1;

    fastSSSDragon!.position.x = 0.1;

    const albedoTexture = assets.get('commonAlbedo')?.data as Texture;
    const thicknessTexture = assets.get('dragonThickness')?.data as Texture;

    const material = new PBRMaterial('material', scene);
    material.albedoColor = Color3.FromHexString(param.albeoColor);
    material.backFaceCulling = false;
    material.roughness = 0.2;
    material.metallic = 0;

    const plugin = new SSSPlugin(material);
    plugin.isEnabled = true;

    // @ts-ignore
    material.sssPlugin = plugin;

    plugin.thicknessMap = thicknessTexture;
    plugin.thicknessPower = param.thicknessPower;
    plugin.subsurfaceDistortion = param.subsurfaceDistortion;
    plugin.thicknessScale = param.thicknessScale;
    plugin.thicknessAmbient = param.thicknessAmbient;
    plugin.thicknessAttenuation = param.thicknessAttenuation;
    plugin.thicknessColor = Color3.FromHexString(param.thicknessColor);

    material.albedoTexture = albedoTexture;
    fastSSSDragon?.getChildMeshes().forEach((mesh) => {
      console.log(mesh);
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

  private initDragon() {
    const { dragon, scene, assets, directLight } = this;
    const albedoTexture = assets.get('bunnyAlbedo')?.data as Texture;
    const thicknessMap = assets.get('dragonThickness')?.data as Texture;
    const material = new PBRMaterial('dragonMaterial', scene);
    material.albedoColor = Color3.FromHexString('#40F7E0').toLinearSpace();
    material.backFaceCulling = false;
    material.roughness = 0.35;
    material.metallic = 0;
    material.albedoTexture = albedoTexture;

    directLight!.direction = dragon?.meshes[0].position!;

    scene.imageProcessingConfiguration.exposure = 1.6;
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    scene.enableSubSurfaceForPrePass()!.metersPerUnit = 0.4;
    scene.prePassRenderer!.samples = 0;

    material.subSurface.isTranslucencyEnabled = true;
    material.subSurface.isScatteringEnabled = true;
    material.subSurface.thicknessTexture = thicknessMap;
    material.subSurface.maximumThickness = 2.2;
    // material.subSurface.legacyTransluceny = true;

    dragon?.meshes.forEach((mesh) => {
      mesh.material = material;
    });
  }

  private initPeople() {
    const { people, scene, assets } = this;
    const albeodoTex = assets.get('peopleAlbedo')?.data as Texture;
    albeodoTex.vScale = -1;
    const normalTex = assets.get('peopleNormal')?.data as Texture;
    const material = new PBRMaterial('peopleMaterial', scene);
    material.metallic = 0;
    material.roughness = 0.67;
    material.backFaceCulling = false;
    material.albedoTexture = albeodoTex;
    material.bumpTexture = normalTex;
    material.subSurface.isScatteringEnabled = true;
    scene.enableSubSurfaceForPrePass()!.metersPerUnit = 0.07;
    people?.meshes.forEach((mesh) => {
      mesh.material = material;
    });
  }

  private initThumbnail() {
    const { thumbnail, scene, assets } = this;
    const aoTex = assets.get('thumbnailAO')?.data as Texture;
    const thicknessMap = assets.get('thumbnailThickness')?.data as Texture;
    const material = new PBRMaterial('thumbnailMaterial', scene);
    material.backFaceCulling = false;
    material.metallic = 0;
    material.roughness = 0.16;
    material.ambientTexture = aoTex;
    material.subSurface.useThicknessAsDepth = true;
    material.albedoColor = new Color3(0.05206767516207786, 0.5259747095201842, 0.11999482836103723);
    material.subSurface.isTranslucencyEnabled = true;
    material.subSurface.isScatteringEnabled = true;
    material.subSurface.thicknessTexture = aoTex;
    material.subSurface.maximumThickness = 10;
    scene.enableSubSurfaceForPrePass()!.metersPerUnit = 0.01;
    scene.prePassRenderer!.samples = 4;
    thumbnail?.meshes.forEach((mesh) => {
      if (mesh.name !== '__root__') {
        mesh.material = material;
      }
    });
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
      thicknessPower: 2,
      subsurfaceDistortion: 0.5,
      thicknessScale: 5,
      thicknessAmbient: 0,
      thicknessAttenuation: 0.2,
      thicknessColor: new Color3(1, 1, 1).toLinearSpace().toHexString(),
      albeoColor: new Color3(1, 1, 1).toLinearSpace().toHexString(),
    };

    const thicknessMap = assets.get('haloweenpumpkinThickness')?.data as Texture;
    const aoTex = assets.get('haloweenpumpkinAO')?.data as Texture;

    const material = haloweenpumpkin?.meshes[1].material as PBRMaterial;

    // material.ambientTexture = aoTex;

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
    // this.activePointLight!.position = this.sphere!.getAbsolutePosition();
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

        // if (asset.name === 'bunny') {
        //   root.parent = this.world;
        //   root.scaling.setAll(0.0001);
        //   this.bunny = gltfContainer;
        //   gltfContainer.addToScene();
        //   return;
        // }

        // if (asset.name === 'people') {
        //   root.parent = this.world;
        //   this.people = gltfContainer;
        //   gltfContainer.addToScene();
        //   return;
        // }

        // if (asset.name === 'dragon') {
        //   root.parent = this.world;
        //   this.dragon = gltfContainer;
        //   gltfContainer.addToScene();
        //   return;
        // }

        // if (asset.name === 'thumbnail') {
        //   root.parent = this.world;
        //   this.thumbnail = gltfContainer;
        //   root.scaling.setAll(0.1);
        //   gltfContainer.addToScene();
        //   return;
        // }

        if (asset.name === 'haloweenpumpkin') {
          root.parent = this.world;
          root.scaling.setAll(1);
          console.log('gltfContainer', gltfContainer);
          this.haloweenpumpkin = gltfContainer;
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

    // this.initDragon();
    // this.initThumbnail();
    // this.initFassThumbnail();
    this.initFastSSShaloweenpumpkin();
    this.initWorld();
    this.scene.onReadyObservable.addOnce(async () => {
      PanelMgr.shared.hide('load').then(() => {
        PaneMgr.shared.pane.hidden = false;
      });
    });
  }
}

export default SSSSkecth;
