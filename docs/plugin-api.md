# Плагіни Movie Revizor

Плагін — це JavaScript-файл, який застосунок завантажує з репозиторію плагінів і виконує у власному QuickJS-рушії (`flutter_js`). Плагін шукає контент на сторонньому сервісі й повертає застосунку посилання на відео (`playerData`) або список записів (`dataList`).

Застосунок — нейтральний інструмент: він не тлумачить тексти плагіна (номери серій, мови, формати плагін передає окремими полями), сам не звертається до джерел без дії користувача (лише повідомляє плагіну події, які той оголосив) і не синхронізує на сервер нічого, що називає плагін чи джерело.

Готові типи, клієнт `fetchFlutter`, обгортки функцій хоста й приклади — у `src/shared/` цього репозиторію (див. [README](../README.md)).

---

## Репозиторій плагінів

Користувач додає URL репозиторію в налаштуваннях. За URL лежить JSON:

```json
{
  "title": "Мій репозиторій",
  "description": "Опис репозиторію",
  "plugins": [
    {
      "title": "Example Player",
      "description": "Повний опис плагіна",
      "shortDescription": "Короткий опис для картки",
      "version": "1.0.0",
      "src": "https://example.com/plugins/example.js",
      "type": "playerData",
      "supported_types": ["movie", "show"],
      "pluginSettingsKey": "example",
      "permissions": ["network", "itemData", "dialogs"],
      "sha256": "<sha256 файлу src у hex>"
    }
  ]
}
```

| Поле | Обов'язкове | Опис |
|------|-------------|------|
| `title`, `description`, `version`, `src` | так | `src` — URL JS-файлу |
| `type` | ні | `playerData`, `dataList` або `testPlugin` (без поля — `testPlugin`) |
| `supported_types` | фактично так | `movie`, `show`, `person`. Кнопка плагіна з'являється лише на екранах цих типів; без поля плагін ніде не показується |
| `permissions` | ні | що плагіну дозволено (нижче «Дозволи») |
| `shortDescription` | ні | текст картки в списку плагінів |
| `pluginSettingsKey` | ні | ключ, під яким зберігаються поля форм (`showDialogFields` з `saveData`, `getSavedData`) |
| `sha256` | ні | SHA-256 файлу `src` (hex). Файл з іншим вмістом застосунок не використовує |

- Плагін визначають URL репозиторію, `src`, `title` і `type`. Зміна `version` — оновлення того самого плагіна (стан «увімкнено», дозволи й збережені дані лишаються); зміна будь-якого з цих чотирьох полів дає новий, вимкнений плагін.
- URL репозиторію і `src` — лише `https://`.
- Скрипт кешується за парою `src` + `version`. **Щоб користувачі отримали новий код, підвищуйте `version`** (і оновлюйте `sha256`).
- Застосунок стартує з кешованими скриптами, а репозиторії перевіряє у фоні після старту та за кнопкою «Перевірити оновлення».
- Нова версія замінює робочу лише тоді, коли її скрипт завантажився і виконався. Інакше далі працює попередня версія (і після перезапуску), а користувач бачить, що оновлення не встановилося.
- Завантаження скрипта і його перше виконання мають вкластися в 10 с кожне. Якщо новий плагін не виконується (помилка або немає функції точки входу), його вимикають.

---

## Дозволи

Плагін перелічує в `permissions`, що йому потрібно. Усе оголошене ввімкнено одразу (і нове з наступної версії теж); користувач може вимкнути кожен дозвіл у вікні плагіна («Дозволи», там же опис кожного).

| Дозвіл | Що відкриває |
|--------|--------------|
| `network` | `pluginRequest` у запусках, які почав користувач |
| `network.background` | `pluginRequest` у фонових запусках (`onDetailsOpened`, `quiet`); без нього у фоні плагін бачить лише свої збережені дані |
| `itemData` | `getItemData` / `setItemData` |
| `savedFields` | збереження полів форм (`saveData`) і `getSavedData` |
| `dialogs` | `showDialogData`, `showDialogFields` |
| `toast` | `showToast` у запусках, які почав користувач |
| `toast.background` | `showToast` з фонових запусків |
| `torrent` | `torrentUrl` у записах `dataList` (кнопка «Дивитися») і `mapTorrentFiles` |
| `event.detailsOpened` | виклик `onDetailsOpened`, коли відкривається сторінка фільму чи серіалу |

