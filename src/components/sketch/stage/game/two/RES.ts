import car from '@models/car.glb';
import px from '@textures/skybox/dawn/px.png';
import nx from '@textures/skybox/dawn/nx.png';
import py from '@textures/skybox/dawn/py.png';
import ny from '@textures/skybox/dawn/ny.png';
import pz from '@textures/skybox/dawn/pz.png';
import nz from '@textures/skybox/dawn/nz.png';
import spriteTex from '@textures/sprite/hotspotTexture.png';
import robot from '@models/robot.glb';

export default {
  gltf: {
    car,
    robot,
  },
  texture: {
    spriteTex,
  },
  audio: {},
  hdr: {},
  cube: {
    skybox: [px, py, pz, nx, ny, nz],
  },
};
