import type { Asset } from '@/components/mgr/LoadMgr';
import { getRootNode } from '@utils/tools';
import RES from './RES';
import { ArcRotateCamera, AssetContainer, HemisphericLight, Mesh, Vector2, Vector3 } from '@babylonjs/core';
import { Inspector } from '@babylonjs/inspector';
import PopMgr from '@/components/mgr/PopMgr';
import { GameSkecth } from '../../GameSketch';
import { EStageID } from '@/components/enum/Enum';
import Annotation, { type IBasicSprite } from '@/components/sketch/items/Annotation';
import type AnnotationPop from '@/components/ui/pop/annotationPop/AnnotationPop';
import PanelMgr from '@/components/mgr/PanelMgr';
import PaneMgr from '@/components/mgr/PaneMgr';
import gsap from 'gsap';
import type MarkPop from '@/components/ui/pop/markPop/MarkPop';
import type { FolderApi, Pane } from 'tweakpane';

const json = [
  {
    uuid: 'G_KBqNn6A7gPJBaOU92sk',
    cameraInfo: { position: [2.8281715617105765, 3.222549035974549, 7.6561493799606], alpha: 1.2169454131185409, beta: 1.1947525777837549, radius: 8.774964387392123 },
    screenPosition: [920.3092779961156, 418.7661507015022, 0.9873340418386236],
    index: 0,
    domVisible: true,
    hasDom: false,
    mode: 'sprite',
    transformPosition: [-77.95133972167969, 70.28502655029297, -9.742926597595215],
    parentName: 'car_body_body_0;car_body',
    skinned: false,
  },
  {
    uuid: 'WPZ_rKwhO8HuBt7s9Ay7H',
    cameraInfo: { position: [-7.491446539533028, 3.356239564781356, 3.100626505904069], alpha: 2.749170727403412, beta: 1.1783185157837555, radius: 8.774964387392123 },
    screenPosition: [1184.4803150177515, 353.2636017839367, 0.9884212263867054],
    index: 1,
    domVisible: false,
    hasDom: false,
    mode: 'dom',
    transformPosition: [-0.9748210906982422, 7.326999187469482, 21.7093505859375],
    parentName: 'back_door_body_0;back_door',
    skinned: false,
  },
];
/* Debug Ui */
// const par = {
//   mode: 'sprite',
// };

// const pane = PaneMgr.shared.pane;
// const folder = pane.addFolder({ title: 'annotation', expanded: true });
// pane.addBinding(par, 'mode', { options: { sprite: 'sprite', dom: 'dom' } });

class SecondSketch extends GameSkecth {
  constructor() {
    super(EStageID.SECOND);

    this.pane = PaneMgr.shared.pane;

    this.folder = this.pane.addFolder({ title: 'annotation', expanded: true });

    this.lastClickTime = 0;

    this.clickCount = 0;

    this.doubleClickDelay = 300;

    this.addLight();

    this.bindAssets(RES);

    this.annotationDomList = [];

    this.markDomList = [];

    location.hash.includes('debug') && Inspector.Show(this.scene, {});
  }

  private pane: Pane;

  private folder: FolderApi;

  private car!: AssetContainer;

  private robot!: AssetContainer;

  private lastClickTime;
  private clickCount;
  private doubleClickDelay; // 双击最大时间间隔

  private annotationDomList: Array<AnnotationPop>;

  private markDomList: Array<MarkPop>;

  private addLight() {
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.25;
    const light2 = new HemisphericLight('light2', new Vector3(0, -1, 0), this.scene);
    light2.intensity = 0.25;
  }