- Канал без дозволу не викликає помилку в скрипті, а відповідає як «немає»: `pluginRequest` → `{"error": "permission network is not granted"}`, `setItemData` і `showToast` → `false`, решта → `null` (як скасований діалог чи відсутнє значення). `showDialogFields` без `savedFields` показує форму, але нічого не зберігає.
- Кожен вид фонової роботи — окремий дозвіл (`event.<назва>`, `<канал>.background`); нова подія ніколи не розширює старий дозвіл.
- Плагін без поля `permissions` (старі репозиторії) отримує все, крім `event.*` і `*.background`: працює як раніше, але без фонових запусків.
- `setPluginInit` / `isPluginInit` дозволу не потребують.

---

## Точки входу

Скрипт оголошує глобальну функцію з назвою, що відповідає типу:

| `type` | Функція | Де викликається |
|--------|---------|-----------------|
| `playerData` | `searchData(params)` | кнопки на екранах фільму, серіалу, сезону, епізоду |
| `dataList` | `getDataList(params)` | кнопки пошуку на екранах деталей |
| `testPlugin` | `runTest(params)` | з UI не викликається |

Необов'язкові функції (будь-якого типу): `onItemSelected`, `onDetailsOpened`; для `dataList` ще `mapTorrentFiles`.

Якщо обов'язкової функції немає, плагін вимикається з помилкою. Функція може бути `async`; вона повертає **JSON-рядок** `FlutterResponse`:

```javascript
class FlutterResponse {
  constructor({ result = '', isError = false }) {
    this.result = result;   // рядок: JSON з даними або текст помилки
    this.isError = isError; // true — помилка / скасування (для playerData result показується як toast)
  }
}

return JSON.stringify(new FlutterResponse({ result: JSON.stringify(data), isError: false }));
```

`result` — завжди рядок; дані серіалізуються двічі (`okResponse(data)` / `errorResponse(text)` у `src/shared/utils/utils.ts`).

- `params` приходить готовим об'єктом; рядки передаються без змін (лапки, `\`, переноси рядків).
- Виняток або відхилений проміс стає помилкою з текстом винятку (`isError: true`).
- Виклик, що понад 45 с не робить жодного `sendMessage` і не завершується, перериває хост з помилкою «Плагін не відповідає». Час усередині `sendMessage` (запити, діалоги, де користувач обирає) не враховується.
- Усі запуски плагіна виконуються в одному рушії, тож глобальні змінні спільні між запусками.

### Параметри `searchData`

| Ключ | Тип | Опис |
|------|-----|------|
| `query` | string | перший варіант назви |
| `fallbackTitles` | string[] | інші варіанти: локалізована / оригінальна назва, кожна ще й з роком |
| `autoSelectTitle` | bool? | користувач вимкнув для цього плагіна вибір назви: не питати, а пробувати назви по черзі |
| `isSerial`, `isMovie`, `isPerson` | bool? | вид тайтлу |
| `seasonNumber`, `episodeNumber` | int? | номери TMDB на екранах сезону / епізоду |
| `seriesTitle` | string? | назва серіалу на екранах сезону / епізоду; тоді `query` = `"<серіал> <назва сезону/епізоду>"` |
| `tmdbId`, `mediaType` | int?, `'movie'`/`'tv'` | TMDB id тайтлу (на екранах сезону / епізоду — серіалу) і його вид; разом — ключ для даних, які плагін зберігає для тайтлу |
| `quiet` | bool? | запуск не від користувача: діалоги відповідають `null` одразу, діють фонові дозволи |
| `resume` | bool? | див. «Продовжити й вибір» |

### Параметри `getDataList`

Ті самі ключі, що й у `searchData` (без `fallbackTitles` / `autoSelectTitle`), плюс:

