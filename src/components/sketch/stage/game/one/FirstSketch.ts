import {
  AbstractMesh,
  ArcRotateCamera,
  AssetContainer,
  Camera,
  Color3,
  GPUPicker,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  TransformNode,
  Vector2,
  Vector3,
  type Nullable,
} from '@babylonjs/core';
import type { Asset } from '../../../../mgr/LoadMgr';
import RES from './RES';
import Sketch from '../../../Sketch';
import RenderMgr from '../../../../mgr/RenderMgr';
import ResizeMgr from '../../../../mgr/ResizeMgr';
import { Inspector } from '@babylonjs/inspector';
import UpdateMgr from '../../../../mgr/UpdateMgr';
import { OutLineEffect } from '../../../effect/Outline';
import ContactShadow from '../../../effect/ContactShadow';
import PanelMgr from '../../../../mgr/PanelMgr';
import PaneMgr from '@/components/mgr/PaneMgr';
import { getRootNode } from '@utils/tools';
import { GameSkecth } from '../../GameSketch';
import { EStageID } from '@/components/enum/Enum';

interface IShadowList {
  mesh: AbstractMesh | AssetContainer;
  name: string;
}

class FirstSkecth extends GameSkecth {
  constructor() {
    super(EStageID.FIRST);
    this.bindAssets(RES);

    this.addLight();

    this.addMesh();

    location.hash.includes('debug') && Inspector.Show(this.scene, {});
  }

  private time: number = 0;

  private cube: Nullable<Mesh> = null;
  private torus: Nullable<Mesh> = null;
  private ico: Nullable<Mesh> = null;
  private ground: Nullable<Mesh> = null;
  private glass!: AssetContainer;
  private people!: AssetContainer;
  private sapphy!: AssetContainer;
  private car!: AssetContainer;

  private contactShadowList: Array<IShadowList> = [];

  private addLight() {
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.25;
    const light2 = new HemisphericLight('light2', new Vector3(0, -1, 0), this.scene);
    light2.intensity = 0.25;
  }

  private addMesh() {
    this.scene.ambientColor = new Color3(1, 1, 1);
    const cube = MeshBuilder.CreateBox('box', { size: 1 }, this.scene);
    cube.position.x = 1.5;
    cube.position.y = 1.0;
    cube.position.z = 3;
    const cubeMaterial = new PBRMaterial('cubeMaterial', this.scene);
    cubeMaterial.albedoColor = Color3.FromHexString('#FFA500');
    cubeMaterial.metallic = 0;
    cubeMaterial.roughness = 1;
    cube.material = cubeMaterial;

    const torus = MeshBuilder.CreateTorusKnot('torus', { radialSegments: 256, radius: 3, p: 1, q: 5 });
    torus.scaling.setAll(1 / 3);
    torus.position.x = -1.2;
    torus.position.y = 1.8;
    const torusMaterial = new PBRMaterial('torusMaterial', this.scene);
    torusMaterial.albedoColor = Color3.FromHexString('#FF69B4');
    torusMaterial.metallic = 0;
    torusMaterial.roughness = 1;
    torus.material = torusMaterial;

    const ico = MeshBuilder.CreateIcoSphere('ico', { radius: 0.5, subdivisions: 1 }, this.scene);
    ico.position.z = -3;
    ico.position.y = 1;
    const icoMaterial = new PBRMaterial('icoMaterial', this.scene);
    icoMaterial.albedoColor = new Color3(1, 0, 1);
    icoMaterial.metallic = 0;
    icoMaterial.roughness = 1;
    ico.material = icoMaterial;

    const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, this.scene);

    const groundMaterial = new PBRMaterial('groundMaterial', this.scene);
    groundMaterial.albedoColor = new Color3(1, 1, 1);
    groundMaterial.backFaceCulling = false;
    groundMaterial.metallic = 0;
    groundMaterial.roughness = 1;
    ground.material = groundMaterial;
    ground.position.y = -0.1;
    ground.setEnabled(false);

