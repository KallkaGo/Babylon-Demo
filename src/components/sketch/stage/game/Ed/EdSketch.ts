import {
  AbstractMesh,
  AssetContainer,
  Color3,
  CubeTexture,
  DirectionalLight,
  FramingBehavior,
  GPUPicker,
  Material,
  Mesh,
  PBRMaterial,
  Texture,
  Vector2,
  Vector3,
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
import gsap from 'gsap';
import TextureDecrypt from '@utils/TextureDecrypt';
import RenderMgr from '@/components/mgr/RenderMgr';
class EdSketch extends GameSkecth {
  constructor() {
    super(EStageID.ED);
    this.bindAssets(RES);

    this.addLight();

    location.hash.includes('debug') && Inspector.Show(this.scene, {});

    this.timeLine = gsap.timeline();

    this.camera.alpha = Math.PI / 2;

    TextureDecrypt.shared.initialize(this.scene);
  }

  private time = 0;

  private encryModel: Nullable<AssetContainer> = null;

  private timeLine: gsap.core.Timeline;

  private addLight() {
    const directLight = new DirectionalLight('directLight', new Vector3(10, -10, -10), this.scene);
    directLight.position = new Vector3(-10, 10, 10);
    directLight.intensity = 1;

    const directLight2 = new DirectionalLight('directLight2', new Vector3(0, 0, 1), this.scene);
    directLight2.intensity = 1;

    const directLight3 = new DirectionalLight('directLight3', new Vector3(-1, 1, -1), this.scene);
    directLight3.intensity = 1;
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
        if (asset.name.includes('_e')) {
          root.parent = this.world;
          root.position.set(1, 0, 0);
          this.encryModel = gltfContainer;
          gltfContainer.addToScene();
        } else {
          root.parent = this.world;
          root.position.set(-1, 0, 0);
          gltfContainer.addToScene();
        }

        break;

      case 'texture':
        break;
      case 'cube':
        // const cubeTexture = asset.data!;
        // if (asset.name === 'skybox') {
        //   this.scene.createDefaultSkybox(cubeTexture, false, 10000, 0, true);
        //   return;
        // }

        break;
    }
  }
  async onLoadComplete(): Promise<void> {
    super.onLoadComplete();
    this.initDebugUI();
    this.initalize();
    this.scene.onReadyObservable.addOnce(() => {
      PanelMgr.shared.hide('load').then(() => {
        PaneMgr.shared.pane.hidden = false;
      });
    });
  }

  private initalize() {
    // Bounding Info
    const boundingInfo = this.world.getHierarchyBoundingVectors(true, (node) => node.isEnabled() && node.isVisible);
    const frameBehavior = new FramingBehavior();
    this.camera.addBehavior(frameBehavior, true);
    frameBehavior.framingTime = 0;
    frameBehavior.elevationReturnTime = -1;
    frameBehavior.zoomOnBoundingInfo(boundingInfo.min, boundingInfo.max);
    const size = boundingInfo.max.subtract(boundingInfo.min);
    const radius = size.length();

    this.camera.minZ = radius * 0.01;

    this.camera.upperRadiusLimit = radius * 5;

    this.camera.maxZ = radius * 10;

    this.camera.alpha = Math.PI / 2;

    this.camera.beta = Math.PI / 2;

    // skyBox
    const skyboxTex = this.assets.get('skybox')?.data as CubeTexture;
    this.scene.createDefaultSkybox(skyboxTex, false, radius * 1000, 0, true);
  }

  private initDebugUI() {
    const pane = PaneMgr.shared.pane;

    const decryptBtn = pane.addButton({
      title: '解密',
      label: '纹理',
    });

    decryptBtn.on('click', async () => {
      await this.decryptTexture();
    });
  }

  private async decryptTexture() {
    const encryModel = this.encryModel!;
    console.log('encryModel', encryModel);
    const textures = encryModel.textures;
    // for (let i = 0; i < textures.length; i++) {
    //   const texture = textures[i] as Texture;
    //   const rtt = await TextureDecrypt.shared.decryptTexture(texture, RenderMgr.shared.renderer);

    //   texture.releaseInternalTexture();
    //   texture._texture = rtt._texture;

    //   rtt._texture = null;
    //   // @ts-ignore
    //   rtt._renderTarget._textures = null;

    //   rtt.dispose();

    //   rtt.getScene()?.removeTexture(rtt);
    // }

    const texMap = new Map();

    for (let i = 0; i < textures.length; i++) {
      const texture = textures[i] as Texture;
      texture.updateSamplingMode(Texture.NEAREST_LINEAR);
      const rtt = await TextureDecrypt.shared.decryptTexture(texture, RenderMgr.shared.renderer);
      texMap.set(texture.uniqueId, rtt);
    }

    // for (let i = 0; i < encryModel.materials.length; i++) {
    //   const material = encryModel.materials[i] as PBRMaterial;
    //   if (material.albedoTexture) {
    //     const oldTex = material.albedoTexture as Texture;
    //     const tex = texMap.get(material.albedoTexture.uniqueId) as Texture;
    //     tex.hasAlpha = oldTex.hasAlpha;
    //     material.albedoTexture = tex;
    //     oldTex.dispose();
    //   }

    //   // if (material.bumpTexture) {
    //   //   const oldTex = material.bumpTexture as Texture;
    //   //   const tex = texMap.get(material.bumpTexture.uniqueId) as Texture;
    //   //   material.bumpTexture = tex;
    //   //   oldTex.dispose();
    //   // }

    //   // if (material.metallicTexture) {
    //   //   const oldTex = material.metallicTexture as Texture;
    //   //   const tex = texMap.get(material.metallicTexture.uniqueId) as Texture;
    //   //   material.metallicTexture = tex;
    //   //   oldTex.dispose();
    //   // }

    //   // if (material.emissiveTexture) {
    //   //   const oldTex = material.emissiveTexture as Texture;
    //   //   const tex = texMap.get(material.emissiveTexture.uniqueId) as Texture;
    //   //   material.emissiveTexture = tex;
    //   //   oldTex.dispose();
    //   // }

    //   // if (material.ambientTexture) {
    //   //   const oldTex = material.ambientTexture as Texture;
    //   //   const tex = texMap.get(material.ambientTexture.uniqueId) as Texture;
    //   //   material.ambientTexture = tex;
    //   //   oldTex.dispose();
    //   // }
    // }

    // TextureDecrypt.shared.dispose();
  }
}

export default EdSketch;
