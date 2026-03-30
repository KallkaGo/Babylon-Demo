import type { IUpdate } from './types';
import RenderMgr from './RenderMgr';
import { Config } from '@/Config';
import browser from '@utils/Browser';

export default class UpdateMgr {
  private static __ins: UpdateMgr;
  public static get shared() {
    if (!this.__ins) {
      this.__ins = new UpdateMgr();
    }
    return this.__ins;
  }

  constructor() {
    this.map = new Map();
  }
  private map: Map<string, IUpdate>;

  init() {
    browser.onShow(() => this.sysRun());
    browser.onHidden(() => this.sysPause());
    RenderMgr.init();
    RenderMgr.shared.renderer.runRenderLoop(this._update);
  }

  /**
   * 注册帧刷新事件
   * @param updatable
   */
  reg(updatable: IUpdate) {
    if (this.map.has(updatable.uuid)) {
      Config.debug && console.warn('注册更新事件失败，uuid重复', updatable.uuid);
      return;
    }
    this.map.set(updatable.uuid, updatable);
  }

  /**
   * 注销帧刷新事件，注销后下一帧将不会触发该事件
   * @param updatable
   */
  unReg(updatable: IUpdate) {
    if (!this.map.has(updatable.uuid)) {
      Config.debug && console.warn('注销更新事件失败，未找到uuid', updatable.uuid);
      return;
    }
    this.map.delete(updatable.uuid);
  }

  private _update = () => {
    // requestAnimationFrame(this._update);
    // setTimeout(this._update, 1000 / 45);

    let dt = RenderMgr.shared.renderer.getDeltaTime() / 1000;

    this.map.forEach((update) => {
      update.updateBefore(dt);
    });

    // 普通事件执行
    this.map.forEach((update) => {
      update.update(dt);
    });

    // 后置事件执行
    this.map.forEach((update) => {
      update.updateAfter(dt);
    });
  };

  /**
   * 系统运行。用于后台返回前台时触发
   * @returns
   */
  sysRun() {
    Config.debug && console.log('更新器sysRun');
  }

  /**
   * 系统停止。用于前台压到后台时触发
   */
  sysPause() {
    Config.debug && console.log('更新器sysPause');
  }
}
