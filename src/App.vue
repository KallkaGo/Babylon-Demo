<template>
  <canvas class="webgl full abs"></canvas>
  <div class="panel full abs"></div>
  <div class="pop full abs"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import ResizeMgr from '@/components/mgr/ResizeMgr'
import UpdateMgr from '@/components/mgr/UpdateMgr'
import RenderMgr from '@/components/mgr/RenderMgr'
import PaneMgr from '@/components/mgr/PaneMgr'
import PanelMgr from '@/components/mgr/PanelMgr.ts'
import SketchMgr from './components/mgr/SketchMgr'
import { EStageID } from './components/enum/Enum'
import PopMgr from './components/mgr/PopMgr'


onMounted(() => {
  PanelMgr.shared.init()
  PopMgr.shared.init()
  SketchMgr.shared.init()
  ResizeMgr.shared.init();
  UpdateMgr.shared.init();
  const sketch = SketchMgr.shared.create(EStageID.ED);
  PanelMgr.shared.show('load').then(() => {
    sketch && sketch.load();
  })

});

onUnmounted(() => {
  RenderMgr.shared.renderer.dispose()
  PaneMgr.shared.disope()
})
</script>

<style scoped>
.panel,
.pop {
  pointer-events: none;
}

.pop>* {
  pointer-events: auto;
}
</style>