    this.cube = cube;
    this.torus = torus;
    this.ico = ico;
    this.ground = ground;
  }

  private addOutlineEffect() {
    const outline = new OutLineEffect(this.scene, this.camera);

    const pickList = this.scene.meshes.filter((mesh) => mesh.isPickable);

    outline.setPickedList(pickList);

    outline.createPaneByMesh(this.car, 'car');

    outline.createPaneByMesh(this.sapphy, 'sapphy');

    this.regPick(outline, pickList);
    return outline;
  }

  private addContactShadow() {
    const { contactShadowList, scene } = this;
    contactShadowList.forEach((item) => {
      const { mesh, name } = item;
      const shadow = new ContactShadow(mesh, scene, name);
    });
  }

  private regPick(outline: OutLineEffect, pickList: AbstractMesh[] = []) {
    const { scene } = this;
    const params = {
      downPos: new Vector2(),
      curPos: new Vector2(),
      down: false,
      isMove: false,
    };
    const pane = PaneMgr.shared.pane;
    const folder = pane.addFolder({ title: 'PickMode', expanded: false });
    const mode = folder.addBlade({
      view: 'list',
      label: 'PickMode',
      options: [
        { text: 'SINGLE', value: 0 },
        { text: 'CONNECT', value: 1 },
      ],
      value: 0,
    });

    const btn = folder.addButton({
      title: 'Clear',
    });

    btn.on('click', () => {
      outline.clear();
    });

    const picker = new GPUPicker();

    picker.setPickingList(pickList);

    /*  让其初始化一次减少卡顿*/
    picker.pickAsync(scene.pointerX, scene.pointerY).then((_) => {});

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

    scene.onPointerUp = (evt) => {
      params.down = false;
      if (picker.pickingInProgress || params.isMove) return;
      const curPos = params.curPos;
      picker.pickAsync(curPos.x, curPos.y).then((result) => {
        const pickedMesh = result?.mesh;
        if (pickedMesh) {
          const state = mode.exportState();
          if (state.value === 1) {
            const meshList = pickedMesh.material?.getBindedMeshes();
            meshList?.forEach((mesh) => outline.addSelection(mesh));
          } else {
            outline.addSelection(pickedMesh);
          }
        }
      });
    };
  }

  updateBefore(dt: number): void {
    super.updateBefore(dt);
  }

  update(dt: number): void {
    super.update(dt);

    this.time += dt;
    const { torus, cube, ico } = this;
    torus!.rotation.x += dt * 0.1;
    torus!.rotation.y += dt * 0.2;
    torus!.rotation.z += dt * 0.2;
    cube!.rotation.x += dt * 0.1;
    cube!.rotation.y += dt * 0.2;
    cube!.rotation.z += dt * 0.1;
    ico!.rotation.x += dt;
    ico!.rotation.y += dt * 0.1;
    ico!.rotation.z += -dt * 0.1;
  }

  updateAfter(dt: number): void {
    super.updateAfter(dt);
  }
  onLoad(asset: Asset): void {
    super.onLoad(asset);
    switch (asset.type) {
      case 'gltf':
        const gltfContainer = asset.data!;
        if (asset.name === 'magicGlass') {
          const root = getRootNode(gltfContainer);
          /* 
          setParent():局部位置 = 世界位置 - 父节点世界位置
          */
          root.parent = this.world;
          root.scaling.setAll(0.2);
          root.position.set(2, 1, -2);
          this.glass = gltfContainer;
          gltfContainer.addToScene();
          return;
        }
        if (asset.name === 'people') {
          const root = getRootNode(gltfContainer);
          const animation = gltfContainer.animationGroups[0];
          animation.speedRatio = 0.5;
          root.parent = this.world;
          this.people = gltfContainer;
          this.contactShadowList.push({
            mesh: gltfContainer,
            name: asset.name,
          });
          gltfContainer.addToScene();
          return;
        }

        if (asset.name === 'sapphy') {
          const root = getRootNode(gltfContainer);
          root.parent = this.world;
          root.rotation.y = Math.PI;
          root.position.x = 3;
          root.scaling.setAll(1.5);
          this.sapphy = gltfContainer;
          this.contactShadowList.push({
            mesh: gltfContainer,
            name: asset.name,
          });
          gltfContainer.addToScene();
          return;
        }

        if (asset.name === 'car_911') {
          const root = getRootNode(gltfContainer);
          root.parent = this.world;
          root.position.x = -4;
          this.car = gltfContainer;
          this.contactShadowList.push({
            mesh: gltfContainer,
            name: asset.name,
          });
          gltfContainer.addToScene();
          return;
        }

        if (asset.name === 'car2') {
          const root = getRootNode(gltfContainer);
          root.parent = this.world;
          root.position.x = -4;
          root.scaling.setAll(0.005);
          this.car = gltfContainer;
          gltfContainer.addToScene();
          return;
        }

        if (asset.name === 'npcOrange') {
          const root = getRootNode(gltfContainer);
          root.parent = this.world;
          root.position.x = -4;
          root.position.z = -4;
          this.contactShadowList.push({
            mesh: gltfContainer,
            name: asset.name,
          });
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
    }
  }
  onLoadComplete(): void {
    super.onLoadComplete();
    console.log('onLoadComplete');
    PanelMgr.shared.hide('load').then(() => {
      PaneMgr.shared.pane.hidden = false;
    });
    /* 
    后处理必须放在最后
    */

    /* contact shadow */
    // this.addContactShadow();

    /* outline*/
    this.addOutlineEffect();
  }
}

export default FirstSkecth;
