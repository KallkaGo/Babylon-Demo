import magicGlass from '@models/glass.glb';
import people from '@models/people.glb';
import diffuse from '@textures/diffuse.png';
import sapphy from '@models/sapphy_draco.glb';
import car2 from '@models/car.glb';
import npcOrange from '@models/npc_orange.glb';
import px from '@textures/skybox/dawn/px.png';
import nx from '@textures/skybox/dawn/nx.png';
import py from '@textures/skybox/dawn/py.png';
import ny from '@textures/skybox/dawn/ny.png';
import pz from '@textures/skybox/dawn/pz.png';
import nz from '@textures/skybox/dawn/nz.png';

export default {
  gltf: {
    magicGlass,
    people,
    sapphy,
    npcOrange,
    car2,
  },
  texture: {
    diffuse,
  },
  audio: {},
  hdr: {},
  cube: {
    skybox: [px, py, pz, nx, ny, nz],
  },
};
