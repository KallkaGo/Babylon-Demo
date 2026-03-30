import $ from 'jquery';
import El from '@utils/El';
import type { PanelNameMap } from '../mgr/PanelMgr';
import ResizeMgr from '../mgr/ResizeMgr';
import { Load } from './Assets';
import { nanoid } from 'nanoid';
import type { IResize } from '../mgr/types';

export default abstract class Panel<K extends keyof PanelNameMap> implements IResize {
  constructor(name: K) {
    this._name = name;
    this.uuid = nanoid();
    const el = El.create('div');
    $(el).addClass([name]);
    this._el = el;

    // 存放需要加载的资源
    this._assets = [];
  }
  uuid: string;

  protected _el: HTMLDivElement;
  get el() {
    return this._el;
  }

  protected _name: K;
  get name() {
    return this._name;
  }

  userData: { [name: string]: any } = {};

  protected _assets: string[];

  load(): Promise<void> {
    return new Promise((ok, no) => {
      Load(this._assets).then(() => {
        ok();
      });
    });
  }

  onResize(width: number, height: number): void {
    
  }

  /**
   * 展示界面动画
   */
  public abstract show(): Promise<this>;

  /**
   * 界面消失动画
   */
  public abstract hide(): Promise<this>;

  /**
   * 注册事件，监听事件等
   */
  public onShow(): void {
    ResizeMgr.shared.reg(this);
  }

  /**
   * 从网页中移除，清空组件
   */
  public onHide(): void {
    ResizeMgr.shared.unReg(this);
  }
}
