import bunny from '@models/bunny.glb';
import commonAlbedo from '@textures/white.jpg';
import bunnyThickness from '@textures/bunny/bunny_thickness.jpg';
import dragonThickness from '@textures/dragon/thicknessMap.png';
import dragon from '@models/dragonUV.glb';
import people from '@models/LeePerrySmith.glb';
import peopleAlbedo from '@textures/people/color.jpg';
import peopleNormal from '@textures/people/normal.jpg';
import thumbnail from '@models/thumbnail.glb';
import thumbnailAO from '@textures/thumbnail/DefaultMaterial_ambient_occlusion.png';
import thumbnailThickness from '@textures/thumbnail/DefaultMaterial_thickness_INVERSE.png';
import haloweenpumpkin from '@models/haloween_pumpkin.glb';
import haloweenpumpkinThickness from '@textures/halloweenpumpkin/pumpkin_thickness.png';

export default {
  gltf: {
    bunny,
    dragon,
    people,
    thumbnail,
    haloweenpumpkin,
  },
  texture: {
    commonAlbedo,
    bunnyThickness,
    dragonThickness,
    peopleAlbedo,
    peopleNormal,
    thumbnailAO,
    thumbnailThickness,
    haloweenpumpkinThickness,
  },
  audio: {},
  hdr: {},
  cube: {},
};
