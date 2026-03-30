import type { IUpdate } from '@/components/mgr/types';
import { Mesh, MeshBuilder, ShaderMaterial, Vector3, type ArcRotateCamera, type Nullable, type Scene } from '@babylonjs/core';
import { nanoid } from 'nanoid';
import billboardVertexShader from '@/components/sketch/shader/billboard/vertex.glsl';
import billboardFragmentShader from '@/components/sketch/shader/billboard/fragment.glsl';

class Billboard implements IUpdate {
  private static __ins: Nullable<Billboard>;

  public static get shared() {
    if (!this.__ins) {
      this.__ins = new Billboard();
    }

    return this.__ins;
  }

  constructor() {
    this.uuid = nanoid();
  }
  public uuid: string;

  private scene!: Scene;
  private camera!: ArcRotateCamera;
  private currentIndex!: number;
  private billboard!: Mesh;

  public init(name = 'Billboard', scene: Scene, camera: ArcRotateCamera) {
    this.scene = scene;
    this.camera = camera;
    this.currentIndex = 0;

    const billboard = MeshBuilder.CreatePlane(name, { width: 1, height: 1 }, scene);
    billboard.setEnabled(false);

    this.billboard = billboard;
  }

  public create(pos: Vector3) {
    const billboard = this.billboard.clone(`billboard-${this.currentIndex}`);
    const billboardMaterial = new ShaderMaterial(
      'billboardMaterial',
      this.scene,
      {
        vertexSource: billboardVertexShader,
        fragmentSource: billboardFragmentShader,
      },
      {
        attributes: ['position', 'uv'],
        uniforms: ['uOpacity', 'world', 'view', 'projection', 'uResolution', 'uCellSize', 'uOffset'],
        samplers: ['uDiffuseTexture'],
        needAlphaBlending: true,
      }
    );
    billboard.material = billboardMaterial;
    billboard.position.copyFrom(pos);
    billboard.setEnabled(true);
    this.currentIndex++;

    return billboard;
  }

  update(dt: number): void {
   
  }
  updateBefore(dt: number): void {
   
  }
  updateAfter(dt: number): void {
    
  }
}

export default Billboard;
