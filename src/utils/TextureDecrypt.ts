import { ArcRotateCamera, Color4, Engine, Mesh, RenderTargetTexture, Scene, ShaderMaterial, Texture, Vector2, Vector3, VertexData, type Nullable } from '@babylonjs/core';
import vertexShader from '@/components/sketch/shader/decrypt/vertex.glsl';
import decrypt_frag_version1 from '@/components/sketch/shader/decrypt/fragment.glsl';

const ShaderChunk = {
  version1: decrypt_frag_version1,
};

type IShaderChunk = keyof typeof ShaderChunk;

export default class TextureDecrypt {
  private static __ins: TextureDecrypt;
  public static get shared() {
    if (!this.__ins) {
      this.__ins = new TextureDecrypt();
    }
    return this.__ins;
  }

  private scene!: Scene;
  private fullScreenTriangle: Nullable<Mesh>;

  private camera: Nullable<ArcRotateCamera>;

  private _version: IShaderChunk = 'version1';

  constructor() {
    this.fullScreenTriangle = null;
    this.camera = null;
  }

  public get version() {
    return this._version;
  }

  public set version(value: IShaderChunk) {
    if (this._version !== value) {
      this._version = value;
      const mat = this.fullScreenTriangle?.material;
      if (mat) {
        mat.dispose();
      }
    }
  }

  public initialize(scene: Scene) {
    this.scene = scene;
    const camera = new ArcRotateCamera('rttCamera', 0, 0, -3, Vector3.Zero(), this.scene);
    camera.layerMask = 0x10000000;
    camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
    camera.beta = Math.PI / 2;
    camera.alpha = Math.PI / 2;
    camera.radius = 1;
    camera.orthoLeft = -1;
    camera.orthoRight = 1;
    camera.orthoTop = 1;
    camera.orthoBottom = -1;
    camera.minZ = 0;
    camera.maxZ = 1;
    this.camera = camera;
  }

  private setupGeometry() {
    const fullscreenTriangle = new Mesh('FullScreenQuad', null);
    const position = [-1, 3, 0, -1, -1, 0, 3, -1, 0];
    const uvs = [0, 2, 0, 0, 2, 0];
    const indices = [0, 2, 1];
    const normal: number[] = [];
    VertexData.ComputeNormals(position, indices, normal);

    const vertexData = new VertexData();
    vertexData.indices = indices;
    vertexData.positions = position;
    vertexData.uvs = uvs;
    vertexData.normals = normal;
    vertexData.applyToMesh(fullscreenTriangle);

    fullscreenTriangle.layerMask = 0x10000000;

    this.fullScreenTriangle = fullscreenTriangle;

    return fullscreenTriangle;
  }

  private setupShader(fragmentShader: string) {
    const material = new ShaderMaterial(
      'quadMat',
      this.scene,
      {
        vertexSource: vertexShader,
        fragmentSource: fragmentShader,
      },
      {
        attributes: ['position', 'uv'],
        uniforms: ['world', 'view', 'projection', 'uT', 'uS', 'uO'],
      }
    );
    this.fullScreenTriangle!.material = material;

    return material;
  }

  public encryptTexture(texture: Texture, engine: Engine): Promise<RenderTargetTexture> {
    const { camera } = this;
    const mesh = this.setupGeometry();
    const mat = this.setupShader(ShaderChunk[this.version]);
    const sizes = texture.getSize();
    const rtt = new RenderTargetTexture(`rtt-encrypt-${texture.name}`, { width: sizes.width, height: sizes.height }, this.scene, {
      generateMipMaps: !texture.noMipmap,
      useSRGBBuffer: texture._useSRGBBuffer,
    });
    rtt.clearColor = new Color4(0, 0, 0, 0);
    rtt.activeCamera = camera;

    rtt.renderList = [];

    rtt.renderList.push(mesh);

    rtt.vScale = -1;

    const max = Math.floor(sizes.height * sizes.width);

    mat.setTexture('uT', texture);
    mat.setVector2('uS', new Vector2(sizes.width, sizes.height));
    mat.setFloat('uY', 0);
    mat.setInt('uO', max / 2);

    return new Promise(async (reslove, reject) => {
      await new Promise<void>((ok) => {
        const checkReady = () => {
          if (rtt?.isReadyForRendering() && camera?.isReady(true)) {
            ok();
          } else {
            setTimeout(checkReady, 16);
          }
        };
        checkReady();
      });

      // At the end of the next available frame, render the RTT
      await new Promise<void>((ok) => {
        engine.onEndFrameObservable.addOnce(() => {
          rtt.render();
          ok();
        });
      });
      mesh.dispose();
      mat.dispose();
      this.fullScreenTriangle = null;
      return reslove(rtt);
    });
  }

  public decryptTexture(texture: Texture, engine: Engine): Promise<RenderTargetTexture> {
    const { camera } = this;
    const mesh = this.setupGeometry();
    const mat = this.setupShader(ShaderChunk[this.version]);
    const sizes = texture.getSize();
    const rtt = new RenderTargetTexture(`rtt-decrypt-${texture.name}`, { width: sizes.width, height: sizes.height }, this.scene, {
      generateMipMaps: !texture.noMipmap,
      useSRGBBuffer: texture._useSRGBBuffer,
    });
    rtt.clearColor = new Color4(0, 0, 0, 0);
    rtt.activeCamera = camera;

    rtt.renderList = [];

    rtt.renderList.push(mesh);

    const max = Math.floor(sizes.height * sizes.width);

    mat.setTexture('uT', texture);
    mat.setVector2('uS', new Vector2(sizes.width, sizes.height));
    mat.setFloat('uY', 0);
    mat.setInt('uO', max / 2);

    return new Promise(async (reslove, reject) => {
      await new Promise<void>((ok) => {
        const checkReady = () => {
          if (rtt?.isReadyForRendering() && camera?.isReady(true)) {
            ok();
          } else {
            setTimeout(checkReady, 16);
          }
        };
        checkReady();
      });

      // At the end of the next available frame, render the RTT
      await new Promise<void>((ok) => {
        engine.onEndFrameObservable.addOnce(() => {
          rtt.render();
          ok();
        });
      });
      // mesh.dispose();
      // mat.dispose();
      this.fullScreenTriangle = null;
      return reslove(rtt);
    });
  }

  public dispose() {
    this.fullScreenTriangle?.dispose();
    this.camera?.dispose();
  }
}
