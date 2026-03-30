import RenderMgr from '@/components/mgr/RenderMgr';
import { Camera, Color3, Constants, DepthRenderer, Effect, PostProcess, PostProcessRenderEffect, RenderTargetTexture, Scene, Texture, Vector2 } from '@babylonjs/core';
import downSampleVert from '../shader/downsample/vertex.glsl';
import downSampleFrag from '../shader/downsample/fragment.glsl';
import upsampleAndCompositeVert from '../shader/upsample/vertex.glsl';
import upsampleFrag from '../shader/upsample/fragment.glsl';
import mergeFrag from '../shader/bloomMerge/fragment.glsl';
import copyFrag from '../shader/copy/fragment.glsl';

export class BloomEffect extends PostProcessRenderEffect {
  private _effects: Array<PostProcess>;
  private _lumiancePass!: PostProcess;
  private _count: number;
  private _threshold: number;
  private _upSampleRange: number;
  private _downSampleRange: number;
  private _downSamplePP: Array<PostProcess>;
  private _upSamplePP: Array<PostProcess>;
  private _mergePass!: PostProcess;
  private _intensity: number;
  private _glowColor: Color3;
  private _blendOpacity: number;
  private _scene: Scene;
  private _camera: Camera;
  private _ignoreBackground: boolean;
  private _depthRenderer?: DepthRenderer;
  private _depthTexture: RenderTargetTexture | null;

  public get count() {
    return this._count;
  }

  public set count(value: number) {
    if (this._count !== value) {
      this._count = value;
      this._rebuildPipeline();
    }
  }

  public get effects() {
    return this._effects;
  }

  public get threshold() {
    return this._threshold;
  }

  public set threshold(value: number) {
    this._threshold = value;
  }

  public get downSampleRange() {
    return this._downSampleRange;
  }

  public set downSampleRange(value: number) {
    this._downSampleRange = value;
  }

  public get upSampleRange() {
    return this._upSampleRange;
  }

  public set upSampleRange(value: number) {
    this._upSampleRange = value;
  }

  public get intensity() {
    return this._intensity;
  }

  public set intensity(value: number) {
    this._intensity = value;
  }

  public get blendFactor() {
    return this._blendOpacity;
  }

  public set blendFactor(value: number) {
    this._blendOpacity = value;
  }

  public get glowColor() {
    return this._glowColor;
  }

  public set glowColor(value: Color3) {
    this._glowColor = value;
  }

  public get opacity() {
    return this._blendOpacity;
  }

  public set opacity(value: number) {
    this._blendOpacity = value;
  }

  public get ignoreBackground() {
    return this._ignoreBackground;
  }

  public set ignoreBackground(value: boolean) {
    if (this._ignoreBackground === value) return;
    if (value) {
      this._depthRenderer = this._scene.enableDepthRenderer(this._camera, true, true);
      this._depthTexture = this._depthRenderer.getDepthMap();
    } else {
      this._scene.disableDepthRenderer(this._camera);
      this._depthTexture = null;
    }
    this._ignoreBackground = value;
  }

  public get isReady() {
    let flag = false;
    for (let i = 0; i < this._effects.length; i++) {
      flag = this._effects[i].isReady();
    }

    return flag;
  }

  constructor(scene: Scene, camera: Camera) {
    const engine = RenderMgr.shared.renderer;
    super(
      engine,
      'bloom',
      () => {
        return this._effects;
      },
      true
    );

    this._scene = scene;
    this._camera = camera;
    this._count = 4;
    this._intensity = 1;
    this._threshold = 0;
    this._upSampleRange = 0;
    this._downSampleRange = 0;
    this._effects = [];
    this._downSamplePP = [];
    this._upSamplePP = [];
    this._blendOpacity = 1;
    this._glowColor = new Color3(1, 1, 1);
    this._depthTexture = null;
    this._ignoreBackground = false;

    Effect.ShadersStore['downsampleVertexShader'] = downSampleVert;
    Effect.ShadersStore['downsampleFragmentShader'] = downSampleFrag;
    Effect.ShadersStore['upsampleAndCompositeVertexShader'] = upsampleAndCompositeVert;
    Effect.ShadersStore['upsampleFragmentShader'] = upsampleFrag;
    Effect.ShadersStore['bloomMergeFragmentShader'] = mergeFrag;
    Effect.ShadersStore['copyFragmentShader'] = copyFrag;

    this._buildPipeline();
  }

