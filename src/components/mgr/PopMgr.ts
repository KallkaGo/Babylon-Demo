import { Config } from '@/Config';
import El from '@utils/El';
import type Pop from '../ui/Pop';
import AnnotationPop from '../ui/pop/annotationPop/AnnotationPop';
import MarkPop from '../ui/pop/markPop/MarkPop';

export default class PopMgr {
  private static __ins: PopMgr;
  public static get shared() {
    if (!this.__ins) {
      this.__ins = new PopMgr();
    }
    return this.__ins;
  }

  constructor() {
    this._popMap = new Map();
    this._classMap = new Map();
  }

  private _popMap: Map<keyof PopNameMap, Array<Pop<keyof PopNameMap>>>;
  private _classMap: Map<keyof PopNameMap, new () => Pop<keyof PopNameMap>>;

  private inited = false;
  init() {
    if (this.inited) return;
    this._classMap.set('annotation', AnnotationPop);
    this._classMap.set('mark', MarkPop);
  }

  /**
   * 打开面板
   * @param name 面板注册名
   * @param data 面板所需要的数据
   * @returns
   */
  show<K extends keyof PopNameMap>(name: K, data?: { [name: string]: any }): Promise<PopNameMap[K]> {
    return new Promise((ok, no) => {
      let pop: PopNameMap[K];
      if (!this._classMap.has(name)) {
        no(new Error(`${name}面板未注册`));
        return;
      }
      const popClass = this._classMap.get(name) as new () => PopNameMap[K];
      pop = new popClass();

      if (data) {
        Object.assign(pop.userData, data);
      }

      if (!this._popMap.has(name)) {
        this._popMap.set(name, [pop]);
      } else {
        const popList = this._popMap.get(name);
        popList!.push(pop);
      }

      const ui = El.get('pop');
      ui.appendChild(pop.el);
      pop.load().then(() => {
        pop.show().then(() => {
          ok(pop);
          pop.onShow();
        });
      });
    });
  }

  /**
   * 关闭面板
   * @param name 面板注册名字
   * @returns
   */
  hide<K extends keyof PopNameMap>(name: K, popId: string): Promise<PopNameMap[K]> {
    return new Promise((ok, no) => {
      if (!this._popMap.has(name)) {
        Config.debug && console.warn(`${name}面板还没创建`);
        no();
      }
      const popsList = this._popMap.get(name) as Array<PopNameMap[K]>;
      const popIndex = popsList.findIndex((pop) => pop.uuid === popId);
      if (popIndex === -1) {
        Config.debug && console.warn(`${name}面板已被移除`);
        no();
      }
      const pop = popsList[popIndex];
      pop
        .hide()
        .then(() => {
          ok(pop);
          const ui = El.get('pop');
          ui.removeChild(pop.el);
          popsList.splice(popIndex, 1);
          pop.onHide();
        })
        .catch((err: any) => {
          no(err);
        });
    });
  }

  get<K extends keyof PopNameMap>(name: K, popId?: string): PopNameMap[K] | undefined {
    const popList = this._popMap.get(name) as Array<PopNameMap[K]>;
    const popIndex = popList.findIndex((pop) => pop.uuid === popId);
    return popIndex === -1 ? undefined : popList[popIndex];
  }
}

export interface PopNameMap {
  annotation: AnnotationPop;
  mark: MarkPop;
}
