import { getRootNode } from '@utils/tools';
import PaneMgr from '../../mgr/PaneMgr';
import {
  ArcRotateCamera,
  AssetContainer,
  BlurPostProcess,
  Bone,
  Camera,
  Color4,
  Constants,
  Material,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  RenderTargetTexture,
  Scalar,
  StandardMaterial,
  Vector2,
  Vector3,
  type AbstractMesh,
  type Nullable,
  type Scene,
} from '@babylonjs/core';
import UpdateMgr from '@/components/mgr/UpdateMgr';
import type { IUpdate } from '@/components/mgr/types';
import { nanoid } from 'nanoid';
import DepthShadowMaterial from '../materialPlugin/customMaterial/DepthShadowMaterial';

interface IParams {
  intensity: number;
  softness: number;
  kernelSize: number;
  planeWidth: number;
  planeHeight: number;
  minZ: number;
  maxZ: number;
  planePosition: Vector3;
  boundingHeight: number;
  enable: boolean;
}

const PLANE_WIDTH = 10;
const PLANE_HEIGHT = 10;
const LOG_MAX_RESOLUTION = 9;
const LOG_MIN_RESOLUTION = 6;
const DEFAULT_HARD_INTENSITY = 0.3;
const MAXZ = 1;
const MINZ = 0;

class ContactShadow implements IUpdate {
  private shadowPlane!: Mesh;
  private shadowCamera!: ArcRotateCamera;
  private fboTexture!: RenderTargetTexture;
  private matDepth: Array<Material>;
  private blurPassMap: Map<string, BlurPostProcess>;
  private params: IParams;
  private isAnimate: boolean;
  private rootBone: Nullable<Bone> = null;
  public uuid: string;

  constructor(model: AbstractMesh | AssetContainer, scene: Scene, name: string = '') {
    this.uuid = nanoid();
    this.isAnimate = false;
    this.params = {
      intensity: 1,
      softness: 1,
      kernelSize: 12,
      planeWidth: PLANE_WIDTH,
      planeHeight: PLANE_HEIGHT,
      minZ: MINZ,
      maxZ: MAXZ,
      boundingHeight: 0,
      planePosition: new Vector3(0, 0, 0),
      enable: true,
    };
    this.isAnimate = false;
    this.matDepth = [];
    this.blurPassMap = new Map();
    this.initInfo(model);
    this.createShadowCamera(scene);
    this.createRenderTargetTexture(scene);
    this.createShadowPlane(model, scene);
    this.createPostProcess(this.shadowCamera);
    this.createDeBugGUI(name);
    this.initIntensityAndSoftness();

    UpdateMgr.shared.reg(this);
  }

  private initInfo(model: AbstractMesh | AssetContainer) {
    const {
      params: { planePosition },
    } = this;
    const epslion = 0.01;
    const border = 0.5;
    let boundingBox;
    if (model instanceof AssetContainer) {
      const root = getRootNode(model);
      boundingBox = root.getHierarchyBoundingVectors();
      planePosition.copyFrom(root.position);
      if (model.animationGroups.length > 0) {
        this.isAnimate = true;
        const rootBone = model.skeletons[0].bones[0];
        this.rootBone = rootBone;
      }
    } else {
      boundingBox = model.getHierarchyBoundingVectors();
      planePosition.copyFrom(model.position);
    }

    planePosition.y = boundingBox.min.y - (this.isAnimate ? epslion * 4.5 : epslion);

    let width = Math.abs(boundingBox.max.x - boundingBox.min.x);
    let height = Math.abs(boundingBox.max.z - boundingBox.min.z);

    width += border;
    height += border;

    this.params.planeWidth = Math.max(width, height);
    this.params.planeHeight = Math.max(width, height);
    this.params.minZ = boundingBox.min.y - epslion;
    this.params.maxZ = boundingBox.max.y + epslion;
  }

  private createRenderTargetTexture(scene: Scene) {
    const { shadowCamera } = this;
    const rtTexture = new RenderTargetTexture('rtTexture', 512, scene, { generateMipMaps: false, type: Constants.TEXTURETYPE_HALF_FLOAT });
    rtTexture.clearColor = new Color4(1, 1, 1, 0);
    rtTexture.activeCamera = shadowCamera;
    rtTexture.vScale = -1;
    rtTexture.hasAlpha = true;
    rtTexture.useCameraPostProcesses = true;
    rtTexture.level = 0;
    scene.customRenderTargets.push(rtTexture);
    this.fboTexture = rtTexture;
  }

  private createShadowPlane(model: AbstractMesh | AssetContainer, scene: Scene) {
    const width = this.params.planeWidth;
    const height = this.params.planeHeight;
    const planePosition = this.params.planePosition;
    if (model instanceof AssetContainer) {
      model.meshes.forEach((mesh) => this.addMeshtoRtTexture(mesh, scene));
    } else {
      this.addMeshtoRtTexture(model, scene);
    }

    const shadowPlane = MeshBuilder.CreateGround('ground', { width, height }, scene);
    shadowPlane.position.copyFrom(planePosition);
    shadowPlane.isPickable = false;
    shadowPlane.setEnabled(this.params.enable);
    const groundMaterial = new PBRMaterial('groundMaterial', scene);
    groundMaterial.unlit = true;
    groundMaterial.albedoTexture = this.fboTexture;
    groundMaterial.useAlphaFromAlbedoTexture = true;
    shadowPlane.material = groundMaterial;
    this.shadowPlane = shadowPlane;
  }

