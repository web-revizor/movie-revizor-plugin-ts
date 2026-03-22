import { build } from 'esbuild';
import { glob } from 'glob';

const entryPoints = await glob([
  'src/shared/plugins/*.ts',
  'src/local/plugins/*.ts',
]);

await build({
  entryPoints,
  bundle: true,
  outdir: 'dist',
  entryNames: '[name]',
  format: 'esm',
  globalName: 'PlayerAPI',
  target: 'es2020',
  minify: true,
  platform: 'browser',
});
