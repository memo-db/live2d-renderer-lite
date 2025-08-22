import typescript from '@rollup/plugin-typescript';
import packageJson from './package.json' with { type: 'json' };

export default {
  input: 'live2dcubism.ts',
  output: {
    file: packageJson.main,
    format: 'esm',
  },
  plugins: [
    typescript(),
  ],
};