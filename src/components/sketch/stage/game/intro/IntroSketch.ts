import { AssetContainer, BoundingInfo, CreateSphere, HemisphericLight, TransformNode, Vector3, type Nullable } from '@babylonjs/core';
import type { Asset } from '../../../../mgr/LoadMgr';
import RES from './RES';
import { Inspector } from '@babylonjs/inspector';
import PanelMgr from '../../../../mgr/PanelMgr';
import PaneMgr from '@/components/mgr/PaneMgr';
import { getRootNode } from '@utils/tools';
import { GameSkecth } from '../../GameSketch';
import { EStageID } from '@/components/enum/Enum';
import gsap from 'gsap';

const MIN_DELTA = 0.05;
const MAX_DELTA = 0.02;
const DIS = 2;

class IntroSkecth extends GameSkecth {
  constructor() {
    super(EStageID.INTRO);
    this.bindAssets(RES);

    this.addLight();

    location.hash.includes('debug') && Inspector.Show(this.scene, {});
  }

  private time: number = 0;
  private ball: Nullable<AssetContainer> = null;
  private car: Nullable<AssetContainer> = null;

  private addLight() {
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.25;
    const light2 = new HemisphericLight('light2', new Vector3(0, -1, 0), this.scene);
    light2.intensity = 0.25;
  }
  private inTroAnimation(model: AssetContainer) {
    const { world, camera } = this;

    this.camera.setPosition(new Vector3(1, 2, -3));

    this.camera.detachControl();

    const root = getRootNode(model);

    const group = new TransformNode(`group-${root.metadata.name}`);
    root.parent = group;
    group.parent = world;
    const param = {
      rotation: 0,
      fov: camera.fov,
      initalFov: camera.fov,
    };
    const t1 = gsap.timeline();
    t1.to(
      param,
      {
        rotation: -Math.PI * 2,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => {
          group.rotation.y = param.rotation;
        },
      },
      'start'
    )
      .to(param, {
        fov: param.initalFov - MIN_DELTA,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.fov = param.fov;
        },
      })
      .to(param, {
        fov: param.initalFov,
        duration: 1.5,
        delay: 0.2,
        ease: 'sine.inOut',
        onUpdate: () => {
          camera.fov = param.fov;
        },
        onComplete: () => {
          this.camera.attachControl();
          this.regSeparationAndMergerAni(this.ball!, DIS);
        },
      });

    t1.to(
      param,
      {
        fov: param.initalFov + MAX_DELTA,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.fov = param.fov;
        },
      },
      'start'
    );
  }

  private regSeparationAndMergerAni(animationTarget: AssetContainer, blastRadius?: number) {
    const pane = PaneMgr.shared.pane;
    this.processData(animationTarget, blastRadius);

    pane.addButton({ title: 'split' }).on('click', () => {
      // 创建一个 GSAP timeline 来管理所有动画
      const tl = gsap.timeline({
        defaults: {
          duration: 0.5,
          ease: 'power1.inOut',
        },
      });

      // 为每个 mesh 创建动画
      animationTarget?.meshes.forEach((mesh) => {
        if (mesh.name !== '__root__') {
          const tar = mesh.metadata.targetPosition!;
          // 直接动画到目标位置
          tl.to(
            mesh.position,
            {
              x: tar.x,
              y: tar.y,
              z: tar.z,
            },
            0
          ); // 所有动画同时开始
        }
      });
    });

    pane.addButton({ title: 'revert' }).on('click', () => {
      const tl = gsap.timeline({
        defaults: {
          duration: 0.5,
          ease: 'power1.inOut',
        },
      });

      animationTarget.meshes.forEach((mesh) => {
        if (mesh.name !== '__root__') {
          const orig = mesh.metadata.originalPosition!;
          tl.to(
            mesh.position,
            {
              x: orig.x,
              y: orig.y,
              z: orig.z,
            },
            0
          );
        }
      });
    });
  }

  private processData(source: AssetContainer, blastRadius: number = 1) {
    const root = getRootNode(source);
    const { min, max } = root.getHierarchyBoundingVectors();
    const rootBoundingInfo = new BoundingInfo(min, max);
    source.meshes.forEach((mesh, index) => {
      if (mesh.name !== '__root__') {
        const { min, max } = mesh.getHierarchyBoundingVectors(false);
        const eachBoundingInfo = new BoundingInfo(min, max);
        const dir = eachBoundingInfo.boundingBox.center.subtract(rootBoundingInfo.boundingBox.center).normalize();
        let targetAbsoluteposition = mesh.absolutePosition.add(dir.scale(blastRadius));
        const localPostion = Vector3.TransformCoordinates(targetAbsoluteposition, mesh.getWorldMatrix().clone().invert());
        mesh.metadata.originalPosition = mesh.position.clone();
        mesh.metadata.targetPosition = localPostion;
      }
    });
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
        // if (asset.name === 'sapphy') {
        //   root.metadata = { name: 'sapphy' };
        //   root.parent = this.world;
        //   this.sapphy = gltfContainer;
        //   gltfContainer.addToScene();
        //   return;
        // }

        // if (asset.name === 'car') {
        //   root.metadata = {};
        //   root.metadata.name = 'car';
        //   root.parent = this.world;
        //   root.scaling.setAll(0.005);
        //   this.car = gltfContainer;
        //   gltfContainer.addToScene();
        //   return;
        // }

        if (asset.name === 'posui') {
          root.metadata = {};
          root.metadata.name = 'posui';
          root.parent = this.world;
          this.ball = gltfContainer;
          gltfContainer.addToScene();
          return;
        }

        break;
      case 'cube':
        const cubeTexture = asset.data!;
        if (asset.name === 'skybox') {
          this.scene.createDefaultSkybox(cubeTexture, false, 1000, 0, true);
          return;
        }

        break;
    }
  }
  onLoadComplete(): void {
    super.onLoadComplete();
    console.log('onLoadComplete');
    PanelMgr.shared.hide('load').then(() => {
      PaneMgr.shared.pane.hidden = false;
    });
    this.inTroAnimation(this.ball!);
  }
}

export default IntroSkecth;
