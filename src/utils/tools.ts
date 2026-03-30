import { _BasisTextureLoader, AbstractMesh, Color3, Matrix, Vector3, VertexBuffer, type AssetContainer, type Geometry } from '@babylonjs/core';
import PCA from './pca/pca'; // 假设使用相同的 PCA 库

function getCommonPath(urls: string[]): string {
  if (urls.length === 0) return '';

  // 使用Math.min和map找最短URL
  const shortestUrl = urls[urls.map((url) => url.length).indexOf(Math.min(...urls.map((url) => url.length)))];

  let commonPath = '';
  for (let i = 0; i < shortestUrl.length; i++) {
    const char = shortestUrl[i];
    if (urls.every((url) => url[i] === char)) {
      commonPath += char;
    } else {
      break;
    }
  }

  return commonPath.lastIndexOf('/') !== -1 ? commonPath.slice(0, commonPath.lastIndexOf('/') + 1) : commonPath;
}

function fixRotationAngle(targetTheta: number, currentTheta: number): number {
  while (targetTheta - currentTheta > Math.PI) {
    targetTheta -= Math.PI * 2;
  }

  while (currentTheta - targetTheta > Math.PI) {
    targetTheta += Math.PI * 2;
  }

  return targetTheta;
}

function getRootNode(assets: AssetContainer) {
  const root = assets?.meshes.find((mesh) => mesh.id === '__root__')!;
  if (!root) console.log('找不到根节点 请检查模型');
  return root;
}

function float32ToUint8(floatArray: Float32Array): Uint8Array {
  return new Uint8Array(floatArray.map((value) => Math.min(Math.max(value * 255, 0), 255)));
}

function debounce(func: Function, delay: number = 300) {
  let timeoutId: any = null;

  return function (this: any, ...args: any[]) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function replaceAll(string: string, find: string, replace: string) {
  return string.split(find).join(replace);
}

function computeBoundingSphereThree(mesh: AbstractMesh) {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

  if (!positions || positions.length === 0) {
    console.error('No position data found');
    return { center: Vector3.Zero(), radius: 0 };
  }

  // 计算包围盒并获取中心点
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  // 遍历所有顶点找包围盒
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);

    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  // 包围盒中心作为球心
  const center = new Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);

  // 计算半径（最远顶点到球心的距离）
  let maxRadiusSq = 0;
  const vertex = new Vector3();

  for (let i = 0; i < positions.length; i += 3) {
    vertex.set(positions[i], positions[i + 1], positions[i + 2]);

    // 计算距离的平方
    const distSq = Vector3.DistanceSquared(center, vertex);
    maxRadiusSq = Math.max(maxRadiusSq, distSq);
  }

  const radius = Math.sqrt(maxRadiusSq);

  return { center, radius };
}

/**
 * 辅助函数：计算三角形面积
 */
function calculateTriangleArea(v1: Vector3, v2: Vector3, v3: Vector3): number {
  // 使用叉积计算面积: ||(v2-v1) × (v3-v1)|| / 2
  const edge1 = v2.subtract(v1);
  const edge2 = v3.subtract(v1);
  const crossProduct = Vector3.Cross(edge1, edge2);
  return crossProduct.length() / 2;
}

/**
 * 计算四面体体积
 */
function calculateTetrahedronVolume(v1: Vector3, v2: Vector3, v3: Vector3): number {
  // 计算混合积: v1 · (v2 × v3) / 6
  const cross = Vector3.Cross(v2, v3);
  return Vector3.Dot(v1, cross) / 6;
}

/**
 * 创建变换矩阵
 */
function createTransformMatrix(
  eigenVectors: Array<{ eigenvalue: number; vector: number[] }>,
  geometryProperties: {
    center: Vector3;
    com: Vector3;
    volume: number;
    area: number;
  }
): Matrix {
  const transformMatrix = Matrix.FromValues(
    eigenVectors[0].vector[0],
    eigenVectors[0].vector[1],
    eigenVectors[0].vector[2],
    0, // 第一行
    eigenVectors[1].vector[0],
    eigenVectors[1].vector[1],
    eigenVectors[1].vector[2],
    0, // 第二行
    eigenVectors[2].vector[0],
    eigenVectors[2].vector[1],
    eigenVectors[2].vector[2],
    0, // 第三行
    0,
    0,
    0,
    1 // 第四行
  );

  // 计算质心到几何中心的方向
  const comToCenterDirection = new Vector3();
  comToCenterDirection.copyFrom(geometryProperties.com).subtractToRef(geometryProperties.center, comToCenterDirection);
  comToCenterDirection.normalize();

  // 第三主成分向量
  const thirdPrincipalComponent = new Vector3(eigenVectors[2].vector[0], eigenVectors[2].vector[1], eigenVectors[2].vector[2]);

  // 确保有一致的朝向（保证手相性）
  if (comToCenterDirection.dot(thirdPrincipalComponent) < 0) {
    const mat = transformMatrix.asArray();
    mat[4] = -eigenVectors[1].vector[0];
    mat[5] = -eigenVectors[1].vector[1];
    mat[6] = -eigenVectors[1].vector[2];
    mat[8] = -eigenVectors[2].vector[0];
    mat[9] = -eigenVectors[2].vector[1];
    mat[10] = -eigenVectors[2].vector[2];
    transformMatrix.copyToArray(mat);
  }
  return transformMatrix;
}