  private addMeshtoRtTexture(mesh: AbstractMesh, scene: Scene) {
    const { fboTexture, matDepth } = this;
    const materialForRTT = DepthShadowMaterial.shared.material;
    fboTexture.setMaterialForRendering(mesh, materialForRTT!);
    fboTexture.renderList!.push(mesh);
    matDepth.push(materialForRTT!);
  }

  private createShadowCamera(scene: Scene) {
    const { params } = this;

    const target = new Vector3(0, 0, 0).copyFrom(this.params.planePosition);

    const shadowCamera = new ArcRotateCamera('shadowCamera', 0, 0, 1, target, scene);
    shadowCamera.position.x = this.params.planePosition.x;
    shadowCamera.position.z = this.params.planePosition.z;
    const width = this.params.planeWidth;
    const height = this.params.planeHeight;

    shadowCamera.radius = -0.01;
    shadowCamera.minZ = params.minZ;
    shadowCamera.maxZ = params.maxZ;
    shadowCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    shadowCamera.orthoLeft = -width / 2;
    shadowCamera.orthoRight = width / 2;
    shadowCamera.orthoTop = height / 2;
    shadowCamera.orthoBottom = -height / 2;
    shadowCamera.beta = 0;
    shadowCamera.alpha = Math.PI / 2;
    this.shadowCamera = shadowCamera;
  }

  private createPostProcess(shadowCamera: Camera) {
    const { params } = this;

    const blurPasses = new Array(2);

    blurPasses[0] = new BlurPostProcess('blurh', new Vector2(1, 0), params.kernelSize, 1, shadowCamera);
    blurPasses[1] = new BlurPostProcess('blurv', new Vector2(0, 1), params.kernelSize, 1, shadowCamera);

    const keys = ['blurH', 'blurV'];

    keys.forEach((key, index) => {
      this.blurPassMap.set(key, blurPasses[index]);
      blurPasses[index].samples = 8;
    });
  }

  private createDeBugGUI(name: string) {
    const pane = PaneMgr.shared.pane;

    const shadowFolder = pane.addFolder({ title: `Shadow ${name}`, expanded: false });

    shadowFolder
      .addBinding(this.params, 'intensity', {
        label: 'Shadow Intensity',
        min: 0,
        max: 2,
      })
      .on('change', ({ value }) => {
        this.setIntensity(value);
      });

    shadowFolder
      .addBinding(this.params, 'kernelSize', {
        label: 'Kernel Size',
        min: 1,
        max: 64,
      })
      .on('change', ({ value }) => {
        this.blurPassMap.forEach((pass, _) => {
          pass.kernel = Math.floor(value);
        });
      });

    shadowFolder
      .addBinding(this.params, 'softness', {
        label: 'Shadow Softness',
        min: 0,
        max: 1,
      })
      .on('change', ({ value }) => {
        this.setSoftness(value);
      });

    shadowFolder.addBinding(this.params, 'enable').on('change', ({ value }) => {
      this.shadowPlane.setEnabled(value);
    });
  }

  private initIntensityAndSoftness() {
    this.setIntensity(this.params.intensity);
    this.setSoftness(this.params.softness);
  }

  private setSoftness(softness: number) {
    this.params.softness = softness;
    const resolution = Math.pow(2, LOG_MAX_RESOLUTION - softness * (LOG_MAX_RESOLUTION - LOG_MIN_RESOLUTION));
    this.setMapSize(resolution);
    const size = Math.abs(this.params.maxZ - this.params.minZ);
    const softFar = size / 2;
    const hardFar = size;
    this.shadowCamera.minZ = 0;
    this.shadowCamera.maxZ = Scalar.Lerp(hardFar, softFar, softness);
    /* 设置自定义深度材质的opacity 值越小 越清晰 越不透明 */
    // @ts-ignore
    this.matDepth.forEach((mat) => (mat.depthShadowMat!.opacity = 1 / softness));
    this.setIntensity(this.params.intensity);
  }

  private setIntensity(intensity: number) {
    const { shadowPlane, params } = this;
    params.intensity = intensity;
    (shadowPlane.material as StandardMaterial).alpha = intensity * Scalar.Lerp(DEFAULT_HARD_INTENSITY, 1, params.softness * params.softness);
  }

  private setMapSize(maxMapSize: number) {
    const { fboTexture } = this;
    const size = maxMapSize;
    fboTexture.resize(Math.floor(size));
  }

  updateBefore(dt: number): void {
    if (this.isAnimate) {
      const { rootBone } = this;
      const transformNode = rootBone?._linkedTransformNode;
      let worldPosition;
      if (transformNode) {
        worldPosition = transformNode?.getAbsolutePosition();
      } else {
        worldPosition = rootBone?.getAbsolutePosition();
      }
      this.shadowPlane.position.x = worldPosition!.x;
      this.shadowPlane.position.z = worldPosition!.z;
      this.shadowCamera.position.copyFrom(this.shadowPlane.position);
      this.shadowCamera.target.copyFrom(this.shadowPlane.position);
    }
  }

  update(dt: number): void {}

  updateAfter(dt: number): void {}
}

export default ContactShadow;
