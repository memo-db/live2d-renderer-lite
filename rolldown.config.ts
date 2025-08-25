import { existsSync, readFileSync } from "fs";
import { resolve } from 'path';
import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

const cubismCore = resolve(__dirname, './core/live2dcubismcore.min.js');

if (!existsSync(cubismCore)) throw new Error("Cubism Core not found.");

export default defineConfig({
  input: 'live2dcubism.ts',
  output: {
    dir: 'build',
    format: 'esm',
    minify: true,
  },
  define: {
    __CUBISM_CORE_SOURCE__: JSON.stringify(readFileSync(cubismCore, "utf-8")),
  },
  plugins: [dts()],
});