  private regPick() {
    const { scene, folder, pane } = this;
    const params = {
      downPos: new Vector2(),
      curPos: new Vector2(),
      down: false,
      isMove: false,
      mode: 'sprite',
    };

    pane.addBinding(params, 'mode', { options: { sprite: 'sprite', dom: 'dom' } });



    scene.onPointerDown = (evt) => {
      params.down = true;
      params.isMove = false;
      params.curPos.set(evt.offsetX, evt.offsetY);
      params.downPos.set(evt.offsetX, evt.offsetY);
    };

    scene.onPointerMove = (evt) => {
      if (!params.down) return;
      const { curPos, downPos } = params;
      curPos.set(evt.offsetX, evt.offsetY);
      const distance = Vector2.Distance(curPos, downPos);
      if (distance > 2) {
        params.isMove = true;
      }
    };

    scene.onPointerUp = (_) => {
      params.down = false;
      const curPos = params.curPos;

      const currentTime = new Date().getTime();

      const spritePickInfo = scene.pickSprite(curPos.x, curPos.y);

      const spriteList = Annotation.shared.spriteList;

      if (spritePickInfo?.hit) {
        const res = spriteList.find((item) => spritePickInfo.pickedSprite === item.sprite);

        const randomColor = `hsl(${Math.random() * 360}, 70%, 60%)`;

        if (!res?.hasDom && res?.mode === 'sprite') {
          PopMgr.shared
            .show('annotation', {
              color: randomColor,
            })
            .then((pop) => {
              pop.userData.annotation = res;
              this.annotationDomList.push(pop);
            });

          res!.hasDom = true;
        }

        /* 当前active的sprite改变颜色 不用管dom是否创建*/
        res?.sprite?.color.set(0.25, 0.52, 0.95, 1);

        this.annotationDomList.forEach((item) => {
          if (item.userData.annotation !== res) {
            gsap.set(item.el, { pointerEvents: 'none' });
            gsap.to(item.el, {
              opacity: 0,
              duration: 0.34,
              ease: 'power1.inOut',
            });
            item.userData.annotation.sprite?.color.set(1, 1, 1, 1);
          } else {
            gsap.set(item.el, { pointerEvents: 'auto' });
            gsap.to(item.el, {
              opacity: 1,
              duration: 0.34,
              ease: 'power1.inOut',
            });
          }
        });
        Annotation.shared.Lerp2Annotation(res!);
        Annotation.shared.dispatchEvent('foucs');
        return;
      } else {
        this.annotationDomList.forEach((item, _) => {
          gsap.set(item.el, { pointerEvents: 'none', opacity: 0 });
        });
        Annotation.shared.dispatchEvent('blur');
        spriteList.forEach((item) => {
          // TODO spirte 和 dom逻辑区分
          if (item.sprite) {
            const alpha = item.sprite.color.a;
            item.sprite.color.set(1, 1, 1, alpha);
          }
        });
      }

      // 判断是否为第一次点击或超过双击时间间隔
      if (this.clickCount === 0 || currentTime - this.lastClickTime > this.doubleClickDelay) {
        this.clickCount = 1;
        this.lastClickTime = currentTime;
        params.down = false;
        return;
      }

      // 如果是第二次点击且在时间间隔内
      if (this.clickCount === 1 && currentTime - this.lastClickTime <= this.doubleClickDelay) {
        params.down = false;
        for (const mesh of this.world.getChildMeshes()) {
          const validateSkinning = (mesh as Mesh).validateSkinning();
          if (validateSkinning.skinned) {
            (mesh as Mesh).refreshBoundingInfo(true);
          }
        }

        const pickInfo = scene.pick(curPos.x, curPos.y);

        if (pickInfo.hit && folder.children.length < Annotation.shared.maxCount) {
          Annotation.shared.create(pickInfo.pickedPoint!, pickInfo, params.mode as 'sprite' | 'dom');
        }

        // 重置点击状态
        this.clickCount = 0;
        this.lastClickTime = 0;
      }
    };
  }

  private handleMark() {
    const { markDomList } = this;
    Annotation.shared.annotaionInfoObserver.add((info) => {
      const domInfoList = info.filter((item) => item.mode === 'dom');
      markDomList.forEach((mark) => {
        const metaData = domInfoList.find((dom) => dom.uuid === mark.userData.annotation.uuid);
        if (metaData) {
          const [x, y] = metaData!.screenPosition!;
          const isVisible = metaData!.domVisible;
          const offsetX = x;
          const offsetY = y;
          mark.el.style.transform = `translateX(calc(${offsetX}px - 50%)) translateY(calc(${offsetY}px - 50%))`;
          mark.el.style.opacity = isVisible ? '1' : '0.4';
        }
      });
    });
  }

  private setupAnnotation() {
    const { assets, pane, folder } = this;
    pane.addButton({ title: 'serialize' }).on('click', () => {
      console.log(JSON.stringify(Annotation.shared.serialize()));
    });
    const spriteImageUrl = assets.get('spriteTex')?.src as string;
    Annotation.shared.init('Annotation', spriteImageUrl, 10, 50, this.scene, this.camera as ArcRotateCamera);
    Annotation.shared.registerEvent('create', (e) => {
      this.addDebug(e as IBasicSprite, folder);
    });
  }

