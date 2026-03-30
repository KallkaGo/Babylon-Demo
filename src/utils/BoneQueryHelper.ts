import { Bone, Mesh, VertexData, type FloatArray, type IndicesArray, type Skeleton } from '@babylonjs/core';

/**
 * 骨骼查询工具类 - 用于快速获取影响SkinnedMesh特定面（Face）的骨骼
 */
class BoneQueryHelper {
  private _mesh: Mesh;
  private _skeleton: Skeleton;
  private _indices: IndicesArray;
  private _weights: FloatArray;
  private _boneIndices: FloatArray;

  constructor(mesh: Mesh) {
    // 基础校验
    if (!mesh || !(mesh instanceof Mesh)) {
      throw new Error('Invalid mesh: Must provide a valid Babylon.js Mesh.');
    }
    if (!mesh.skeleton) {
      throw new Error('Mesh has no skeleton: This tool requires a skinned mesh.');
    }

    // 校验顶点数据
    const vertexData = VertexData.ExtractFromMesh(mesh);
    if (!vertexData.matricesWeights || !vertexData.matricesIndices) {
      throw new Error('Mesh lacks bone data: Ensure matricesWeights and matricesIndices exist.');
    }

    // 初始化数据
    this._mesh = mesh;
    this._skeleton = mesh.skeleton;
    this._indices = vertexData.indices || [];
    this._weights = vertexData.matricesWeights || [];
    this._boneIndices = vertexData.matricesIndices || [];
  }

  /**
   * 获取影响指定面（Face）的主要骨骼
   * @param faceId 面的索引ID
   * @param strategy 选择策略 ('count'按出现次数 | 'weight'按总权重)
   */
  public getDominantBoneForFace(faceId: number, strategy: 'count' | 'weight' = 'count') {
    // 校验faceId有效性
    const maxFaceId = this._indices.length / 3 - 1;
    if (faceId < 0 || faceId > maxFaceId) {
      throw new Error(`Invalid faceId: Must be between 0 and ${maxFaceId}.`);
    }

    // 获取面的三个顶点索引
    const baseIndex = faceId * 3;
    const vertexIndices = [this._indices[baseIndex], this._indices[baseIndex + 1], this._indices[baseIndex + 2]];

    // 收集所有骨骼影响数据
    const boneData = this._collectBoneData(vertexIndices);

    // 根据策略选择骨骼
    return this._selectBoneByStrategy(boneData, strategy);
  }

  /**
   * 收集顶点相关的骨骼数据
   */
  private _collectBoneData(vertexIndices: number[]): Map<number, { count: number; weight: number }> {
    const boneMap = new Map<number, { count: number; weight: number }>();

    for (const vIdx of vertexIndices) {
      const offset = vIdx * 4;

      // 遍历每个顶点的4个骨骼影响
      for (let i = 0; i < 4; i++) {
        const boneIdx = Math.floor(this._boneIndices[offset + i]); // 转换浮点为整数索引
        const weight = this._weights[offset + i];

        if (weight <= 0) continue; // 忽略无影响的骨骼

        // 更新骨骼统计
        if (boneMap.has(boneIdx)) {
          const data = boneMap.get(boneIdx)!;
          data.count++;
          data.weight += weight;
        } else {
          boneMap.set(boneIdx, { count: 1, weight });
        }
      }
    }

    return boneMap;
  }

  /**
   * 根据策略选择骨骼
   */
  private _selectBoneByStrategy(boneMap: Map<number, { count: number; weight: number }>, strategy: 'count' | 'weight'): Bone {
    if (boneMap.size === 0) {
      throw new Error('No bones found: This face is not influenced by any bones.');
    }

    let dominantBoneIdx = -1;
    let maxValue = -Infinity;

    boneMap.forEach((data, boneIdx) => {
      const value = strategy === 'count' ? data.count : data.weight;
      if (value > maxValue) {
        maxValue = value;
        dominantBoneIdx = boneIdx;
      }
    });

    if (dominantBoneIdx === -1 || dominantBoneIdx >= this._skeleton.bones.length) {
      throw new Error('Invalid bone index: Data may be corrupted.');
    }

    return this._skeleton.bones[dominantBoneIdx];
  }

  /**
   * 工具类销毁方法（清理引用）
   */
  public dispose(): void {
    this._mesh = null!;
    this._skeleton = null!;
    this._indices = null!;
    this._weights = null!;
    this._boneIndices = null!;
  }
}


export default BoneQueryHelper;