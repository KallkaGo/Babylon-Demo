import { Camera, Color3, RenderTargetTexture, Scene, Texture } from '@babylonjs/core';
import { NormalMaterial } from '@babylonjs/materials';

interface Ioptions {
  width: number;
  height: number;
  clearColor?: Color3;
}

const useNormalBuffer = (scene: Scene, camera: Camera, options: Ioptions = { width: 512, height: 512 }) => {
  const normalTexture = new RenderTargetTexture('normalTexture', { width: options.width, height: options.height }, scene, { generateMipMaps: false, samples: 8 });
  normalTexture.clearColor = scene.clearColor.clone();
  normalTexture.activeCamera = camera;
  normalTexture.wrapU = normalTexture.wrapV = Texture.CLAMP_ADDRESSMODE
  scene.customRenderTargets.push(normalTexture);

  const meshes = scene.meshes;

  const normalMat = new NormalMaterial('normalMat', scene);

  meshes.forEach((mesh) => {
    normalTexture.setMaterialForRendering(mesh, normalMat);
    normalTexture.renderList!.push(mesh);
  });

  return normalTexture;
};

export { useNormalBuffer };
