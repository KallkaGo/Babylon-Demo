import { BlurPostProcess, Camera, Effect, PassPostProcess, PostProcess, Scene, Texture, Vector2 } from '@babylonjs/core';
import { useNormalBuffer } from '@utils/useNormalBuffer';
import PaneMgr from '../../mgr/PaneMgr';
import sobelOperatorShader from '../shader/sobeloutline/sobelOperator.glsl';
import finalComposeShader from '../shader/sobeloutline/finalCompose.glsl';

export default class SobelOutline {
  constructor(scene: Scene, camera: Camera) {
    Effect.ShadersStore['sobelOperatorFragmentShader'] = sobelOperatorShader;
    Effect.ShadersStore['finalComposeFragmentShader'] = finalComposeShader;

    const depthRenderer = scene.enableDepthRenderer(camera, true, true);

    const depthTexture = depthRenderer.getDepthMap();

    depthTexture.wrapU = depthTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

    depthTexture.samples = 8;

    const normalTexture = useNormalBuffer(scene, camera, { width: innerWidth, height: innerHeight });

    const pane = PaneMgr.shared.pane;

    const params = {
      tickness: 0.8,
      depthMul: 1,
      depthBias: 1,
      normalMul: 1,
      normalBias: 2.5,
      kernelSize: 5,
    };

    const outLineFolder = pane.addFolder({ title: 'OutLine' });

    outLineFolder.addBinding(params, 'tickness', { min: 0, max: 5, step: 0.01 });

    outLineFolder.addBinding(params, 'depthMul', { min: 1, max: 5 });

    outLineFolder.addBinding(params, 'depthBias', { min: 1, max: 20 });

    outLineFolder.addBinding(params, 'normalMul', { min: 1, max: 5 });

    outLineFolder.addBinding(params, 'normalBias', { min: 1, max: 20 });

    outLineFolder.addBinding(params, 'kernelSize', { min: 1, max: 64 }).on('change', ({ value }) => {
      blurH.kernel = blurV.kernel = Math.floor(value);
    });

    const dpr = window.devicePixelRatio;

    const baseCopy = new PassPostProcess('Scene copy', 1.0, camera);

    const sobelOperator = new PostProcess(
      'Sobel Operator',
      'sobelOperator',
      ['uCameraPosition', 'uResolution', 'uCameraNear', 'uCameraFar', 'uTickness', 'uOutLineDepthMul', 'uOutLineDepthBias', 'uOutLineNormalMul', 'uOutLineNormalBias'],
      ['uDepthTexture', 'uNormalTexture'],
      1,
      camera
    );

    sobelOperator.samples = 8;

    const blurH = new BlurPostProcess('blurh', new Vector2(1, 0), params.kernelSize, 1, camera);

    const blurV = new BlurPostProcess('blurv', new Vector2(0, 1), params.kernelSize, 1, camera);

    const finalCompose = new PostProcess('Final compose', 'finalCompose', null, ['uSceneTexture'], 1, camera);

    finalCompose.samples = 8;

    sobelOperator.onApply = (effect) => {
      effect.setTexture('uDepthTexture', depthTexture);
      effect.setTexture('uNormalTexture', normalTexture);
      effect.setFloat('uCameraFar', camera.maxZ);
      effect.setFloat('uCameraNear', camera.minZ);
      effect.setVector2('uResolution', new Vector2(innerWidth * dpr, innerHeight * dpr));
      effect.setFloat('uTickness', params.tickness);
      effect.setFloat('uOutLineDepthMul', params.depthMul);
      effect.setFloat('uOutLineDepthBias', params.depthBias);
      effect.setFloat('uOutLineNormalMul', params.normalMul);
      effect.setFloat('uOutLineNormalBias', params.normalBias);
      effect.setVector3('uCameraPosition', camera.position);
    };

    finalCompose.onApply = (effect) => {
      effect.setTextureFromPostProcess('uSceneTexture', baseCopy);
      effect.setTextureFromPostProcess('uSobelOutlineTexture', sobelOperator);
    };
  }
}
