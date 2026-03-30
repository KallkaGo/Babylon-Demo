import {
  AbstractMesh,
  AssetContainer,
  BlurPostProcess,
  Camera,
  Color3,
  Color4,
  Constants,
  Effect,
  FxaaPostProcess,
  Mesh,
  PassPostProcess,
  PostProcess,
  RenderTargetTexture,
  Scene,
  Texture,
  Vector2,
} from '@babylonjs/core';
import DepthComparisonmaterial from '../materialPlugin/customMaterial/DepthComparisonmaterial';
import outlineFragmentShader from '../shader/outline/outline.glsl';
import outlineFinalComposeShader from '../shader/outline/finalCompose.glsl';
import PaneMgr from '../../mgr/PaneMgr';
import type { IResize } from '@/components/mgr/types';
import { nanoid } from 'nanoid';
import ResizeMgr from '@/components/mgr/ResizeMgr';
import DepthOutlineMaterial from '../materialPlugin/customMaterial/DepthOutlineMaterial';

interface IParams {
  lineColor: string;
  resolution: number;
  edgeStrength: number;
  opacity: number;
  kernelSize: number;
  enable: boolean;
  x_ray: boolean;
  mode: number;
}

class OutLineEffect implements IResize {
  private _selection: Set<AbstractMesh> = new Set();
  private _scene: Scene;
  private _map: Map<string, Mesh> = new Map();
  private depthTexture: RenderTargetTexture;
  private maskTexture: RenderTargetTexture;
  private size: Vector2 = new Vector2(1, 1);
  private _camera: Camera;

  public uuid: string;

  private params: IParams;

  private renderList: AbstractMesh[] = [];

  constructor(scene: Scene, camera: Camera) {
    this.uuid = nanoid();

    this._scene = scene;

    this._camera = camera;

    this.params = {
      lineColor: '#ff5c00',
      resolution: 0.75,
      edgeStrength: 5,
      opacity: 1,
      kernelSize: 10,
      enable: true,
      x_ray: true,
      mode: 2,
    };

    this.depthTexture = this.createDepthTexture(scene, camera);

    this.maskTexture = this.createMaskTexture(scene, camera);

    this.createPostProcessPipeLine(scene, camera);

    ResizeMgr.shared.reg(this);
  }
  onResize(width: number, height: number): void {
    this.size.set(width, height);
  }

  public setPickedList(list: AbstractMesh[]) {
    this.renderList = list;

    list.forEach((mesh) => {
      this.update(mesh);
    });

    /* 选定一个虚拟的mesh 预创建fbo和renderList 来减少pick时的卡顿 仅作为当前阶段的解决方案 并不完美 */
    const virtualMesh = new Mesh('virtualMesh', this._scene);

    virtualMesh.setEnabled(false);

    this.addSelection(virtualMesh);
  }

  public addSelection(mesh: AbstractMesh) {
    if (this._selection.has(mesh)) {
      this._selection.delete(mesh);
    } else {
      this._selection.add(mesh);
    }
    this.depthTexture.renderList = this.renderList.filter((mesh) => !this._selection.has(mesh));
    this.maskTexture.renderList = Array.from(this._selection);
  }

  public clear() {
    this.depthTexture.renderList = [];
    this.maskTexture.renderList = [];
    this._selection.clear();
  }

  private update(mesh: AbstractMesh) {
    if (!this._map.has(mesh.id)) {
      this._map.set(mesh.id, mesh as Mesh);
      this.updateMaterial(mesh as Mesh);
    }
  }

  private updateMaterial(mesh: Mesh) {
    /* 深度材质 */
    const matDepthForRTT = DepthOutlineMaterial.shared.material;
    const pluginDepth = DepthOutlineMaterial.shared.plugin;
    // @ts-ignore
    matDepthForRTT!.depthMat = pluginDepth;
    this.depthTexture.setMaterialForRendering(mesh, matDepthForRTT!);

    /* 深度比较材质 */
    const matDepthComparisoForRTT = DepthComparisonmaterial.shared.material;
    const pluginComparison = DepthComparisonmaterial.shared.plugin;
    pluginComparison.depthTexture = this.depthTexture;
    pluginComparison.cameraNear = this._camera.minZ;
    pluginComparison.cameraFar = this._camera.maxZ;
    // @ts-ignore
    matDepthComparisoForRTT!.depthComparisonMat = pluginComparison;
    this.maskTexture.setMaterialForRendering(mesh, matDepthComparisoForRTT!);
  }
  private updateDefines(composer: PostProcess) {
    const defines = [];

    if (this.params.mode) {
      defines.push(`#define ${this.params.mode}`);
    }

    if (this.params.x_ray) {
      defines.push('#define X_RAY');
    }

    if (this.params.enable) {
      defines.push('#define ENABLE');
    }

    composer.updateEffect(defines.join('\n'));
  }

  private createDepthTexture(scene: Scene, camera: Camera) {
    const depthTexture = new RenderTargetTexture(
      'depthTexture',
      {
        width: innerWidth,
        height: innerHeight,
      },
      scene,
      { generateMipMaps: false, samples: 8, type: Constants.TEXTURETYPE_FLOAT }
    );
    depthTexture.clearColor = new Color4(1, 1, 1, 1);
    depthTexture.activeCamera = camera;
    depthTexture.wrapU = depthTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
    scene.customRenderTargets.push(depthTexture);
    return depthTexture;
  }

