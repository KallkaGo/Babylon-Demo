import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr', '**/*.mp3', '**/*.ico', '**/*.dds', '**/*.exr'],
  plugins: [
    vue(),
    glsl({
      include: ['**/*.glsl', '**/*.wgsl', '**/*.vert', '**/*.frag', '**/*.vs', '**/*.fs', '**/*.fx'],
      watch: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@textures': path.resolve(__dirname, './static/textures/'),
      '@models': path.resolve(__dirname, './static/models/'),
      '@images': path.resolve(__dirname, './static/images/'),
      '@audios': path.resolve(__dirname, './static/audios/'),
      '@utils': path.resolve(__dirname, './src/utils/'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'static/js/[name].[hash].js',
        chunkFileNames: 'static/js/[name].[hash].js',
        assetFileNames: 'static/assets/[name].[hash].[ext]',
        manualChunks: {
          vue: ['vue'],
          babylon: ['@babylonjs/core', '@babylonjs/inspector', '@babylonjs/materials'],
          gsap: ['gsap'],
          jquery: ['jquery'],
          chunk: ['nanoid', 'tweakpane'],
        },
      },
    },
  },
});
