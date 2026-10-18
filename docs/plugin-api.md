# Плагіни Movie Revizor

Плагін — це JavaScript-файл, який застосунок завантажує з репозиторію плагінів і виконує у власному QuickJS-рушії (`flutter_js`). Плагін шукає контент на сторонньому сервісі й повертає застосунку посилання на відео (`playerData`) або список довідкових записів (`dataList`).

Готові типи, клієнт `fetchFlutter` і приклади плагінів — у `src/shared/` цього репозиторію.

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
| `shortDescription` | ні | текст картки в списку плагінів |
| `pluginSettingsKey` | ні | ключ, під яким зберігаються дані користувача (`showDialogFields` з `saveData`, `getSavedData`) |
| `sha256` | ні | SHA-256 файлу `src` (hex). Файл з іншим вмістом застосунок не використовує |

- Плагін визначають URL репозиторію, `src`, `title` і `type`. Зміна `version` — оновлення того самого плагіна (стан «увімкнено» і збережені дані лишаються); зміна будь-якого з цих чотирьох полів дає новий, вимкнений плагін.
- URL репозиторію і `src` — лише `https://`.
- Скрипт кешується за парою `src` + `version`. **Щоб користувачі отримали новий код, підвищуйте `version`** (і оновлюйте `sha256`).
- Застосунок стартує з кешованими скриптами, а репозиторії перевіряє у фоні після старту та за кнопкою «Перевірити оновлення».
- Нова версія замінює робочу лише тоді, коли її скрипт завантажився і виконався. Інакше далі працює попередня версія (і після перезапуску), а користувач бачить, що оновлення не встановилося.
- Завантаження скрипта і його перше виконання мають вкластися в 10 с кожне. Якщо новий плагін не виконується (помилка або немає функції точки входу), його вимикають.

---

## Точки входу

Скрипт має оголосити глобальну функцію з назвою, що відповідає типу:

| `type` | Функція | Де викликається |
|--------|---------|-----------------|
| `playerData` | `searchData(params)` | кнопки на екранах фільму, серіалу, сезону, епізоду |
| `dataList` | `getDataList(params)` | кнопки пошуку на екранах деталей |
| `testPlugin` | `runTest(params)` | з UI не викликається |

Якщо функції немає, плагін вимикається з помилкою. Функція може бути `async`; вона повертає **JSON-рядок** `FlutterResponse`:

```javascript
class FlutterResponse {
  constructor({ result = '', isError = false }) {
    this.result = result;   // рядок: JSON з даними або текст помилки
    this.isError = isError; // true — помилка / скасування (для playerData result показується як toast)
  }
}

return JSON.stringify(new FlutterResponse({ result: JSON.stringify(data), isError: false }));
```

`result` — завжди рядок; дані серіалізуються двічі.

- `params` приходить готовим об'єктом; рядки передаються без змін (лапки, `\`, переноси рядків).
- Виняток або відхилений проміс стає помилкою з текстом винятку (`isError: true`).
- Виклик, що понад 45 с не робить жодного `sendMessage` і не завершується, перериває хост з помилкою «Плагін не відповідає». Час усередині `sendMessage` (запити, діалоги, де користувач обирає) не враховується.

### Параметри `searchData`

| Ключ | Тип | Опис |
|------|-----|------|
| `query` | string | перший варіант назви |
| `fallbackTitles` | string[] | інші варіанти: локалізована / оригінальна назва, кожна ще й з роком |
| `isSerial` | bool? | серіал |
| `isMovie` | bool? | фільм |
| `isPerson` | bool? | персона |
| `seasonNumber`, `episodeNumber` | int? | заповнені на екранах сезону / епізоду |
| `seriesTitle` | string? | назва серіалу на екранах сезону / епізоду; тоді `query` = `"<серіал> <назва сезону/епізоду>"` |

### Параметри `getDataList`

| Ключ | Тип | Опис |
|------|-----|------|
| `query` | string | назва (локалізована, інакше оригінальна) |
| `serialID` | int? | TMDB id серіалу (для фільмів `null`) |
| `isSerial` | bool? | серіал |
| `traktId`, `traktIds` | — | зараз завжди `null` |

---

## Формат результату

### `playerData`: `PlayerData`

Фільм — потрібен `file`; серіал — потрібен `playerLangGroup` (мова → сезони → епізоди). Інакше застосунок вважає, що нічого не знайдено.

```json
{
  "file": "https://cdn.example.com/movie.m3u8",
  "poster": "https://cdn.example.com/poster.jpg",
  "subtitle": [{ "title": "Українська", "url": "https://example.com/subs/uk.srt" }]
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
          "episodes": [
            {
              "title": "Епізод 1",
              "file": "https://cdn.example.com/s1e1.m3u8",
              "id": "s1e1",
              "poster": "https://cdn.example.com/s1e1.jpg",
              "subtitle": [{ "title": "UA", "url": "https://example.com/subs/s1e1.srt" }]
            }
          ]
        }
      ]
    }
  ]
}
```

