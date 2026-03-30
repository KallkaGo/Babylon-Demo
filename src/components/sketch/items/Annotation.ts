import RenderMgr from '@/components/mgr/RenderMgr';
import type { IUpdate } from '@/components/mgr/types';
import UpdateMgr from '@/components/mgr/UpdateMgr';
import {
  ArcRotateCamera,
  Matrix,
  Ray,
  Scene,
  Sprite,
  SpriteManager,
  Vector3,
  type Nullable,
  Observable,
  AbstractMesh,
  Mesh,
  PickingInfo,
  TransformNode,
  GPUPicker,
  CreateSphere,
  type IVector2Like,
  type IGPUPickingInfo,
  PBRMaterial,
  Scalar,
  type IVector3Like,
} from '@babylonjs/core';
import { fixRotationAngle } from '@utils/tools';
import { nanoid } from 'nanoid';
import gsap from 'gsap';
import BoneQueryHelper from '@utils/BoneQueryHelper';

export interface IBasicSprite {
  uuid: string;
  index: number;
  screenPosition: [number, number, number];
  hasDom: boolean;
  mode: IMode;
  domVisible: boolean;
  cameraInfo: {
    position: [number, number, number];
    alpha: number;
    beta: number;
    radius: number;
  };
  skinned: boolean;
}

export interface ISprite extends IBasicSprite {
  sprite: Nullable<Sprite>;
  transformBox: TransformNode;
}

interface ISpriteserialize extends IBasicSprite {
  transformPosition: [number, number, number];
  parentName?: string;
}

interface IEventNameMap {
  create: Observable<Partial<IBasicSprite>>;
  foucs: Observable<Partial<IBasicSprite>>;
  blur: Observable<Partial<IBasicSprite>>;
  remove: Observable<Partial<IBasicSprite>>;
  removeAll: Observable<Partial<IBasicSprite>>;
  //TODO: 新增事件
}

type IMode = 'sprite' | 'dom';

let frameCount = 0;
const UPDATEINTERVAL = 4;
const MAXALPHA = 1;
const MINALPHA = 0.4;

class Annotation implements IUpdate {
  private static __ins: Nullable<Annotation>;

  public static get shared() {
    if (!this.__ins) {
      this.__ins = new Annotation();
    }

    return this.__ins;
  }
  constructor() {
    this.uuid = nanoid();

    this._eventMap = new Map();
    this._eventMap.set('create', new Observable<Partial<IBasicSprite>>());
    this._eventMap.set('foucs', new Observable<Partial<IBasicSprite>>());
    this._eventMap.set('blur', new Observable<Partial<IBasicSprite>>());
    this._eventMap.set('remove', new Observable<Partial<IBasicSprite>>());
    this._eventMap.set('removeAll', new Observable<Partial<IBasicSprite>>());
    this._spriteList = [];
    this.currentIndex = 0;
    this._size = 1.5;

    this.detectedList = [];

    this.picker = new GPUPicker();

    this.baseSphere = CreateSphere(
      'baseSphere',
      {
        diameter: 0.1,
        segments: 10,
      },
      this.scene
    );

    const sphereMaterial = new PBRMaterial('sphereMaterial', this.scene);
    sphereMaterial.unlit = true;
    sphereMaterial.alpha = 0;
    this.baseSphere.material = sphereMaterial;

    this._annotaionInfoObserver = new Observable();

    UpdateMgr.shared.reg(this);
  }

  public uuid: string;

  private _maxCount!: number;

  private _eventMap: Map<keyof IEventNameMap, IEventNameMap[keyof IEventNameMap]>;

  private spriteManager!: SpriteManager;

  private _spriteList: Array<ISprite>;

  private currentIndex: number;

  private scene!: Scene;

  private camera!: ArcRotateCamera;

  private _size: number;

  private _annotaionInfoObserver: Observable<IBasicSprite[]>;

  private picker: GPUPicker;

  private detectedList: Array<AbstractMesh>;

