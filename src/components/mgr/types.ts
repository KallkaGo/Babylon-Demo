import type { Asset } from './LoadMgr';

export interface IUnit {
  uuid: string;
}

export interface IUpdate extends IUnit {
  update(dt: number): void;
  updateBefore(dt: number): void;
  updateAfter(dt: number): void;
}

export interface ILoadListener extends IUnit {
  onLoad: (asset: Asset) => void;
  onLoadComplete: () => void;
}

export interface IResize extends IUnit {
  onResize(width: number, height: number): void;
}