  private addDebug(metaData: IBasicSprite, folder: FolderApi) {
    const spriteData = Annotation.shared.getSpriteByUUID(metaData.uuid)!;
    const event = () => {
      if (!spriteData.hasDom) {
        PopMgr.shared.show('annotation').then((annotation) => {
          annotation.userData.annotation = spriteData;
          this.annotationDomList.push(annotation);
          spriteData.hasDom = true;
        });
      }
      this.annotationDomList.forEach((item) => {
        if (item.userData.annotation !== spriteData) {
          gsap.set(item.el, { pointerEvents: 'none' });
          gsap.to(item.el, {
            opacity: 0,
            duration: 0.34,
            ease: 'power1.inOut',
          });
        } else {
          gsap.set(item.el, { pointerEvents: 'auto' });
          gsap.to(item.el, {
            opacity: 1,
            duration: 0.34,
            ease: 'power1.inOut',
          });
        }
      });

      Annotation.shared.Lerp2Annotation(spriteData);
    };
    if (spriteData) {
      if (spriteData.mode === 'dom') {
        PopMgr.shared.show('mark').then((pop) => {
          pop.userData.annotation = spriteData;
          this.markDomList.push(pop);
          pop.el.addEventListener('pointerup', event);
        });
      }

      const btn = folder.addButton({
        title: 'Clear',
        label: `annotation-${metaData.index + 1}`,
      });

      btn.on('click', () => {
        Annotation.shared.remove(spriteData.index);

        const i = this.annotationDomList.findIndex((item) => item.userData.annotation.uuid === spriteData.uuid);
        const annotation = this.annotationDomList[i];
        if (annotation) {
          PopMgr.shared.hide('annotation', annotation.uuid);
          this.annotationDomList.splice(i, 1);
        }

        const j = this.markDomList.findIndex((item) => item.userData.annotation.uuid === spriteData.uuid);
        const mark = this.markDomList[j];
        if (mark) {
          PopMgr.shared.hide('mark', mark.uuid);
          this.markDomList.splice(j, 1);
        }
        btn.dispose();
        folder.children.forEach((item, index) => {
          (item as any).label = `annotation-${index + 1}`;
        });
      });
    }
  }

  update(dt: number): void {
    super.update(dt);
  }
  updateBefore(dt: number): void {
    super.updateBefore(dt);
    /* 排序 多标注同时显示时遮挡处理 */
    // this.annotationDomList.sort((a, b) => b.userData.annotation.screenPosition.z - a.userData.annotation.screenPosition.z);
    this.annotationDomList.forEach((item, index) => {
      const annotation = item.userData.annotation;
      if (annotation.screenPosition) {
        const [x, y] = annotation.screenPosition;
        const offsetX = x;
        const offsetY = y;
        const zIndex = index;
        const gapx = 10;
        const gapy = 20;

        item.el.style.transform = `translateX(${offsetX + gapx}px) translateY(calc(${offsetY - gapy}px - 100%))`;
        // item.el.style.left = `${offsetX + gapx}px`;
        // item.el.style.top = `${offsetY - gapy}px`;
        // item.el.style.zIndex = `${zIndex}`;
      }
    });
  }

  updateAfter(dt: number): void {
    super.updateAfter(dt);
  }
  onLoad(asset: Asset): void {
    super.onLoad(asset);
    switch (asset.type) {
      case 'gltf':
        const gltfContainer = asset.data!;

        if (asset.name === 'car') {
          const root = getRootNode(gltfContainer);
          root.parent = this.world;
          root.scaling.setAll(0.01);
          this.car = gltfContainer;
          gltfContainer.addToScene();
          return;
        }

        if (asset.name === 'robot') {
          const root = getRootNode(gltfContainer);
          root.position.x = 3;
          root.parent = this.world;
          root.scaling.setAll(0.001);
          this.robot = gltfContainer;
          gltfContainer.addToScene();
          return;
        }

        break;
      case 'cube':
        const cubeTexture = asset.data!;
        if (asset.name === 'skybox') {
          this.scene.createDefaultSkybox(cubeTexture, false, 1000, 0, true);
          return;
        }

        break;
      case 'texture':
        const texture = asset.data!;
        if (asset.name === 'spriteTex') {
        }

        break;
    }
  }
  onLoadComplete(): void {
    super.onLoadComplete();
    console.log('onLoadComplete');
    PanelMgr.shared.hide('load').then(() => {
      PaneMgr.shared.pane.hidden = false;
    });
    this.setupAnnotation();
    this.regPick();
    Annotation.shared.unserialize(json as any);
    this.handleMark();
  }
}

export default SecondSketch;
