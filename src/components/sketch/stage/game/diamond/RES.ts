import px from '@textures/skybox/dawn/px.png';
import nx from '@textures/skybox/dawn/nx.png';
import py from '@textures/skybox/dawn/py.png';
import ny from '@textures/skybox/dawn/ny.png';
import pz from '@textures/skybox/dawn/pz.png';
import nz from '@textures/skybox/dawn/nz.png';
import akashi from '@models/ijn_akashi_of_azure_lane.glb';
import gem from '@models/gem.glb';
import gemEnv from '@textures/reflect/env_gem.exr';

export default {
  gltf: {
    // akashi,
    gem,
  },
  texture: {
    gemEnv,
  },
  audio: {},
  hdr: {},
  exr: {
    // gemEnv,
  },
  cube: {
    skybox: [px, py, pz, nx, ny, nz],
  },
};
