import {
  AbstractMesh,
  AssetContainer,
  Color3,
  Color4,
  Constants,
  CubeTexture,
  DefaultRenderingPipeline,
  DirectionalLight,
  DynamicTexture,
  Effect,
  ExrLoaderGlobalConfiguration,
  EXROutputType,
  FramingBehavior,
  FxaaPostProcess,
  GPUPicker,
  ImageProcessingConfiguration,
  ImageProcessingPostProcess,
  Material,
  Matrix,
  Mesh,
  NullBlock,
  PassPostProcess,
  PBRMaterial,
  PostProcess,
  PostProcessRenderEffect,
  PostProcessRenderPipeline,
  Quaternion,
  ReflectionProbe,
  RenderTargetTexture,
  ShaderMaterial,
  Texture,
  ThinImageProcessingPostProcess,
  Vector2,
  Vector3,
  type Nullable,
} from '@babylonjs/core';
import type { Asset } from '../../../../mgr/LoadMgr';
import { Inspector } from '@babylonjs/inspector';
import PanelMgr from '../../../../mgr/PanelMgr';
import PaneMgr from '@/components/mgr/PaneMgr';
import { computeOffsets, copyLinearToSRGB, copySRGBToLinear, fromHexSting, getRootNode } from '@utils/tools';
import { GameSkecth } from '../../GameSketch';
import { EStageID } from '@/components/enum/Enum';
import gsap from 'gsap';
import TextureDecrypt from '@utils/TextureDecrypt';
import RenderMgr from '@/components/mgr/RenderMgr';
import RES from './RES';
import captureNormalvertexShader from '@/components/sketch/shader/captureNormal/vertex.glsl';
import captureNormalfragmentShader from '@/components/sketch/shader/captureNormal/fragment.glsl';
import gemVertexShader from '@/components/sketch/shader/gem/vertex.glsl';
import gemFragmentShader from '@/components/sketch/shader/gem/fragment.glsl';
import toneMapShader from '@/components/sketch/shader/pp/tonemap/fragment.glsl';
import type { Matrix4Tuple, Vector3Tuple } from './type';
import { BloomEffect } from '@/components/sketch/effect/BloomEffect';

interface IOffset {
  center: Vector3Tuple;
  offsetMatrix: Matrix4Tuple;
  offsetMatrixInv: Matrix4Tuple;
  radius: number;
  centerOffset: Vector3Tuple;
}

class DiamondSketch extends GameSkecth {
  constructor() {
    super(EStageID.DIAMOND);
    this.bindAssets(RES);

    this.addLight();

    location.hash.includes('debug') && Inspector.Show(this.scene, {});

    this.timeLine = gsap.timeline();

    this.camera.alpha = Math.PI / 2;

    ExrLoaderGlobalConfiguration.DefaultOutputType = EXROutputType.Float;
  }

  private time = 0;

