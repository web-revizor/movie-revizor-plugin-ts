# Movie Revizor plugin SDK

Типи, клієнт і приклади плагінів для [Movie Revizor](https://github.com/web-revizor). Повний API для авторів (формат репозиторію, дозволи, точки входу, функції хоста, обмеження): [docs/plugin-api.md](docs/plugin-api.md).

Репозиторій прикладів для застосунку: `https://raw.githubusercontent.com/web-revizor/movie-revizor-plugin-ts/refs/heads/main/repository.json`

## Структура

```
src/shared/
├── types/          # типи даних і точок входу (index.ts), канали хоста (global.d.ts)
├── client/         # fetchFlutter / fetchText / fetchJson — HTTP через хост
├── libs/
│   ├── host.ts             # діалоги, форми, itemData, toast, прапорець входу
│   ├── search-data.ts      # searchDataGlobal: вибір назви й пошук за кількома назвами
│   └── episode-from-path.ts# номери сезону / серії з назв файлів торрента
├── utils/          # okResponse / errorResponse, expose (глобальні точки входу)
└── plugins/        # приклади; кожен файл збирається в dist/<назва>.js
```

## Приклади

Усі приклади використовують лише легальний контент.

| Плагін | Тип | Показує |
|--------|-----|---------|
| `demoPlayer` | `playerData` | без мережі: фільм і «серіал» з групами / сезонами / серіями й `number`, субтитри з `lang` / `format`, вибір назви, «Продовжити» (`resume`, `itemData`, `start`), `onItemSelected`, фонове `onDetailsOpened` + `showToast` лише за власними даними |
| `publicDomain` | `playerData` | справжні запити: Wikidata за TMDB id → відео з Wikimedia Commons чи Internet Archive, лише з позначкою суспільного надбання |
| `demoDataList` | `dataList` | пошук в Internet Archive (суспільне надбання): поля з `poster`, `link`, `torrentUrl`, рядок `resume`, форма «Нічого не знайдено» з `value`, `mapTorrentFiles` |
| `demoLogin` | `playerData` | вхід без справжнього сайту: форма з `saveData`, `getSavedData`, `setPluginInit` / `isPluginInit` |
| `selfTest` | `testPlugin` | викликає кожну функцію хоста й повертає відповіді |

Контент прикладів:

- Big Buck Bunny, Sintel, Tears of Steel — © Blender Foundation, [www.blender.org](https://www.blender.org), ліцензія [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Потоки: `test-streams.mux.dev`, `demo.unified-streaming.com`, `download.blender.org`; субтитри — `download.blender.org`.
- Фільми `publicDomain` і `demoDataList` — лише записи, які Wikidata (P6216 = Q19652) або Internet Archive (`licenseurl` з `publicdomain`) позначають як суспільне надбання. Позначка належить джерелу; перед поширенням у своїй країні перевіряйте статус фільму самі.

## Збірка й перевірки

Node.js 24, Yarn 1.

```bash
yarn install --frozen-lockfile
yarn typecheck
yarn lint
yarn build-es        # dist/*.js (esbuild, ES2020, без import/export)
```

CI (`.github/workflows/vite.yml`) запускає те саме й перевіряє, що закомічений `dist/` збігається з кодом.

## Новий плагін

1. Файл `src/shared/plugins/<назва>.ts`; точки входу робіть глобальними через `expose({ searchData })` (або `getDataList`, `runTest`, `onItemSelected`, `onDetailsOpened`, `mapTorrentFiles`).
2. `yarn build-es` → `dist/<назва>.js`.
3. Запис у `repository.json` (свій репозиторій) з `type`, `supported_types` і `permissions` — лише те, що плагін справді використовує.
4. Підвищуйте `version` з кожною зміною коду (застосунок кешує скрипт за `src` + `version`).