| Ключ | Тип | Опис |
|------|-----|------|
| `query` | string | назва (локалізована, інакше оригінальна) |
| `serialID` | int? | TMDB id серіалу (для фільмів `null`) |
| `tmdbId` | int? | TMDB id фільму або серіалу лише на його головному екрані (на екранах сезону, серії й персони `null`) |
| `traktId`, `traktIds` | — | застарілі, завжди `null` |

### «Продовжити» й вибір (`resume`)

- `true` — «Продовжити»: використай те, що запам'ятав для цього тайтлу, і не питай, якщо можеш. Те саме для тихого запуску (`quiet: true`).
- `false` — «Обрати» або перший запуск: **не використовуй** запам'ятаного, спитай знову й запам'ятай нову відповідь.
- ключа немає — стара версія застосунку.

Запам'ятовує плагін сам (`getItemData` / `setItemData`); застосунок даних плагіна не читає. Що саме користувач обрав, застосунок повідомляє через `onItemSelected`.

Історія переглядів синхронізується між пристроями без даних плагіна (лише тайтл, номери сезону / серії, позиція). На іншому пристрої «Продовжити» пропонує будь-який плагін: він отримує `resume: true`, а плеєр відкриває серію за номерами (`number`) на збереженій позиції.

### `onItemSelected(params)` — необов'язкова

Застосунок викликає її, коли користувач обирає те, що запропонував плагін. Результат ігнорується, помилки й завислий виклик не впливають на відтворення, діалоги в ній не показуються.

`params` — `tmdbId`, `mediaType`, `isSerial`, `seasonNumber`, `episodeNumber` і `selected`:

| `selected.kind` | Коли | Вміст |
|-----------------|------|-------|
| `dataListItem` | запущено дію запису («Дивитися» / «Відкрити») | `item` — запис точно так, як його повернув плагін |
| `playerData` | відкрито плеєр і при кожній зміні епізоду | `langGroup`, `season`, `episode`: `{ title, index }` у даних, які повернув плагін (`null`, якщо рівня немає) |

### `onDetailsOpened(params)` — необов'язкова, дозвіл `event.detailsOpened`

Застосунок повідомляє, що відкрито сторінку фільму чи серіалу: `{ tmdbId, mediaType, isSerial, seasonNumber, episodeNumber, quiet: true }`. Що робити — вирішує плагін; застосунок сам нікуди не звертається.

- Через 2 с після відкриття сторінки, не частіше ніж раз на 30 хв для одного плагіна й тайтлу, по одному фоновому запуску плагіна водночас. Результат ігнорується, сторінка на нього не чекає.
- Діалоги відповідають `null`; `pluginRequest` лише з `network.background`, `showToast` лише з `toast.background`.
- **Правила для авторів:** у фоні звертайтеся до мережі лише по тайтлах, для яких плагін уже має свої дані (`getItemData`); не робіть більше кількох запитів; не надсилайте ідентифікатори користувача; не показуйте повідомлень без нової для користувача інформації.

### `mapTorrentFiles(params)` — необов'язкова, `dataList` з дозволом `torrent`

Після завантаження `.torrent` із запису (`torrentUrl`) застосунок передає плагіну список файлів, щоб той сказав, що відтворювати:

```json
{
  "files": [{ "index": 0, "path": "Show/Season 1/Show.S01E01.mkv", "size": 734003200 }],
  "tmdbId": 1399, "mediaType": "tv", "isSerial": true,
  "seasonNumber": 2, "episodeNumber": null,
  "item": { "title": "…", "torrentUrl": "…" },
  "quiet": true
}
```

Відповідь — `PlayerData`, де в серій замість `file` стоїть `torrentFile` (індекс файлу), або для фільму `{ "torrentFile": 3 }`:

```json
{
  "playerLangGroup": [
    {
      "title": "Оригінал",
      "seasons": [
        {
          "title": "Сезон 1",
          "number": 1,
          "episodes": [
            { "title": "Серія 1", "number": 1, "torrentFile": 0,
              "subtitle": [{ "title": "UA", "torrentFile": 5, "lang": "uk", "format": "srt" }] }
          ]
        }
      ]
    }
  ],
  "start": null
}
```

