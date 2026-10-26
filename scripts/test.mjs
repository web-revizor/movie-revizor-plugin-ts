// Bundles tests/*.test.ts into a temp folder and runs them with node:test.
//   yarn test
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';

const outdir = mkdtempSync(join(tmpdir(), 'sdk-tests-'));
try {
  await build({
    entryPoints: readdirSync('tests')
      .filter((f) => f.endsWith('.test.ts'))
      .map((f) => `tests/${f}`),
    bundle: true,
    outdir,
    format: 'esm',
    platform: 'node',
    outExtension: { '.js': '.mjs' },
    logLevel: 'warning',
  });
  const files = readdirSync(outdir).map((f) => join(outdir, f));
  const run = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
  process.exitCode = run.status ?? 1;
} finally {
  rmSync(outdir, { recursive: true, force: true });
}
