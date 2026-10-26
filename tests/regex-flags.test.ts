import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// QuickJS in the app does not match Cyrillic in a regex without the `u` flag
// (`/серія/i` finds nothing in «Серія 7»), while Node does, so other tests
// cannot catch it.
const REGEX_LITERAL = /(?<![\w)\]])\/((?:\\.|\[(?:\\.|[^\]\n])*\]|[^/\n\\[])+)\/([a-z]*)/g;
const CYRILLIC = /[Ѐ-ӿ]/;

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return sources(path);
    return e.name.endsWith('.ts') ? [path] : [];
  });
}

test('regexes with Cyrillic carry the u flag', () => {
  const missing: string[] = [];
  for (const file of sources('src')) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (/^\s*(\/\/|\/?\*)/.test(line)) return;
        for (const [literal, body, flags] of line.matchAll(REGEX_LITERAL)) {
          if (CYRILLIC.test(body) && !flags.includes('u')) {
            missing.push(`${file}:${i + 1} ${literal}`);
          }
        }
      });
  }
  assert.deepEqual(missing, []);
});