  private createMaskTexture(scene: Scene, camera: Camera) {
    const maskTexture = new RenderTargetTexture(
      'maskTexture',
      {
        width: innerWidth,
        height: innerHeight,
      },
      scene,
      { generateMipMaps: false, samples: 8 }
    );

    maskTexture.clearColor = new Color4(1, 1, 1, 1);
    maskTexture.activeCamera = camera;
    maskTexture.wrapU = maskTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
    scene.customRenderTargets.push(maskTexture);
    return maskTexture;
  }

  private createPostProcessPipeLine(scene: Scene, camera: Camera) {
    Effect.ShadersStore['outlineFragmentShader'] = outlineFragmentShader;
    Effect.ShadersStore['outlineFinalFragmentShader'] = outlineFinalComposeShader;

    const { maskTexture, depthTexture, size, params } = this;

    const pane = PaneMgr.shared.pane;

    const outLineFolder = pane.addFolder({ title: 'OutLine' });

    outLineFolder.addBinding(params, 'opacity', { min: 0, max: 1, step: 0.01 });

    outLineFolder.addBinding(params, 'x_ray').on('change', (_) => {
      // this.updateDefines(finalComposePass);
    });

    outLineFolder
      .addBinding(params, 'mode', {
        label: 'Mode',
        options: {
          ALPHA: 1,
          SCREEN: 2,
          NORMAL: 0,
        },
      })
      .on('change', (_) => {
        // this.updateDefines(finalComposePass);
      });

    outLineFolder.addBinding(params, 'enable').on('change', (_) => {
      // this.updateDefines(finalComposePass);
    });

    outLineFolder.addBinding(params, 'lineColor');

    outLineFolder.addBinding(params, 'resolution', { min: 0.5, max: 1, step: 0.01 }).on('change', ({ value }) => {
      const { x, y } = size;
      depthTexture.resize({ width: x * value, height: y * value });
      maskTexture.resize({ width: x * value, height: y * value });
    });

    outLineFolder.addBinding(params, 'edgeStrength', { min: 0, max: 10, step: 0.01 });

    outLineFolder.addBinding(params, 'kernelSize', { min: 0, max: 64 }).on('change', ({ value }) => {
      blurH.kernel = blurV.kernel = Math.floor(value);
    });

    const renderPass = new PassPostProcess('RenderPass', 1.0, camera);

    renderPass.samples = 8;

    const outlinePass = new PostProcess('Outline Pass', 'outline', ['uCameraNear', 'uCameraFar', 'uResolution'], ['uMaskTexture', 'uDepthTexture'], 1, camera);

    const blurH = new BlurPostProcess('blurh', new Vector2(1, 0), params.kernelSize, 1, camera);

    const blurV = new BlurPostProcess('blurv', new Vector2(0, 1), params.kernelSize, 1, camera);

    const finalComposePass = new PostProcess(
      'Final Pass',
      'outlineFinal',
      ['uLineColor', 'uOpacity', 'uEdgeStrength', 'uEnable', 'uX_Ray', 'uMode'],
      ['uMaskTexture', 'uSceneTexture'],
      1,
      camera
    );

    outlinePass.onApply = (effect) => {
      effect.setTexture('uMaskTexture', maskTexture);
      effect.setTexture('uDepthTexture', depthTexture);
      effect.setFloat('uCameraNear', camera.minZ);
      effect.setFloat('uCameraFar', camera.maxZ);
      effect.setVector2('uResolution', size);
    };

    finalComposePass.onApply = (effect) => {
      effect.setTexture('uMaskTexture', maskTexture);
      effect.setTextureFromPostProcess('uSceneTexture', renderPass);
      effect.setColor3('uLineColor', Color3.FromHexString(params.lineColor));
      effect.setFloat('uOpacity', params.opacity);
      effect.setFloat('uEdgeStrength', params.edgeStrength);
      effect.setBool('uEnable', params.enable);
      effect.setBool('uX_Ray', params.x_ray);
      effect.setInt('uMode', params.mode);
    };

    const fxaaPostProcess = new FxaaPostProcess('fxaa', 1.0, camera);
  }

  public createPaneByMesh(mesh: AbstractMesh | AssetContainer, name: string = '') {
    const pane = PaneMgr.shared.pane;

    const materialMap = new Map();

    /* 获得MateriList */
    if (mesh instanceof AssetContainer) {
      mesh.meshes.forEach((mesh) => {
        const mat = mesh.material;
        if (mat) {
          if (!materialMap.has(mat.name)) {
            materialMap.set(mat.name, mat);
          }
        }
      });
    } else {
      const mat = mesh.material;
      if (mat) {
        if (!materialMap.has(mat.name)) {
          materialMap.set(mat.name, mat);
        }
      }
    }

    const folder = pane.addFolder({ title: `Select ${name}` });

    const params = {
      selectMaterial: '',
    };

    const options: Record<string, any> = {
      none: '',
    };

    for (const [key, value] of materialMap.entries()) {
      options[key] = value.name;
    }

    folder
      .addBinding(params, 'selectMaterial', {
        label: 'material',
        options,
      })
      .on('change', ({ value }) => {
        const mat = materialMap.get(value);
        if (mat) {
          this._selection.clear();
          const bindMeshes = mat.getBindedMeshes() as AbstractMesh[];
          bindMeshes.forEach((mesh) => this.addSelection(mesh));
        }
      });
  }
}

export { OutLineEffect };