- Повертайте всі сезони роздачі; застосунок сам відкриває сезон / серію екрана, з якого її запустили (за `number`), або `start`, якщо він є.
- Серії з індексом поза роздачею відкидаються; якщо нічого не лишилося або функції немає — грає найбільший файл (як для фільму).
- Субтитри — файл роздачі (`torrentFile`) або `url`.
- Розбирати назви файлів — справа плагіна; `episodeFromPath()` у `src/shared/libs/episode-from-path.ts` знає типові шаблони (`S01E02`, `1x02`, «Сезон 1 … Серія 2», теки сезонів).

---

## Формат результату

### `playerData`: `PlayerData`

Фільм — потрібен `file`; серіал — потрібен `playerLangGroup` (мова → сезони → епізоди). Інакше застосунок вважає, що нічого не знайдено.

```json
{
  "file": "https://cdn.example.com/movie.m3u8",
  "poster": "https://cdn.example.com/poster.jpg",
  "subtitle": [{ "title": "Українська", "url": "https://example.com/subs/uk.srt", "lang": "uk", "format": "srt" }]
}
```

```json
{
  "playerLangGroup": [
    {
      "title": "Українська",
      "seasons": [
        {
          "title": "Сезон 1",
          "number": 1,
          "episodes": [
            {
              "title": "Епізод 1",
              "number": 1,
              "file": "https://cdn.example.com/s1e1.m3u8",
              "id": "s1e1",
              "poster": "https://cdn.example.com/s1e1.jpg",
              "subtitle": [{ "title": "UA", "url": "https://example.com/subs/s1e1.vtt", "lang": "uk", "format": "vtt" }]
            }
          ]
        }
      ]
    }
  ]
}
```

- Обов'язкові: `title` у групи / сезону / епізоду, `file` в епізоду, `seasons`, `episodes`, **`number` у сезону й епізоду** — власний номер з джерела, або `null` для спецвипусків і об'єднаних серій («Серія 1-2»). Застосунок не читає номери з назв: від `number` залежать історія, «Продовжити», позначки «S2 E5» і відкриття з екрана сезону / серії.
- Необов'язкове `start: { "langGroup": 0, "season": 0, "episode": 2 }` (індекси в поверненому `playerLangGroup`) — де почати «Продовжити»; має перевагу над номерами.
- `id` епізоду — **рядок**.
- `subtitle` — масив `{title, url, lang, format}`. `lang` — код мови BCP 47 (`uk`, `en`, …) або `null`; `format` — `srt`, `vtt`, `ass`, `ttml` або `null` (тоді WebVTT). Застосунок нічого не вгадує з назви чи розширення. За замовчуванням увімкнено перший трек мовою застосунку, інакше перший у списку.

### `dataList`: масив записів

```json
[
  {
    "title": "Назва запису",
    "link": "https://example.com/item/1",
    "fields": { "Рік": "2024", "Якість": "1080p", "poster": "https://example.com/1.jpg" }
  }
]
```

`fields` показуються як «ключ: значення» (до 4 полів, без `title` і `poster`); `poster` (URL `https://` зображення) показується як картинка. Не кладіть у `fields` службових значень. Кнопка «Відкрити» відкриває `link`.

`link` відкривається лише якщо це `https://` з хостом або `magnet:` з `xt=urn:btih:` (BitTorrent v1; v2-магнети лише з `btmh` не підтримуються). Інші схеми (`http:`, `intent:`, `file:`, `javascript:` тощо) не відкриваються, користувач бачить повідомлення про заблоковане посилання.

Необов'язкове `"resume": true`: у запуску з `params.resume === true` застосунок одразу відтворює цей запис (`torrentUrl`, інакше відкриває `link`) замість списку.

Необов'язкове `torrentUrl` — адреса `.torrent`-файлу (HTTPS), потрібен дозвіл `torrent`. Тоді з'являється кнопка «Дивитися»: застосунок сам завантажує файл з cookies плагіна, з тими ж перевірками адрес, що й `pluginRequest`, і розміром до 4 МБ, та відтворює з пам'яті, нічого не записуючи на диск (що саме — див. `mapTorrentFiles`). За замовчуванням застосунок не роздає дані іншим учасникам; користувач може ввімкнути роздачу в налаштуваннях торрентів.