/**
 * 翻转法线
 */
function flipNormals(geometry: Geometry): void {
  const normals = geometry.getVerticesData(VertexBuffer.NormalKind);
  if (!normals) {
    console.warn('No normals to flip');
    return;
  }

  for (let i = 0; i < normals.length; i++) {
    normals[i] = -normals[i];
  }

  geometry.setVerticesData(VertexBuffer.NormalKind, normals, true);
}

/**
 * 计算几何体属性（重心、质心、面积、体积）
 */
function calculateGeometryProperties(
  flatVertices: Float32Array | number[],
  triangleVertices: number[][]
): {
  center: Vector3;
  com: Vector3;
  volume: number;
  area: number;
} {
  // 计算几何重心（所有顶点的平均位置）
  const centroid = Vector3.Zero();
  for (let i = 0; i < flatVertices.length; i += 3) {
    centroid.x += flatVertices[i];
    centroid.y += flatVertices[i + 1];
    centroid.z += flatVertices[i + 2];
  }
  centroid.scaleInPlace(1 / (flatVertices.length / 3));

  // 计算质心、面积和体积
  const centerOfMass = Vector3.Zero();
  const triangleCenter = Vector3.Zero();

  let totalArea = 0;
  let totalVolume = 0;
  let triangleCount = triangleVertices.length;

  // 确保是3的倍数
  triangleCount -= triangleCount % 3;

  for (let i = 0; i < triangleCount; i += 3) {
    const vertex1 = new Vector3(triangleVertices[i][0], triangleVertices[i][1], triangleVertices[i][2]);
    const vertex2 = new Vector3(triangleVertices[i + 1][0], triangleVertices[i + 1][1], triangleVertices[i + 1][2]);
    const vertex3 = new Vector3(triangleVertices[i + 2][0], triangleVertices[i + 2][1], triangleVertices[i + 2][2]);

    // 三角形中心
    triangleCenter.copyFrom(vertex1).addInPlace(vertex2).addInPlace(vertex3);

    const triangleArea = calculateTriangleArea(vertex1, vertex2, vertex3);
    triangleCenter.scaleInPlace(triangleArea / 3);
    centerOfMass.addInPlace(triangleCenter);

    totalArea += triangleArea;
    totalVolume += calculateTetrahedronVolume(vertex1, vertex2, vertex3);

    // 重置 triangleCenter 以便下次使用
    triangleCenter.set(0, 0, 0);
  }

  centerOfMass.scaleInPlace(1 / totalArea);

  return {
    center: centroid,
    com: centerOfMass,
    volume: totalVolume,
    area: totalArea,
  };
}

/**
 * 分析几何体并创建变换矩阵
 */