  private modelScene: Nullable<AssetContainer> = null;

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
          // root.position.set(1, 0, 0);
          // this.encryModel = gltfContainer;
          gltfContainer.addToScene();
        } else {
          root.parent = this.world;
          // root.position.set(-1, 0, 0);
          this.modelScene = gltfContainer;
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
    this.initalize();
    this.computeOffset();
    this.initPostProcess();

    this.scene.onReadyObservable.addOnce(() => {
      PanelMgr.shared.hide('load').then(() => {
        PaneMgr.shared.pane.hidden = false;
      });
    });
  }

  private initDebugUI(mat: ShaderMaterial) {
    const pane = PaneMgr.shared.pane.addFolder({ title: 'Gem' });
    const params = {
      envRotationX: 0,
      envRotationY: 0,
      envRotationZ: 0,
      envMapRotation: 0,
      rotateQuaternion: new Quaternion(),
      color: '#f9dfec',
      gammaFactor: 1,
      dispersion: 0.012,
      absorption: 1.0,
      transmission: 0,
      envIntensity: 1.0,
      refractiveIndex: 2.6,
      rayBounces: 5,
      boostFactor: {
        x: 1.3,
        y: 1,
        z: 1,
      },
      reflectivity: 0.15,
    };

    pane.addBinding(params, 'color').on('change', ({ value }) => {
      mat.setColor3('color', copySRGBToLinear(fromHexSting(value)));
    });

    pane
      .addBinding(params, 'gammaFactor', {
        min: 0.1,
        max: 4,
      })
      .on('change', ({ value }) => {
        mat.setFloat('gammaFactor', value);
      });

    pane
      .addBinding(params, 'dispersion', {
        min: 0.0,
        max: 0.1,
        step: 0.01,
      })
      .on('change', ({ value }) => {
        mat.setFloat('rIndexDelta', value);
      });

    pane
      .addBinding(params, 'absorption', {
        min: 0,
        max: 15,
      })
      .on('change', ({ value }) => {
        mat.setFloat('absorptionFactor', value);
      });

    pane
      .addBinding(params, 'transmission', {
        value: 0,
        min: 0,
        max: 1,
      })
      .on('change', ({ value }) => {
        mat.setFloat('transmission', value);
      });

    pane
      .addBinding(params, 'envIntensity', {
        min: 0,
        max: 2,
      })
      .on('change', ({ value }) => {
        mat.setFloat('envMapIntensity', value);
      });

    pane
      .addBinding(params, 'refractiveIndex', {
        min: 1,
        max: 3,
      })
      .on('change', ({ value }) => {
        mat.setFloat('refractiveIndex', value);
      });

    pane
      .addBinding(params, 'rayBounces', {
        min: 0,
        max: 10,
        step: 1,
      })
      .on('change', ({ value }) => {
        mat.setInt('bounces', value);
      });

    pane.addBinding(params, 'boostFactor').on('change', ({ value }) => {
      mat.setVector3('boostFactors', new Vector3(value.x, value.y, value.z));
    });

    pane
      .addBinding(params, 'reflectivity', {
        min: 0,
        max: 2,
      })
      .on('change', ({ value }) => {
        mat.setFloat('reflectivity', value);
      });

    pane
      .addBinding(params, 'envRotationX', {
        min: -Math.PI,
        max: Math.PI,
      })
      .on('change', ({ value }) => {
        Quaternion.FromEulerAnglesToRef(value, params.envRotationY, params.envRotationZ, params.rotateQuaternion);
        mat.setQuaternion('envMapRotationQuat', params.rotateQuaternion);
      });

    pane
      .addBinding(params, 'envRotationY', {
        min: -Math.PI,
        max: Math.PI,
      })
      .on('change', ({ value }) => {
        Quaternion.FromEulerAnglesToRef(params.envRotationX, value, params.envRotationZ, params.rotateQuaternion);
        mat.setQuaternion('envMapRotationQuat', params.rotateQuaternion);
      });

    pane
      .addBinding(params, 'envRotationZ', {
        min: -Math.PI,
        max: Math.PI,
      })
      .on('change', ({ value }) => {
        Quaternion.FromEulerAnglesToRef(params.envRotationX, params.envRotationY, value, params.rotateQuaternion);
        mat.setQuaternion('envMapRotationQuat', params.rotateQuaternion);
      });

    pane
      .addBinding(params, 'envMapRotation', {
        min: -Math.PI,
        max: Math.PI,
      })
      .on('change', ({ value }) => {
        mat.setFloat('envMapRotation', value);
      });
  }

  private initPostProcess() {
    const fxaaPass = new FxaaPostProcess('fxaa', 1.0, this.camera);

    const imagePP = new ThinImageProcessingPostProcess('imagePP');

    Effect.ShadersStore['acesToneMapFragmentShader'] = toneMapShader;

    const pp = new PostProcessRenderPipeline(RenderMgr.shared.renderer, 'custom');

    const bloomEffect = new BloomEffect(this.scene, this.camera);
    bloomEffect.threshold = 0.5;
    bloomEffect.count = 4;
    bloomEffect.downSampleRange = 0;
    bloomEffect.upSampleRange = 0;
    bloomEffect.intensity = 1;
    bloomEffect.ignoreBackground = true;
    console.log(bloomEffect.isReady, '#######');
    pp.addEffect(bloomEffect);

    const bloomFolder = PaneMgr.shared.pane.addFolder({ title: 'Bloom' });
    bloomFolder.addBinding(bloomEffect, 'intensity', { min: 0, max: 10, step: 0.01 });
    bloomFolder.addBinding(bloomEffect, 'threshold', { min: 0, max: 1, step: 0.01 });

    const acesToneMapPass = new PostProcess(
      'acesToneMap',
      'acesToneMap',
      ['uToneMappingExposure', 'uToneMappingSaturation', 'uToneMappingContrast'],
      ['textureSampler'],
      1.0,
      null,
      Texture.BILINEAR_SAMPLINGMODE,
      RenderMgr.shared.renderer,
      undefined,
      undefined,
      Constants.TEXTURETYPE_HALF_FLOAT
    );

    acesToneMapPass.onApply = (effect: Effect) => {
      effect.setFloat('uToneMappingExposure', 1.0);
      effect.setFloat('uToneMappingSaturation', 0.96);
      effect.setFloat('uToneMappingContrast', 1.04);
    };

    const acesToneMapEffect = new PostProcessRenderEffect(RenderMgr.shared.renderer, 'acesToneMap', () => {
      return [acesToneMapPass];
    });

    pp.addEffect(acesToneMapEffect);

    this.scene.postProcessRenderPipelineManager.addPipeline(pp);
    this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(pp.name, [this.camera]);
  }

  private generateNormalMap(captureMesh: AbstractMesh): Promise<RenderTargetTexture> {
    const normalMaterial = new ShaderMaterial(
      'normalMat',
      this.scene,
      {
        vertexSource: captureNormalvertexShader,
        fragmentSource: captureNormalfragmentShader,
      },
      {
        attributes: ['position', 'uv', 'normal'],
        uniforms: ['world', 'view', 'projection', 'offsetCenter', 'offsetMatrixInv', 'radius'],
      }
    );
    // @ts-ignore
    const offset = captureMesh.geometry.metadata.normalsCaptureOffsets as IOffset;
    console.log('offset', offset);
    normalMaterial.setMatrix('offsetMatrixInv', new Matrix().fromArray(offset.offsetMatrixInv));
    normalMaterial.setVector3('offsetCenter', new Vector3().fromArray(offset.center));
    normalMaterial.setFloat('radius', offset.radius);

    const mesh = new Mesh('gem', this.scene);

    mesh.material = normalMaterial;

    // show
    // mesh.layerMask = 0x0fffffff;
    mesh.layerMask = 0x10000000;

    normalMaterial.backFaceCulling = false;

    captureMesh.geometry?.applyToMesh(mesh);

    const probe = new ReflectionProbe('probe', 1024, this.scene, false, true);

    probe.cubeTexture.updateSamplingMode(Texture.NEAREST_NEAREST);

    probe.renderList?.push(mesh);

    probe.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;

    probe.attachToMesh(mesh);

    return new Promise(async (reslove) => {
      await new Promise<void>((ok) => {
        const checkReady = () => {
          if (probe.cubeTexture?.isReadyForRendering() && mesh.isReady()) {
            ok();
          } else {
            setTimeout(checkReady, 16);
          }
        };
        checkReady();
      });

      // At the end of the next available frame, render the RTT
      await new Promise<void>((ok) => {
        RenderMgr.shared.renderer.onEndFrameObservable.addOnce(() => {
          probe.cubeTexture.render();
          // probe.cubeTexture.onAfterUnbindObservable.addOnce(() => {
          //   mesh.isVisible = false;
          // });
          ok();
        });
      });

      (captureMesh.material as PBRMaterial).reflectionTexture = probe.cubeTexture;

      reslove(probe.cubeTexture);
    });
  }

  private async computeOffset() {
    const diamondMesh = this.modelScene?.meshes.find((mesh) => mesh.name.includes('dia-ring-soli'))!;
    if (diamondMesh) {
      const offset = computeOffsets(diamondMesh);
      const normalMap = await this.generateNormalMap(diamondMesh);
      const diamondMaterial = new ShaderMaterial(
        'diamondMaterial',
        this.scene,
        {
          vertexSource: gemVertexShader,
          fragmentSource: gemFragmentShader,
        },
        {
          attributes: ['position', 'uv', 'normal'],
          uniforms: [
            'world',
            'view',
            'projection',
            'cameraPosition',
            'envMapIntensity',
            'gammaFactor',
            'envMapRotation',
            'reflectivity',
            'transmissionMode',
            'bounces',
            'centerOffset',
            'modelOffsetMatrix',
            'modelOffsetMatrixInv',
            'transmission',
            'colorCorrection',
            'boostFactors',
            'absorptionFactor',
            'squashFactor',
            'refractiveIndex',
            'rIndexDelta',
            'radius',
            'geometryFactor',
            'color',
            'resolution',
          ],
          samplers: ['envMap', 'transmissionSamplerMap', 'tCubeMapNormals'],
          defines: ['USE_LEFT_HAND'],
        }
      );

      diamondMaterial.setDefine('IMAGEPROCESSINGPOSTPROCESS', this.scene.imageProcessingConfiguration.applyByPostProcess);

      diamondMesh.material = diamondMaterial;

      diamondMaterial.setVector3('cameraPosition', this.camera.position);

      const envMap = this.assets.get('gemEnv')?.data as Texture;

      if (envMap) {
        envMap.updateSamplingMode(Texture.LINEAR_LINEAR);
        diamondMaterial.setTexture('envMap', envMap);
      }

      diamondMaterial.setTexture('tCubeMapNormals', normalMap);
      diamondMaterial.setFloat('envMapIntensity', 1);

      diamondMaterial.setFloat('gammaFactor', 1.0);
      diamondMaterial.setFloat('envMapRotation', 0);
      diamondMaterial.setQuaternion('envMapRotationQuat', new Quaternion());
      diamondMaterial.setFloat('reflectivity', 0.15);
      diamondMaterial.setInt('bounces', 5);
      diamondMaterial.setVector3('centerOffset', new Vector3().fromArray(offset.centerOffset));

      const modelOffsetMatrix = new Matrix().fromArray(offset.offsetMatrix).multiply(diamondMesh.getWorldMatrix());

      console.log('modelOffsetMatrix', modelOffsetMatrix);

      const transmissionMap = new DynamicTexture('transmission', {
        width: 1,
        height: 1,
      });

      transmissionMap.update();

      diamondMaterial.setTexture('transmissionSamplerMap', transmissionMap);

      diamondMaterial.setMatrix('modelOffsetMatrix', modelOffsetMatrix);
      diamondMaterial.setMatrix('modelOffsetMatrixInv', modelOffsetMatrix.clone().invert());
      diamondMaterial.setFloat('transmission', 0.0);
      diamondMaterial.setVector3('colorCorrection', new Vector3(1.0, 1.0, 1.0));
      diamondMaterial.setVector3('boostFactors', new Vector3(1.3, 1, 1));
      diamondMaterial.setFloat('absorptionFactor', 1);
      diamondMaterial.setFloat('squashFactor', 0.98);
      diamondMaterial.setFloat('refractiveIndex', 2.6);
      diamondMaterial.setFloat('rIndexDelta', 0.012);
      diamondMaterial.setFloat('radius', 1);
      diamondMaterial.setFloat('geometryFactor', 0.5);
      // diamondMaterial.setColor3('color', new Color3(0.9473, 0.7379, 0.8388));
      // new Color3(0.9473, 0.7379, 0.8388).toHexString('#f9dfec'));
      // diamondMaterial.setColor3('color', copySRGBToLinear(fromHexSting('f9dfec')));
      diamondMaterial.setColor3('color', copySRGBToLinear(fromHexSting('#f9dfec')));

      const _dpr = RenderMgr.shared.renderer.getHardwareScalingLevel();

      diamondMaterial.setVector2('resolution', new Vector2(innerWidth * _dpr, innerHeight * _dpr));

      this.initDebugUI(diamondMaterial);
    }
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

    this.scene.clearColor = new Color4(0, 0, 0, 1);
  }
}

export default DiamondSketch;
