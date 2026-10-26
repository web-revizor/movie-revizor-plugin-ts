// Season / episode numbers from typical torrent file layouts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { episodeFromPath } from '../src/shared/libs/episode-from-path.ts';

const cases: [string, [number, number] | null][] = [
  ['Show/Season 2/Show.S02E05.1080p.mkv', [2, 5]],
  ['Show.S01-S05.1080p/Show.S03E10.mkv', [3, 10]],
  ['Show 1x02.avi', [1, 2]],
  ['Show.S02.1080p.WEB-DL/05.mkv', [2, 5]],
  ['Show.S02.1080p.WEB-DL/05. Назва серії.mkv', [2, 5]],
  ['Шоу/2 сезон/Серія 05.mkv', [2, 5]],
  ['Шоу/Сезон 3/03 серія.mkv', [3, 3]],
  ['Шоу (сезон 1-5)/Сезон 4/Шоу - 07.mkv', [4, 7]],
  ['Шоу/Сезон 4/07 - Назва.mkv', [4, 7]],
  ['Show/Season.02/Episode 11.mkv', [2, 11]],
  ['Show/S2/E03.mkv', [2, 3]],
  ['Шоу.1 сезон 2 серія.mkv', [1, 2]],
  ['Movie.2020.1080p.mkv', null],
  ['Show/Season 2/sample.mkv', null],
  ['Show/Extras/01.mkv', null],
];

for (const [path, want] of cases) {
  test(path, () => {
    const got = episodeFromPath(path);
    assert.deepEqual(got && [got.season, got.episode], want);
  });
}
