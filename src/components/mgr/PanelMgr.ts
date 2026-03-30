import { Config } from '@/Config';
import Panel from '../ui/Panel';

import El from '@utils/El';
import LoadPanel from '../ui/panel/loadPanel/LoadPanel';
import GamePanel from '../ui/panel/gamePanel/GamePanel';

export default class PanelMgr {
  private static __ins: PanelMgr;
  public static get shared() {
    if (!this.__ins) {
      this.__ins = new PanelMgr();
    }
    return this.__ins;
  }

  constructor() {
    this._panelMap = new Map();
    this._classMap = new Map();

    // 越往后，越在顶层
    this._sort = ['load', 'game'];
  }

  private _panelMap: Map<keyof PanelNameMap, Panel<keyof PanelNameMap>>;
  private _classMap: Map<keyof PanelNameMap, new () => Panel<keyof PanelNameMap>>;
  private _sort: (keyof PanelNameMap)[];

  private inited = false;
  init() {
    if (this.inited) return;
    this._classMap.set('load', LoadPanel);
    this._classMap.set('game', GamePanel);
  }

  /**
   * 打开面板
   * @param name 面板注册名
   * @param data 面板所需要的数据
   * @returns
   */
  show<K extends keyof PanelNameMap>(name: K, data?: { [name: string]: any }): Promise<PanelNameMap[K]> {
    return new Promise((ok, no) => {
      let panel: PanelNameMap[K];

      if (!this._panelMap.has(name)) {
        if (!this._classMap.has(name)) {
          no(new Error(`${name}面板未注册`));
          return;
        }
        const panelClass = this._classMap.get(name) as new () => PanelNameMap[K];
        panel = new panelClass();
        if (data) {
          Object.assign(panel.userData, data);
        }
        this._panelMap.set(name, panel);
      } else {
        panel = this._panelMap.get(name)! as PanelNameMap[K];
      }
      const ui = El.get('panel');
      ui.appendChild(panel.el);
      panel.el.style.zIndex = `${this._sort.indexOf(name)}`;
      panel.load().then(() => {
        panel.show().then(() => {
          ok(panel);
          panel.onShow();
        });
      });
    });
  }

  /**
   * 关闭面板
   * @param name 面板注册名字
   * @returns
   */
  hide<K extends keyof PanelNameMap>(name: K): Promise<PanelNameMap[K]> {
    return new Promise((ok, no) => {
      if (!this._panelMap.has(name)) {
        Config.debug && console.warn(`${name}面板还没创建`);
        no();
      }
      const panel = this._panelMap.get(name) as PanelNameMap[K];
      this._panelMap.delete(name);
      panel
        .hide()
        .then(() => {
          ok(panel);
          const ui = El.get('panel');
          ui.removeChild(panel.el);
          panel.onHide();
        })
        .catch((err) => {
          no(err);
        });
    });
  }

  get<K extends keyof PanelNameMap>(name: K): PanelNameMap[K] | undefined {
    return (this._panelMap.get(name) as PanelNameMap[K]) || undefined;
  }
}

export interface PanelNameMap {
  load: LoadPanel;
  game: GamePanel;
}