---

## Функції хоста (`sendMessage`)

Плагін звертається до застосунку через `await sendMessage(channel, JSON.stringify(args))`. Типізовані обгортки — `src/shared/libs/host.ts` і `src/shared/client/mainClient.ts`.

### `pluginRequest` — HTTP-запит (`network`)

`fetch` і `XMLHttpRequest` у рушії **вимкнені**; усі запити йдуть через цей канал. У SDK — `fetchFlutter(url, options)` (а також `fetchText` / `fetchJson`): повертає `{statusCode, data, headers}` і кидає `PluginRequestError`, коли відповіді немає (відмова хоста, мережа, статус ≥ 500) або статус ≥ 400 (`allowErrorStatus: true`, щоб отримати таку сторінку). Текст помилки варто показати користувачу (`errorResponse(e.message)`).

```typescript
import { fetchFlutter, fetchText, PluginRequestError } from '../client/mainClient.ts';

const html = await fetchText('https://example.com/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  data: { q: 'Breaking Bad' },
});
const res = await fetchFlutter('https://example.com/api', { queryParameters: { id: '42' } });
```

> До версії SDK з дозволами `fetchFlutter(url, method, headers, data, followRedirects)` приймав позиційні аргументи, повертав `null` замість помилки й не йшов за перенаправленнями. Під час оновлення: `if (!res) return null` → `try { … } catch (e) { … }`, позиційні аргументи → об'єкт опцій.

Сам канал:

```javascript
const raw = await sendMessage('pluginRequest', JSON.stringify({
  url: 'https://example.com/search', method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  data: { q: 'Breaking Bad' }, followRedirects: true,
}));
const res = JSON.parse(raw); // { statusCode, headers, data } або { error }
```