  private baseSphere: Mesh;

  get maxCount() {
    return this._maxCount;
  }

  get size() {
    return this._size;
  }

  set size(value: number) {
    this._size = value;
  }

  get spriteList() {
    return this._spriteList;
  }

  get annotaionInfoObserver() {
    return this._annotaionInfoObserver;
  }

  /* 注册事件 */
  public registerEvent<K extends keyof IEventNameMap>(name: K, callBack: (payload: Partial<IBasicSprite>) => void) {
    const observable = this._eventMap.get(name);
    observable && observable.add(callBack);
  }

  /* 用于通知ui层的事件派发器 */
  public dispatchEvent<K extends keyof IEventNameMap>(name: K, payload: Partial<IBasicSprite> = {}) {
    const observable = this._eventMap.get(name);
    observable && observable.notifyObservers(payload);
  }

  public init(name = 'Annotation', imgUrl: string, capacity: number, cellSize: any, scene: Scene, camera: ArcRotateCamera) {
    this.scene = scene;

    this.camera = camera;
    this.currentIndex = 0;
    this._maxCount = capacity;
    this.spriteManager = new SpriteManager(name, imgUrl, capacity, cellSize, scene);
    this.spriteManager.isPickable = true;
    this.spriteManager.renderingGroupId = 1;
  }

  public foucs(pickMesh: Sprite) {
    const sprite = this.spriteList.find((item) => item.sprite === pickMesh);
    if (!sprite) {
      console.error('没有找到对应的sprite');
      return;
    }
    this.dispatchEvent('foucs', sprite);

    this.Lerp2Annotation(sprite);
  }

  public blur() {
    this.dispatchEvent('blur');
  }

  public serialize() {
    return this.spriteList.map((item) => ({
      uuid: item.uuid,
      cameraInfo: item.cameraInfo,
      screenPosition: item.screenPosition,
      index: item.index,
      domVisible: item.domVisible,
      hasDom: item.hasDom,
      mode: item.mode,
      transformPosition: item.transformBox.position.asArray(),
      parentName: item.transformBox.parent?.id + ';' + item.transformBox.parent?.parent?.id,
      skinned: item.skinned,
    }));
  }
  public unserialize(metaData: Array<ISpriteserialize>) {
    const { baseSphere, picker, scene, detectedList, spriteList } = this;
    for (let i = 0; i < metaData.length; i++) {
      const mode = metaData[i].mode;
      const index = metaData[i].index;
      const skinned = metaData[i].skinned;
      const transformBoxPosition = new Vector3().fromArray(metaData[i].transformPosition);
      const parentName = metaData[i].parentName;
      const cameraInfo = metaData[i].cameraInfo;
      const annotation = this.createAnnotation(transformBoxPosition, mode);
      const transformBox = new TransformNode('transformBox');
      const uuid = metaData[i].uuid;

      let setPosition = () => {
        transformBox.position.copyFrom(transformBoxPosition);
      };

      const detectMesh = baseSphere.clone(`sprite-${index}`);

      const pickingList = scene.meshes.filter((mesh) => mesh.isPickable);
      picker.setPickingList([...pickingList]);
      if (skinned) {
        let _linkedTransformNode = scene.transformNodes.find((item) => {
          const [pId, ppId] = parentName!.split(';');
          return pId === item?.id && ppId === item?.parent?.id;
        });
        if (!_linkedTransformNode) {
          let eventInstace = scene.onNewTransformNodeAddedObservable.add((node) => {
            const [pId, ppId] = parentName!.split(';');
            if (pId === node.id && ppId === node.parent?.id) {
              scene.onNewTransformNodeAddedObservable.remove(eventInstace);
              _linkedTransformNode = node;
              _linkedTransformNode.addChild(transformBox);
              setPosition();
            }
          });
        } else {
          _linkedTransformNode.addChild(transformBox);
          setPosition();
        }
      } else {
        let _mesh = scene.meshes.find((item) => {
          const [pId, ppId] = parentName!.split(';');
          return pId === item?.id && ppId === item?.parent?.id;
        });
        if (!_mesh) {
          let eventInstace = scene.onNewMeshAddedObservable.add((node) => {
            const [pId, ppId] = parentName!.split(';');
            if (pId === node.id && ppId === node.parent?.id) {
              scene.onNewMeshAddedObservable.remove(eventInstace);
              _mesh = node;
              _mesh.addChild(transformBox);
              setPosition();
            }
          });
        } else {
          _mesh?.addChild(transformBox);
          setPosition();
        }
      }

      const data: ISprite = {
        uuid,
        sprite: annotation,
        index,
        hasDom: false,
        mode,
        cameraInfo: cameraInfo,
        screenPosition: Vector3.Zero().asArray(),
        transformBox,
        skinned,
        domVisible: true,
      };
      spriteList.push(data);
      detectedList.push(detectMesh);
      this.currentIndex++;

      const excludedKeys = ['sprite', 'transformBox'];

      const eventData = Object.fromEntries(Object.entries(data).filter(([key]) => !excludedKeys.includes(key))) as IBasicSprite;

      this.dispatchEvent('create', eventData);
    }
  }