  private _buildPipeline() {
    const engine = RenderMgr.shared.renderer;
    let size = 1;
    const downSampleSizes: number[] = [];
    for (let i = 0; i < this.count; i++) {
      downSampleSizes[i] = size;
      size /= 2;
    }

    for (let i = 0; i < this.count; i++) {
      const downSamplePass = new PostProcess(
        `downsample_${i}`,
        'downsample',
        ['uFirst', 'uLuminanceThreshold', 'uBlurRange', 'uSize'],
        ['textureSampler', 'uDepthTexture'],
        downSampleSizes[i],
        null,
        Texture.BILINEAR_SAMPLINGMODE,
        engine,
        false,
        `#define DODOWNSAMPLE_${i}`,
        Constants.TEXTURETYPE_HALF_FLOAT,
        'downsample'
      );

      downSamplePass.onApply = (effect) => {
        effect.setBool('uFirst', i === 0);
        effect.setFloat('uLuminanceThreshold', this._threshold);
        effect.setFloat('uBlurRange', this._downSampleRange);
        effect.setTexture('uDepthTexture', this._depthTexture);

        const pixelWidth = engine.getRenderWidth();
        const pixelHeight = engine.getRenderHeight();
        effect.setVector2('uSize', new Vector2(1.0 / pixelWidth, 1.0 / pixelHeight));
      };

      this._effects.push(downSamplePass);
      this._downSamplePP.push(downSamplePass);
    }

    const bridgeSize = Math.pow(0.5, this.count);

    const bridgePass = new PostProcess(
      'bloom_bridge',
      'copy',
      [],
      ['textureSampler'],
      bridgeSize,
      null,
      Texture.BILINEAR_SAMPLINGMODE,
      engine,
      false,
      undefined,
      Constants.TEXTURETYPE_HALF_FLOAT
    );

    this._effects.push(bridgePass);

    for (let i = this._count - 1; i >= 0; i--) {
      const currentInputScale = Math.pow(0.5, i + 1);
      const upSamplePass = new PostProcess(
        `${i == 0 ? 'bloomMerge' : `upsample_${i}`}`,
        `${i == 0 ? 'bloomMerge' : `upsample`}`,
        i == 0 ? ['uIntensity', 'uGlowColor', 'uBlendOpacity', 'uInvDownsampleCount'] : ['uBlurRange', 'uSize'],
        i == 0 ? ['textureSampler', 'baseSampler'] : ['textureSampler', 'uCurDownSample'],
        currentInputScale,
        null,
        Texture.BILINEAR_SAMPLINGMODE,
        engine,
        undefined,
        undefined,
        Constants.TEXTURETYPE_HALF_FLOAT,
        'upsampleAndComposite'
      );

      upSamplePass.onApply = (effect) => {
        if (i == 0) {
          effect.setFloat('uIntensity', this._intensity);
          effect.setColor3('uGlowColor', this._glowColor);
          effect.setFloat('uBlendOpacity', this._blendOpacity);
          effect.setTextureFromPostProcess('baseSampler', this._downSamplePP[0]);
          effect.setFloat('uInvDownsampleCount', 1.0 / this._count);
        }
        effect.setTextureFromPostProcess('uCurDownSample', this._downSamplePP[i]);
        effect.setFloat('uBlurRange', this._upSampleRange);
        const pixelWidth = engine.getRenderWidth();
        const pixelHeight = engine.getRenderHeight();
        effect.setVector2('uSize', new Vector2(1.0 / pixelWidth, 1.0 / pixelHeight));
      };

      this._upSamplePP.push(upSamplePass);
      this._effects.push(upSamplePass);
    }
  }

  private _rebuildPipeline() {
    this.dispose();
    this._buildPipeline();
  }

  public dispose() {
    this._effects.forEach((effect) => effect.dispose());
    this._effects = [];
    this._downSamplePP = [];
    this._upSamplePP = [];
  }
}
