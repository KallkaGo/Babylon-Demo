import commonAlbedo from '@textures/white.jpg';
import thumbnail from '@models/thumbnail.glb';
import thumbnailAO from '@textures/thumbnail/DefaultMaterial_ambient_occlusion.png';
import thumbnailThickness from '@textures/thumbnail/DefaultMaterial_thickness_INVERSE.png';
import haloweenpumpkin from '@models/haloween_pumpkin.glb';
import haloweenpumpkinThickness from '@textures/halloweenpumpkin/pumpkin_thickness.png';
import candles from '@models/candles.glb';
import candlesThickness from '@textures/candles/SubsurfaceOpacity.png';

export default {
  gltf: {
    thumbnail,
    haloweenpumpkin,
    candles,
  },
  texture: {
    commonAlbedo,
    thumbnailAO,
    thumbnailThickness,
    haloweenpumpkinThickness,
    candlesThickness,
  },
  audio: {},
  hdr: {},
  cube: {},
};