  public create(pos: Vector3, pickInfo: PickingInfo, mode: IMode = 'sprite') {
    const { spriteList, detectedList, baseSphere, scene, picker, camera } = this;

    const annotation = this.createAnnotation(pos, mode);

    const validateSkinning = (pickInfo.pickedMesh as Mesh).validateSkinning();
    const transformBox = new TransformNode('transformBox');
    transformBox.position.copyFrom(pos);

    const detectMesh = baseSphere.clone(`sprite-${this.currentIndex}`);

    const pickingList = scene.meshes.filter((mesh) => mesh.isPickable);
    picker.setPickingList([...pickingList]);

    if (validateSkinning.skinned) {
      const boneQueryHelper = new BoneQueryHelper(pickInfo.pickedMesh as Mesh);
      const bone = boneQueryHelper.getDominantBoneForFace(pickInfo.faceId);
      bone._linkedTransformNode?.addChild(transformBox);
    } else {
      pickInfo.pickedMesh!.addChild(transformBox);
    }
    const data: ISprite = {
      uuid: nanoid(),
      sprite: annotation,
      index: this.currentIndex,
      hasDom: false,
      mode,
      cameraInfo: {
        position: camera.position.asArray(),
        alpha: camera.alpha,
        beta: camera.beta,
        radius: camera.radius,
      },
      screenPosition: Vector3.Zero().asArray(),
      transformBox,
      skinned: validateSkinning.skinned,
      domVisible: true,
    };

    detectedList.push(detectMesh);
    spriteList.push(data);
    this.currentIndex++;

    const excludedKeys = ['sprite', 'transformBox'];

    const eventData = Object.fromEntries(Object.entries(data).filter(([key]) => !excludedKeys.includes(key))) as IBasicSprite;

    this.dispatchEvent('create', eventData);
    return data;
  }

  public getSpriteByUUID(uuid: string) {
    return this.spriteList.find((item) => item.uuid === uuid);
  }

  public Lerp2Annotation(annotation: IBasicSprite, onfinsh?: Function) {
    const { camera } = this;
    const targetCameraData = annotation.cameraInfo;
    const fixangle = fixRotationAngle(targetCameraData.alpha, camera.alpha);
    const timeline = gsap.timeline();

    const [x, y, z] = targetCameraData.position;

    timeline
      .to(camera, {
        alpha: fixangle,
        beta: targetCameraData.beta,
        radius: targetCameraData.radius,
        duration: 0.34,
        ease: 'power1.inOut',
      })
      .to(
        camera.position,
        {
          x,
          y,
          z,
          duration: 0.34,
          ease: 'power1.inOut',
        },
        0
      )
      .eventCallback('onComplete', () => {
        onfinsh && onfinsh();
      });
  }

