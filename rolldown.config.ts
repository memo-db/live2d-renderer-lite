import { defineConfig } from 'rolldown';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  input: 'live2dcubism.ts',
  output: {
    file: packageJson.main,
    format: 'esm',
    minify: true,
  },
});