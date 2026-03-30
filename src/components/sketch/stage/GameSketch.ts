import type { Asset } from '@/components/mgr/LoadMgr';
import Sketch from '../Sketch';
import type { EStageID } from '@/components/enum/Enum';
import { ArcRotateCamera, Camera, TransformNode, Vector2, Vector3 } from '@babylonjs/core';
import RenderMgr from '@/components/mgr/RenderMgr';
import RES from './RES';
import UpdateMgr from '@/components/mgr/UpdateMgr';
import ResizeMgr from '@/components/mgr/ResizeMgr';

class GameSkecth extends Sketch {
  constructor(stageID: EStageID) {
    super();
    this.stageID = stageID;

    this.camera = this.createCamera();
    this.world = new TransformNode('world');

    this.sizes = new Vector2();

    this.bindAssets(RES);
  }

  public stageID: EStageID;

  protected world: TransformNode;

  protected camera: ArcRotateCamera;

  protected sizes: Vector2;

  private createCamera() {
    const camera = new ArcRotateCamera('camera', 0, 0, 3, Vector3.Zero(), this.scene);
    camera.attachControl(RenderMgr.shared.canvas, true);
    camera.setPosition(new Vector3(6, 4, -5));
    camera.wheelDeltaPercentage = 0.01;
    camera.minZ = 0.01;
    camera.maxZ = 1000;
    // camera.panningSensibility = 0;
    return camera;
  }

  load(): void {
    super.load();
    /* 从这里开始渲染 */
    UpdateMgr.shared.reg(this);
  }

  update(dt: number): void {}
  updateBefore(dt: number): void {}
  updateAfter(dt: number): void {
    this.scene.render();
  }
  onLoad(asset: Asset): void {}
  onLoadComplete(): void {
    ResizeMgr.shared.reg(this);
  }
  onResize(width: number, height: number): void {
    console.log('Resize', '宽', width, '高', height);
    this.sizes.set(width, height);
    RenderMgr.shared.renderer.resize();
  }
}

export { GameSkecth };