  public remove(index: number) {
    const { spriteList, detectedList } = this;
    const sprite = spriteList[index]?.sprite;
    sprite?.dispose();
    const detectMesh = detectedList[index];
    detectMesh.dispose();

    spriteList.splice(index, 1);
    detectedList.splice(index, 1);

    spriteList.forEach((item, i) => {
      item.index = i;
      if (item.sprite) item.sprite.cellIndex = i;
    });

    detectedList.forEach((item, i) => {
      item.name = `detect-${i}`;
    });

    this.currentIndex--;
    this.dispatchEvent('remove');
  }

  public removeAll() {
    const { spriteList, detectedList } = this;
    spriteList.forEach((item) => item?.sprite?.dispose());
    spriteList.splice(0, spriteList.length);
    detectedList.forEach((item) => item.dispose());
    detectedList.splice(0, detectedList.length);
    this.currentIndex = 0;
    this.dispatchEvent('removeAll');
  }

  private createAnnotation(pos: Vector3, mode: IMode) {
    if (mode === 'dom') return null;
    const { spriteManager, currentIndex } = this;
    const annotation = new Sprite(`sprite-${currentIndex}`, spriteManager!);
    annotation.position.copyFrom(pos);
    annotation.cellIndex = currentIndex;
    annotation.isPickable = true;

    return annotation;
  }

  private async handlePick(positionList: IVector2Like[], dt: number) {
    const { picker, detectedList, spriteList } = this;
    const result = await picker.multiPickAsync(positionList);
    const nameList = result?.meshes.map((item) => item?.name);
    if (nameList) {
      detectedList.forEach((item, index) => {
        const curPickMeshName = nameList[index];
        if (spriteList[index].sprite) {
          const alpha = spriteList[index].sprite.color.a;
          if (item.name === curPickMeshName) {
            spriteList[index].sprite.color.a = Scalar.Lerp(alpha, MAXALPHA, dt * 15);
          } else {
            spriteList[index].sprite.color.a = Scalar.Lerp(alpha, MINALPHA, dt * 15);
          }
        } else {
          // TODO:css透明度控制
          if (item.name === curPickMeshName) {
            spriteList[index].domVisible = true;
          } else {
            spriteList[index].domVisible = false;
          }
        }
      });
    }
  }

  update(dt: number): void {}
  updateBefore(dt: number): void {
    const { spriteList, scene, camera, size, detectedList } = this;

    /* 计算viewport  */
    const canvas = RenderMgr.shared.canvas!;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const viewPort = this.camera.viewport.toGlobal(width, height);

    const xy: IVector2Like[] = [];

    spriteList.forEach((item, index) => {
      const { sprite } = item;

      const virtualBox = item.transformBox;
      const worldPosition = virtualBox.getAbsolutePosition();

      if (sprite) {
        const spritePosition = sprite.position;
        const cameraPosition = camera.position;
        const distance = cameraPosition.subtract(spritePosition).length();
        sprite.size = distance * 0.02 * size;

        sprite.position.copyFrom(worldPosition);
      }

      detectedList[index].position.copyFrom(worldPosition);

      const screenPosition = Vector3.Project(worldPosition, Matrix.Identity(), scene.getTransformMatrix(), viewPort);

      item.screenPosition = screenPosition.asArray();

      const x = screenPosition.x >> 0;
      const y = screenPosition.y >> 0;

      xy.push({ x, y });
    });
    if (frameCount % UPDATEINTERVAL === 0) {
      /* gpu pick */
      this.handlePick(xy, dt);
    }
    frameCount++;
    this.annotaionInfoObserver.notifyObservers(
      spriteList.map((item) => ({
        uuid: item.uuid,
        cameraInfo: item.cameraInfo,
        screenPosition: item.screenPosition,
        index: item.index,
        domVisible: item.domVisible,
        hasDom: item.hasDom,
        mode: item.mode,
        skinned: item.skinned,
      }))
    );
  }
  updateAfter(dt: number): void {}
}

export default Annotation;
