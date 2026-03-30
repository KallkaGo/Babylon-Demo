import px from '@textures/skybox/dawn/px.png';
import nx from '@textures/skybox/dawn/nx.png';
import py from '@textures/skybox/dawn/py.png';
import ny from '@textures/skybox/dawn/ny.png';
import pz from '@textures/skybox/dawn/pz.png';
import nz from '@textures/skybox/dawn/nz.png';
import Onyx002Color from '@textures/marble/Onyx002_2K-JPG/Onyx002_2K-JPG_Color.jpg';
import Onyx002Normal from '@textures/marble/Onyx002_2K-JPG/Onyx002_2K-JPG_NormalGL.jpg';
import Onyx002Roughness from '@textures/marble/Onyx002_2K-JPG/Onyx002_2K-JPG_Roughness.jpg';
import Onyx006Color from '@textures/marble/Onyx006_2K-JPG/Onyx006_2K-JPG_Color.jpg';
import Onyx006Normal from '@textures/marble/Onyx006_2K-JPG/Onyx006_2K-JPG_NormalGL.jpg';
import Onyx006Roughness from '@textures/marble/Onyx006_2K-JPG/Onyx006_2K-JPG_Roughness.jpg';
import Travertine013Color from '@textures/marble/Travertine013_2K-JPG/Travertine013_2K-JPG_Color.jpg';
import Travertine013Normal from '@textures/marble/Travertine013_2K-JPG/Travertine013_2K-JPG_NormalGL.jpg';
import Travertine013Roughness from '@textures/marble/Travertine013_2K-JPG/Travertine013_2K-JPG_Roughness.jpg';

export default {
  gltf: {},
  texture: {
    Onyx002Color,
    Onyx002Normal,
    Onyx002Roughness,
    Onyx006Color,
    Onyx006Normal,
    Onyx006Roughness,
    Travertine013Color,
    Travertine013Normal,
    Travertine013Roughness,
  },
  audio: {},
  hdr: {},
  cube: {
    skybox: [px, py, pz, nx, ny, nz],
  },
};
