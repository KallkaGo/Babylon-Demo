import type { Nullable } from '@babylonjs/core';
import { Pane } from 'tweakpane';
export default class PaneMgr {
  private static __ins: Nullable<PaneMgr>;

  public static get shared() {
    if (!this.__ins) {
      this.__ins = new PaneMgr();
    }

    return this.__ins;
  }

  public disope() {
    this._pane.dispose();
    PaneMgr.__ins = null;
  }

  constructor() {
    const pane = new Pane({
      title: 'Debug',
    });
    pane.hidden = true;
    this._pane = pane;
  }

  private _pane: Pane;

  public get pane() {
    return this._pane;
  }
}
