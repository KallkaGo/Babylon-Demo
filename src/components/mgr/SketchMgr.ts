import { EStageID } from '../enum/Enum';
import FirstSketch from '../sketch/stage/game/one/FirstSketch';
import type Sketch from '../sketch/Sketch';
import SecondSketch from '../sketch/stage/game/two/SecondSketch';
import IntroSketch from '../sketch/stage/game/intro/IntroSketch';
import MatListSketch from '../sketch/stage/game/matlist/MatListSketch';
import SSSSketch from '../sketch/stage/game/sss/SSSSketch';
import FastSSSkecth from '../sketch/stage/game/fastsss/FastSSSSketch';
import Phkecth from '../sketch/stage/game/Ed/EdSketch';
import FixedEnvSketch from '../sketch/stage/game/fixEnv/FixedEnvSketch';
import DiamondSketch from '../sketch/stage/game/diamond/DiamondSketch';

export default class SketchMgr {
  private static __ins: SketchMgr;
  public static get shared() {
    if (!this.__ins) {
      this.__ins = new SketchMgr();
    }
    return this.__ins;
  }

  constructor() {
    this.classMap = new Map();
  }

  private classMap: Map<EStageID, new () => Sketch>;

  private _sceneId: EStageID = EStageID.FIRST;
  public get sceneId() {
    return this._sceneId;
  }

  public init(): void {
    this.classMap.set(EStageID.FIRST, FirstSketch);
    this.classMap.set(EStageID.SECOND, SecondSketch);
    this.classMap.set(EStageID.INTRO, IntroSketch);
    this.classMap.set(EStageID.MATLIST, MatListSketch);
    this.classMap.set(EStageID.SSS, SSSSketch);
    this.classMap.set(EStageID.FASTSSS, FastSSSkecth);
    this.classMap.set(EStageID.ED, Phkecth);
    this.classMap.set(EStageID.FIXEDENV, FixedEnvSketch);
    this.classMap.set(EStageID.DIAMOND, DiamondSketch);
  }

  create(stageId: EStageID) {
    if (this.classMap.has(stageId)) {
      this._sceneId = stageId;
      const Sketch = this.classMap.get(stageId)!;
      const sketch = new Sketch();
      return sketch;
    }

    return undefined;
  }
}
