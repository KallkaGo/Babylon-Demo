import px from '@textures/skybox/dawn/px.png';
import nx from '@textures/skybox/dawn/nx.png';
import py from '@textures/skybox/dawn/py.png';
import ny from '@textures/skybox/dawn/ny.png';
import pz from '@textures/skybox/dawn/pz.png';
import nz from '@textures/skybox/dawn/nz.png';
import akashi_e from '@models/ijn_akashi_of_azure_lane_e.glb';
import akashi from '@models/ijn_akashi_of_azure_lane.glb';
// import car_e from '@models/car_e.glb';
// import nekoha_e from '@models/nekoha_alpha_e.glb';
import robot_e from '@models/robot_e.glb';
import test_ball_e from '@models/edplane.glb';


export default {
  gltf: {
    // akashi_e,
    // akashi,
    // car_e,
    // nekoha_e,
    // robot_e,
    test_ball_e,
  },
  texture: {

  },
  audio: {},
  hdr: {},
  cube: {
    skybox: [px, py, pz, nx, ny, nz],
  },
};
