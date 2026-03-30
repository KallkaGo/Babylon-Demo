import {
  AbstractMesh,
  Angle,
  AssetContainer,
  Color3,
  CubeTexture,
  DirectionalLight,
  FramingBehavior,
  GPUPicker,
  HDRCubeTexture,
  Material,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Quaternion,
  StandardMaterial,
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
import TextureDecrypt from '@utils/TextureDecrypt';
import { FixedEnvPlugin } from '@/components/sketch/materialPlugin/plugin/FIxedEnvPlugin';
class FixedEnvSketch extends GameSkecth {
  constructor() {
    super(EStageID.FIXEDENV);
    this.bindAssets(RES);

    // this.addLight();

    location.hash.includes('debug') && Inspector.Show(this.scene, {});

    this.camera.alpha = Math.PI / 2;
  }

  private ring: Nullable<AssetContainer> = null;

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
  }

  updateAfter(dt: number): void {
    super.updateAfter(dt);
  }
  onLoad(asset: Asset): void {
    super.onLoad(asset);
    switch (asset.type) {
      case 'gltf':
        const gltfContainer = asset.data!;
        if (asset.name === 'ring') {
          const root = getRootNode(gltfContainer);
          root.parent = this.world;
          this.ring = gltfContainer;
          gltfContainer.addToScene();
        }
        break;

      case 'texture':
        break;
      case 'cube':
        break;
    }
  }
  onLoadComplete() {
    super.onLoadComplete();
    this.initalize();
    this.regPlugin();
    this.initalizeUI();
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

    // const hdrUlr = this.assets.get('envHdr')?.src as string;
    // const tex = new HDRCubeTexture(hdrUlr, this.scene, 512);
    // this.scene.createDefaultSkybox(tex, false, radius * 1000, 0, true);
  }

  private regPlugin() {
    console.log(this.ring, 'ring');
    this.ring?.materials.forEach((mat) => {
      if (mat.name === 'metal') {
        const plugin = new FixedEnvPlugin(mat as PBRMaterial);
        plugin.isEnabled = true;
        // @ts-ignore
        mat.fixedEnvPlugin = plugin;
      }
    });
  }

  private initalizeUI() {
    const pane = PaneMgr.shared.pane;
    const params = {
      fixedEnv: true,
      envRotationX: 0,
      envRotationY: 0,
      envRotationZ: 0,
      euler: new Vector3(),
    };
    pane.addBinding(params, 'fixedEnv').on('change', ({ value }) => {
      this.ring?.materials.forEach((mat) => {
        if (mat.name === 'metal') {
          // @ts-ignore
          const plugin = mat.fixedEnvPlugin as FixedEnvPlugin;
          plugin.fixedEnv = value;
        }
      });
    });

    pane
      .addBinding(params, 'envRotationY', {
        min: -Math.PI,
        max: Math.PI,
      })
      .on('change', ({ value }) => {
        this.ring?.materials.forEach((mat) => {
          if (mat.name === 'metal') {
            params.euler.set(params.envRotationX, value, params.envRotationZ);
            // @ts-ignore
            const plugin = mat.fixedEnvPlugin as FixedEnvPlugin;
            Quaternion.FromEulerAnglesToRef(params.envRotationX, params.envRotationY, params.envRotationZ, plugin.rotateQuaternion);
          }
        });
      });

    pane
      .addBinding(params, 'envRotationX', {
        min: -Math.PI,
        max: Math.PI,
      })
      .on('change', ({ value }) => {
        this.ring?.materials.forEach((mat) => {
          if (mat.name === 'metal') {
            params.euler.set(value, params.envRotationY, params.envRotationZ);
            // @ts-ignore
            const plugin = mat.fixedEnvPlugin as FixedEnvPlugin;
            Quaternion.FromEulerAnglesToRef(params.envRotationX, params.envRotationY, params.envRotationZ, plugin.rotateQuaternion);
          }
        });
      });

    pane
      .addBinding(params, 'envRotationZ', {
        min: -Math.PI,
        max: Math.PI,
      })
      .on('change', ({ value }) => {
        this.ring?.materials.forEach((mat) => {
          if (mat.name === 'metal') {
            params.euler.set(params.envRotationX, params.envRotationY, value);
            // @ts-ignore
            const plugin = mat.fixedEnvPlugin as FixedEnvPlugin;
            Quaternion.FromEulerAnglesToRef(params.envRotationX, params.envRotationY, params.envRotationZ, plugin.rotateQuaternion);
          }
        });
      });
  }
}

export default FixedEnvSketch;
