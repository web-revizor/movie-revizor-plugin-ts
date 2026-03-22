import { build } from 'esbuild';

await build({
  entryPoints: ['src/shared/plugins/*.ts', 'src/local/plugins/*.ts'],
  bundle: true,
  outdir: 'dist',
  entryNames: '[name]',
  format: 'esm',
  globalName: 'PlayerAPI',
  target: 'es2020',
  minify: true,
  platform: 'browser',
});
