import { Texture, type Nullable, Scene, BaseTexture } from '@babylonjs/core';

let canvas: Nullable<HTMLCanvasElement> = null;

async function mergeTexture(redTexture: Nullable<Texture> = null, greenTexture: Nullable<Texture> = null, blueTexture: Nullable<Texture> = null): Promise<Texture> {
  // 资源清理函数
  const cleanupTextures = (textures: Nullable<Texture>[]) => {
    textures.forEach((texture) => {
      if (texture) {
        texture.dispose();
      }
    });
  };

  try {
    // 检查是否至少有一个纹理
    if (!redTexture && !greenTexture && !blueTexture) {
      throw new Error('至少需要传入一个纹理');
    }

    // 获取纹理尺寸（使用第一个非空纹理的尺寸）
    const textures = [redTexture, greenTexture, blueTexture].filter((tex) => tex !== null);
    const firstTexture = textures[0]!;
    const width = firstTexture.getSize().width;
    const height = firstTexture.getSize().height;

    // 验证所有非空纹理的尺寸是否一致
    for (const tex of textures) {
      const size = tex!.getSize();
      if (size.width !== width || size.height !== height) {
        throw new Error('所有非空纹理必须具有相同的尺寸');
      }
    }

    // 异步加载通道数据的函数
    const getChannelData = async (texture: Nullable<Texture>, channelIndex: 0 | 1 | 2): Promise<Uint8Array> => {
      if (!texture) {
        // 如果纹理为 null，返回全零数组
        return new Uint8Array(width * height);
      }

      const channelData = new Uint8Array(width * height);
      const buffer = await texture.readPixels();

      if (buffer) {
        for (let i = 0; i < buffer.byteLength; i += 4) {
          channelData[i / 4] = (buffer as Uint8Array)[i + channelIndex];
        }
      }

      return channelData;
    };

    // 并行加载各通道数据
    const [redData, greenData, blueData] = await Promise.all([getChannelData(redTexture, 0), getChannelData(greenTexture, 1), getChannelData(blueTexture, 2)]);

    if (canvas === null) {
      canvas = document.createElement('canvas');
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法创建 2D 渲染上下文');
    }

    // 创建图像数据
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // 合并通道数据
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = redData[i]; // R 通道
      data[i * 4 + 1] = greenData[i]; // G 通道
      data[i * 4 + 2] = blueData[i]; // B 通道
      data[i * 4 + 3] = 255; // A 通道
    }

    // 将图像数据绘制到画布
    ctx.putImageData(imageData, 0, 0);

    // 创建新纹理
    const resultTexture = new Texture(canvas.toDataURL());

    resultTexture.displayName = 'ormTex';

    // 清理原始纹理资源
    cleanupTextures([redTexture, greenTexture, blueTexture]);

    return resultTexture;
  } catch (error) {
    console.error('纹理合并失败:', error);
    throw error;
  }
}

export { mergeTexture };