- Обов'язкові: `title` у групи / сезону / епізоду, `file` в епізоду, `seasons`, `episodes`.
- `id` епізоду — **рядок** (число зламає розбір).
- `subtitle` — масив `{title, url}`, не рядок.

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

`fields` показуються як «ключ: значення» (до 4 полів, без `title` і без значень, що починаються з `http`). Кнопка «Відкрити» відкриває `link`.

---

## Функції хоста (`sendMessage`)

Плагін звертається до застосунку через `await sendMessage(channel, JSON.stringify(args))`.

### `pluginRequest` — HTTP-запит

`fetch` і `XMLHttpRequest` у рушії **вимкнені**; усі запити йдуть через цей канал.

```javascript
async function fetchUrl(url, { method = 'GET', headers = {}, data = null, queryParameters = null, followRedirects = true } = {}) {
  const raw = await sendMessage('pluginRequest', JSON.stringify({
    url, method, headers, data, queryParameters, followRedirects,
  }));
  const res = JSON.parse(raw);
  if (res.error) throw new Error(res.error);
  if (res.statusCode >= 400) throw new Error('HTTP ' + res.statusCode);
  return res.data;
}

const html = await fetchUrl('https://example.com/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  data: { q: 'Breaking Bad' },
});
```

- Аргументи: `url`, `method` — обов'язкові; `headers`, `queryParameters`, `data` (об'єкт або рядок), `followRedirects` (типово `false`).
- Об'єкт `data` з `Content-Type: application/x-www-form-urlencoded` кодується у форму.
- Відповідь — JSON-рядок `{statusCode, headers, data}` (`headers` — значення через кому; `data` — рядок, або вже розібраний об'єкт для JSON-відповідей) чи `{error}`.
- Лише `https://` з дійсним сертифікатом. Заборонені адреси пристрою й локальної мережі: `localhost`, `*.local`, приватні, loopback, link-local і CGNAT діапазони IPv4 / IPv6. Перевіряється IP, на який вказує домен, тож обійти це доменним ім'ям не вийде.
- З `followRedirects: true` до 5 перенаправлень; кожне проходить ту саму перевірку (перехід на `http` чи локальну адресу дає `{error}`). POST після 301 / 302 / 303 стає GET, після 307 / 308 лишається POST.
- Статус ≥ 500 повертається як `{error}`. Тайм-аут з'єднання й отримання — 10 с.
- Cookie окремі для кожного плагіна й зберігаються до перезапуску застосунку; `User-Agent: Mozilla/5.0`, якщо не задано свій.

### `showDialogData` — вибір зі списку

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

Кожен елемент — довільні поля: `title` — заголовок, значення-URL на `.jpg/.jpeg/.png/.webp` показуються як постер, решта — як «ключ: значення». Повертає індекс обраного елемента або `null`.

### `showDialogFields` — форма введення

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

З `saveData: true` і заданим `pluginSettingsKey` у конфігу значення зберігаються в захищеному сховищі й підставляються при наступному показі.

### `getSavedData` — збережені значення

```javascript
const saved = await sendMessage('getSavedData', JSON.stringify({ savedFields: ['login', 'password'] }));
// { login: '…' | null, password: '…' | null }
```

### `setPluginInit` / `isPluginInit`

Прапорець «плагін ініціалізовано» в межах поточного запуску застосунку (наприклад, вхід уже виконано): `await sendMessage('setPluginInit', '{}')`, `await sendMessage('isPluginInit', '{}')` → `true/false`.

---

## Мінімальний `playerData`-плагін

```javascript
async function searchData(params) {
  const error = (text) => JSON.stringify(new FlutterResponse({ result: text, isError: true }));

  const titles = [params.query, ...(params.fallbackTitles || [])]
    .filter((t, i, arr) => t && t.trim() !== '' && arr.indexOf(t) === i);

  for (const title of titles) {
    let playerData;
    try {
      playerData = await fetchPlayerDataForQuery(title, params.isSerial);
    } catch (e) {
      console.log(`Помилка для "${title}": ${e}`);
      continue;
    }
    const valid = params.isSerial
      ? playerData?.playerLangGroup?.length > 0
      : !!playerData?.file;
    if (valid) {
      return JSON.stringify(new FlutterResponse({ result: JSON.stringify(playerData), isError: false }));
    }
  }
  return error(`Нічого не знайдено: ${params.query}`);
}
```

`fetchPlayerDataForQuery` — функція, специфічна для сервісу: пошук через `fetchUrl`, вибір результату через `showDialogData`, розбір сторінки у `PlayerData`.
