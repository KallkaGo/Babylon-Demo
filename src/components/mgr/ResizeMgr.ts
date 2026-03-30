import type { IResize } from './types';

export default class ResizeMgr {
  private static __ins: ResizeMgr;
  public static get shared() {
    if (!this.__ins) {
      this.__ins = new ResizeMgr();
    }
    return this.__ins;
  }

  constructor() {
    this._map = new Map();
  }

  private _map: Map<string, IResize>;

  private timeout: NodeJS.Timeout | undefined;

  private resize = () => {
    let { timeout } = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      this._map.forEach((unit) => unit.onResize(innerWidth, innerHeight));
      console.log('宽', innerWidth, '高', innerHeight);
      timeout = undefined;
    }, 200);
  };

  init() {
    window.addEventListener('resize', this.resize);
  }

  dispose() {
    // console.log('触发了 dispose -------------');
    window.removeEventListener('resize', this.resize);
  }

  reg(unit: IResize) {
    if (this._map.has(unit.uuid)) {
       console.warn('注册尺寸事件失败,uuid重复', unit.uuid);
      return;
    }
    unit.onResize(innerWidth, innerHeight);
    this._map.set(unit.uuid, unit);
  }

  unReg(unit: IResize) {
    if (!this._map.has(unit.uuid)) {
       console.warn('注销尺寸事件失败,未找到uuid', unit.uuid);
      return;
    }
    this._map.delete(unit.uuid);
  }

  getSize() {
    return { width: innerWidth, height: innerHeight };
  }
}