- Аргументи: `url`, `method` — обов'язкові; `headers`, `queryParameters`, `data` (об'єкт або рядок), `followRedirects` (у каналі типово `false`; `fetchFlutter` у SDK передає `true`).
- Об'єкт `data` з `Content-Type: application/x-www-form-urlencoded` кодується у форму.
- Відповідь — JSON-рядок `{statusCode, headers, data}` (`headers` — значення через кому; `data` — рядок, або вже розібраний об'єкт для JSON-відповідей) чи `{error}`.
- Лише `https://` з дійсним сертифікатом. Заборонені адреси пристрою й локальної мережі: `localhost`, `*.local`, приватні, loopback, link-local і CGNAT діапазони IPv4 / IPv6. Перевіряється IP, на який вказує домен.
- З `followRedirects: true` до 5 перенаправлень; кожне проходить ту саму перевірку. POST після 301 / 302 / 303 стає GET, після 307 / 308 лишається POST.
- Статус ≥ 500 повертається як `{error}`. Тайм-аут з'єднання й отримання — 10 с.
- Cookie окремі для кожного плагіна й зберігаються до перезапуску застосунку; `User-Agent: Mozilla/5.0`, якщо не задано свій.

### `showDialogData` — вибір зі списку (`dialogs`)

```javascript
const index = await sendMessage('showDialogData', JSON.stringify({
  dialogData: {
    title: 'Оберіть варіант',
    cancelText: 'Скасувати',
    items: results.map(r => ({ title: r.title, poster: r.img, 'Рік': r.year })),
  },
}));
if (index === null || index === undefined) return cancelled; // 0 — валідний вибір
```

Кожен елемент: `title` — заголовок, `poster` (URL `https://` зображення) — картинка, решта — «ключ: значення». Повертає індекс обраного елемента або `null`.

`autoSelectTitleOption: true` (так робить вікно вибору назви в `searchDataGlobal`) додає під списком перемикач «Більше не питати»: якщо його увімкнено, застосунок далі передає цьому плагіну `autoSelectTitle: true`.

### `showDialogFields` — форма введення (`dialogs`)

```javascript
const values = await sendMessage('showDialogFields', JSON.stringify({
  dialogFields: {
    title: 'Вхід',
    applyText: 'Увійти',
    cancelText: 'Скасувати',
    saveData: true,
    items: [
      { label: 'Логін', fieldKey: 'login' },
      { label: 'Пароль', fieldKey: 'password', obscureText: true },
    ],
  },
}));
// { login: '…', password: '…' } або null при скасуванні
```

- `saveData: true` з `pluginSettingsKey` у конфігу й дозволом `savedFields` — значення зберігаються в захищеному сховищі й підставляються при наступному показі.
- `value` у полі — текст, з яким воно відкривається (наприклад, назва, за якою плагін щойно шукав). Збережене значення має перевагу над `value`.

### `getSavedData` — збережені поля (`savedFields`)

```javascript
const saved = await sendMessage('getSavedData', JSON.stringify({ savedFields: ['login', 'password'] }));
// { login: '…' | null, password: '…' | null }
```

### `getItemData` / `setItemData` — дані плагіна для тайтлів (`itemData`)

```javascript
await sendMessage('setItemData', JSON.stringify({
  key: 'tv:1399:page', value: JSON.stringify({ url: '…' }), label: 'Гра престолів — сторінка на сайті',
})); // true / false
const raw = await sendMessage('getItemData', JSON.stringify({ key: 'tv:1399:page' })); // рядок або null
await sendMessage('setItemData', JSON.stringify({ key: 'tv:1399:page', value: null })); // видалити
```

- Лише на пристрої, без синхронізації; видаляється разом із плагіном або репозиторієм. Окремо для кожного плагіна (той самий плагін у двох репозиторіях має окремі дані).
- Ключ 1..128 символів без переносу рядка; значення разом з `label` — до 8 КБ (UTF-8); до 2000 ключів на плагін. Перевищення — `false`, нічого не збережено.
- Користувач бачить записи у «Збережених даних» плагіна: `label`, якщо є, інакше сам ключ; може видалити будь-який. Тож давайте зрозумілі ключі й підписи.

### `showToast` — коротке повідомлення (`toast`, у фоні `toast.background`)

```javascript
await sendMessage('showToast', JSON.stringify({ text: '2 нові серії' })); // true / false
```

Показується як «<назва плагіна>: <текст>», один рядок до 120 символів (довший обрізається «…»). Не частіше ніж раз на 5 с для плагіна; зайві виклики повертають `false`.

### `setPluginInit` / `isPluginInit`

Прапорець «плагін ініціалізовано» в межах поточного запуску застосунку (наприклад, вхід уже виконано): `await sendMessage('setPluginInit', '{}')`, `await sendMessage('isPluginInit', '{}')` → `true/false`.

---

## Мінімальний `playerData`-плагін

```typescript
import { PlayerData, SearchParams } from '../types/index.ts';
import searchDataGlobal, { IFetchFunctionPromise } from '../libs/search-data.ts';
import { fetchJson } from '../client/mainClient.ts';
import { expose } from '../utils/utils.ts';

async function fetchFunction(params: SearchParams): Promise<IFetchFunctionPromise> {
  const found = await fetchJson<{ url?: string }>(
    `https://api.example.com/search?q=${encodeURIComponent(params.query)}`
  );
  // null — за цією назвою нічого, searchDataGlobal спробує наступну.
  return found.url ? new PlayerData({ file: found.url }) : null;
}

expose({ searchData: (params: SearchParams) => searchDataGlobal({ params, fetchFunction }) });
```

`searchDataGlobal` питає, з якої назви почати (якщо `autoSelectTitle` не задано й запуск не тихий), і пробує назви по черзі. Якщо жодна нічого не дала, показує форму «Нічого не знайдено» з назвою, яку можна виправити, і повторює, доки щось не знайдеться або користувач не скасує; назва, що спрацювала, запам'ятовується для тайтлу (`itemData`, ключ `<movie|tv>:<tmdbId>:title`) і наступного разу пробується першою без вибору. Вимикається `askTitle: false` (потрібні дозволи `dialogs` і `itemData`). `fetchFunction` повертає `PlayerData`, `null` (нічого за цією назвою) або рядок (зупинитися з цим повідомленням).
