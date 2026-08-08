import { context } from 'esbuild';
import { glob } from 'glob';

const entryPoints = await glob([
  'src/shared/plugins/*.ts',
  'src/local/plugins/*.ts',
]);

const ctx = await context({
  entryPoints,
  bundle: true,
  outdir: 'dist',
  entryNames: '[name]',
  format: 'esm',
  globalName: 'PlayerAPI',
  target: 'es2020',
  minify: true,
  platform: 'browser',
  plugins: [
    {
      name: 'build-notification',
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length > 0) {
            console.error('Build failed:', result.errors);
            return;
          }

          console.log(`Build completed: ${new Date().toLocaleTimeString()}`);
        });
      },
    },
  ],
});

if (process.argv.includes('--watch')) {
  await ctx.watch();
  console.log('Watching...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
