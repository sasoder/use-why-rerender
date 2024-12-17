import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: false,
      exports: 'named',
      interop: 'auto'
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: false
    }
  ],
  external: ['react', 'react-fast-compare'],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: false,
      declaration: true,
      declarationDir: 'dist'
    }),
    terser({
      format: {
        comments: false
      },
      compress: {
        passes: 2,
        pure_getters: true
      }
    })
  ]
};