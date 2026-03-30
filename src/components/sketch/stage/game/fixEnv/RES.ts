import px from '@textures/skybox/dawn/px.png';
import nx from '@textures/skybox/dawn/nx.png';
import py from '@textures/skybox/dawn/py.png';
import ny from '@textures/skybox/dawn/ny.png';
import pz from '@textures/skybox/dawn/pz.png';
import nz from '@textures/skybox/dawn/nz.png';
import ring from '@models/ring.glb';
import envHdr from '@textures/env/env-metal-1.hdr';

export default {
  gltf: {
    ring,
  },
  texture: {},
  audio: {},
  hdr: {
    envHdr,
  },
  cube: {
    skybox: [px, py, pz, nx, ny, nz],
  },
};