function analyzeGeometryAndCreateTransform(geometry: Geometry): Matrix {
  const positions = geometry.getVerticesData(VertexBuffer.PositionKind);
  const indices = geometry.getIndices();

  if (!positions) {
    throw new Error('Geometry has no position data');
  }

  const vertexCount = positions.length / 3;
  if (vertexCount > 1500) {
    console.warn('DiamondPlugin:: Too many vertices. Mirror/Topology issues will not be fixed', vertexCount);
  }

  const positionArray: number[][] = [];

  if (indices && indices.length > 0) {
    // 使用索引提取三角形
    const drawRangeStart = 0; // Babylon.js 没有直接的 drawRange，通常处理整个几何体
    const drawRangeCount = indices.length;

    for (let i = drawRangeStart; i < Math.min(drawRangeCount, indices.length) - 2; i += 3) {
      // 获取三角形的三个顶点索引
      const index1 = indices[i];
      const index2 = indices[i + 1];
      const index3 = indices[i + 2];

      // 获取三个顶点的坐标
      const v1 = [positions[index1 * 3], positions[index1 * 3 + 1], positions[index1 * 3 + 2]];
      const v2 = [positions[index2 * 3], positions[index2 * 3 + 1], positions[index2 * 3 + 2]];
      const v3 = [positions[index3 * 3], positions[index3 * 3 + 1], positions[index3 * 3 + 2]];

      positionArray.push(v1, v2, v3);
    }
  } else {
    // 无索引，直接使用顶点数据
    for (let i = 0; i < positions.length; i += 3) {
      positionArray.push([positions[i], positions[i + 1], positions[i + 2]]);
    }
  }

  // 计算几何属性
  const geometryProperties = calculateGeometryProperties(positions, positionArray);

  console.log('geometryProperties', geometryProperties);

  // 修复负体积（翻转法线）
  if (geometryProperties.volume < 0) {
    console.warn('DiamondPlugin:: Negative Volume, Fixing Normals');
    flipNormals(geometry);
  }

  // 准备 PCA 数据
  const pcaData: number[][] = [];
  for (let i = 0; i < positions.length; i += 3) {
    pcaData.push([positions[i], positions[i + 1], positions[i + 2]]);
  }

  // 进行主成分分析
  const eigenVectors = PCA.getEigenVectors(pcaData);

  console.log('eigenVectors', eigenVectors);

  // 构建变换矩阵
  const transformMatrix = createTransformMatrix(eigenVectors, geometryProperties);

  console.log('transformMatrix', transformMatrix);

  // 应用边界球缩放
  // @ts-ignore
  const boundingSphere = geometry.metadata.boundingSphere;
  // @ts-ignore
  const boundingRadius = boundingSphere.radius;

  console.log('boundingRadius', boundingRadius);

  const scaleMatrix = Matrix.Scaling(boundingRadius, boundingRadius, boundingRadius);

  // Babylon.js 的矩阵乘法
  return transformMatrix.multiply(scaleMatrix);
}

/**
 * 计算几何体的变换偏移数据
 */
function computeOffsets(mesh: AbstractMesh): {
  center: number[];
  offsetMatrix: number[];
  offsetMatrixInv: number[];
  radius: number;
  centerOffset: number[];
} {
  const geometry = mesh.geometry!;

  // @ts-ignore
  if (!geometry.metadata) {
    // @ts-ignore
    geometry.metadata = {};
  }
  // @ts-ignore
  if (geometry.metadata.normalsCaptureOffsets) {
    // @ts-ignore
    return geometry.metadata.normalsCaptureOffsets;
  }
  // mesh.showBoundingBox = true;
  // 计算包围盒
  const boundingInfo = mesh.getBoundingInfo();

  const boundingSphere = computeBoundingSphereThree(mesh);

  // @ts-ignore
  geometry.metadata.boundingSphere = boundingSphere;

  const center = boundingInfo.boundingBox.center.asArray();

  // 获取标准化变换矩阵
  const offsetMatrix = analyzeGeometryAndCreateTransform(geometry).asArray();

  // 计算逆变换矩阵
  const transformMatrix = Matrix.FromArray(offsetMatrix);
  const inverseMatrix = transformMatrix.clone();
  inverseMatrix.invert();
  const offsetMatrixInv = inverseMatrix.asArray();

  // 计算变换后的中心偏移
  const centerVector = Vector3.FromArray(center);
  const centerOffset = Vector3.TransformCoordinates(centerVector, inverseMatrix).asArray();

  const offsets = {
    center, // 几何体原始中心点
    offsetMatrix, // 标准化变换矩阵
    offsetMatrixInv, // 逆变换矩阵
    radius: 1, // 标准化半径（固定为1）
    centerOffset, // 变换空间中的中心偏移
  };

  // @ts-ignore
  geometry.metadata.normalsCaptureOffsets = offsets;

  return offsets;
}

function fromHexSting(hex: string) {
  const hexString = hex.replace(/^#/, '');
  const color = new Color3();
  let _hex = parseInt(hexString, 16);
  _hex = Math.floor(_hex);
  color.r = ((_hex >> 16) & 255) / 255;
  color.g = ((_hex >> 8) & 255) / 255;
  color.b = (_hex & 255) / 255;
  return color;
}

function copyLinearToSRGB(color: Color3) {
  color.r = LinearToSRGB(color.r);
  color.g = LinearToSRGB(color.g);
  color.b = LinearToSRGB(color.b);
  return color;
}

function copySRGBToLinear(color: Color3) {
  color.r = SRGBToLinear(color.r);
  color.g = SRGBToLinear(color.g);
  color.b = SRGBToLinear(color.b);
  return color;
}

function LinearToSRGB(c: number) {
  return c < 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 0.41666) - 0.055;
}

export function SRGBToLinear(c: number) {
  return c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
}

export { getCommonPath, getRootNode, fixRotationAngle, float32ToUint8, debounce, easeInOut, replaceAll, computeOffsets, fromHexSting, copyLinearToSRGB, copySRGBToLinear };
