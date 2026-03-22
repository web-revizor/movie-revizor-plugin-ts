# Документація модуля плагінів

Папка `shared` містить спільну бібліотеку функцій та типів для роботи з пошуком контенту за допомогою API. Він
забезпечує
стандартизовані інтеграції з різними джерелами даних (сервіси, платформи тощо).

Посилання на поточний
репозиторій [Link](https://raw.githubusercontent.com/web-revizor/movie-revizor-plugin-ts/refs/heads/main/repository.json).

## 📁 Структура модуля

```
src/shared/
├── types/              # Типи та інтерфейси
│   └── index.ts        # Основні типове дані
├── client/             # Клієнтські функції
│   └── mainClient.ts   # Функція fetchFlutter()
├── libs/               # Бібліотеки
│   └── search-data.ts  # Пошукова логіка
└── plugins/            # Приклади та реалізації
    └── example.ts      # Приклад інтеграції
```

## 🔧 Основні компоненти

### 1. Типи даних (`src/shared/types/index.ts`)

#### `SearchParams` - Параметри пошуку

```typescript
interface SearchParams {
    query: string;           // Запит пошуку
    fallbackTitles?: string[]; // Резервні назви для альтернативного пошуку
    isSerial: boolean;       // Чи є це серіалом (з сезонами)
}
```

#### `CardItem` - Картка результату попереднього пошуку

```typescript
interface CardItem {
    title: string | null;    // Назва контенту
    href?: string | null;    // Посилання на контент
    img?: string | null;     // Зображення
    rating?: number | null;  // Рейтинг
    year?: string | null;    // Рік виходу
    genre?: string | null;   // Жанр
}
```

#### `PlayerData` - Дані про медіа

```typescript
class PlayerData {
    file: string | null;           // Посилання на файл
    subtitle: SubtitleResult;      // Субтитри
    poster: string | null;         // Обкладинка
    playerLangGroup: PlayerLangGroup[] | null; // Мовні групи з сезонами
}

class PlayerSeason {
    title: string;           // Назва сезону
    episodes: PlayerEpisode[]; // Епізоди сезону
}

class PlayerEpisode {
    title: string;       // Назва епізоду
    file: string;        // Посилання на файл
    id?: number | string; // Унікальний ID
    poster?: string | null; // Обкладинка
    subtitle?: SubtitleResult[]; // Субтитри
}

class PlayerLangGroup {
    title: string;           // Назва мовної групи
    seasons: PlayerSeason[]; // Сезони в цій групі
}
```

#### `FlutterResponse` - Відповідь від Flutter-сервісу

```typescript
class FlutterResponse {
    result: string;         // JSON дані результату
    isError: boolean;       // Чи була помилка
}
```

### 2. Функція пошуку (`src/shared/libs/search-data.ts`)

#### `searchDataGlobal()` - Основна функція пошуку

**Параметри:**

- `params`: Об'єкт з параметрами пошуку
- `fetchFunction`: Функція для отримання даних (реалізується в plugin)

**Тип повернення:**

```typescript
type IFetchFunctionPromise = PlayerData | null | string;
// - PlayerData: Успішний результат
// - null: Помилка пошуку
// - string: Повідомлення про помилку (наприклад, "Скасовано користувачем")
```

**Логіка роботи:**

1. Об'єднує основний запит та резервні назви (`fallbackTitles`)
2. Якщо є кілька варіантів - показує діалогове вікно для вибору
3. Викликає `fetchFunction()` з обраним запитом
4. Перевіряє результат:
    - Для серіалів: перевіряє наявність `playerLangGroup`
    - Для інших контенту: перевіряє наявність `file`
5. Повертає JSON відповідь у форматі FlutterResponse

**Приклад використання:**

```typescript
import searchDataGlobal from '@/src/shared/libs/search-data.ts';

async function myFetchFunction(query: string, isSerial: boolean) {
    // Реалізуйте логіку отримання даних
    return playerData; // або null/помилка
}

const result = await searchDataGlobal({
    params: {
        query: 'назва пошуку',
        fallbackTitles: ['альтернатива1', 'альтернатива2'],
        isSerial: false,
    },
    fetchFunction: myFetchFunction,
});

console.log(result); // JSON відповідь або помилка
```

### 3. Клієнтська логіка (`src/shared/client/mainClient.ts`)

#### `fetchFlutter()` - Запит до Flutter-сервісу

**Параметри:**

- `url`: URL для запиту
- `method`: HTTP метод ('GET' | 'POST', за замовчуванням 'GET')
- `extraHeaders`: Додаткові заголовки (за замовчуванням порожній об'єкт)
- `data`: Дані для відправки (за замовчуванням null)
- `followRedirects`: Чи слідкувати за редиректами (за замовчуванням false)

**Повернення:**

```typescript
{
    data: string,           // JSON дані відповіді
        headers
:
    Record<string, string>  // Заголовки відповіді
}
```

**Приклад використання:**

```typescript
import {fetchFlutter} from '@/src/shared/client/mainClient.ts';

const response = await fetchFlutter(
    'https://api.example.com/search',
    'GET',
    {'X-Custom-Header': 'value'},
    null,
    false
);

if (response) {
    console.log(JSON.parse(response.data)); // JSON дані | null
}
```

### 4. Приклад інтеграції (`src/shared/plugins/example.ts`)

Цей файл демонструє, як реалізувати власний plugin для пошуку.

**Крок 1: Створення файлу в папці `plugins/`**

```typescript
// src/shared/plugins/ваш_plugin_name.ts
import {CardItem, PlayerData, SearchParams} from '@/src/shared/types';
import searchDataGlobal, {IFetchFunctionPromise} from '@/src/shared/libs/search-data.ts';
import {fetchFlutter} from '@/src/shared/client/mainClient.ts';

async function fetchFunction(
    query: string,
    isSerial: boolean
): Promise<IFetchFunctionPromise> {
    // Реалізуйте логіку отримання даних
    return playerData;
}

async function searchData(params: SearchParams): Promise<string> {
    return searchDataGlobal({params, fetchFunction});
}

// Обов'язково додайте до глобального об'єкта
globalThis.searchData = searchData;
```

**Крок 2: Реалізація fetchFunction()**

1. **Отримайте відповідь від API:**
   ```typescript
   const searchResponse = await fetchFlutter(
     `${rootUrl}/?query=${encodeURIComponent(query)}&is_serial=${isSerial}`
   );
   ```

2. **Обробка результатів пошуку:**
    - Якщо є кілька варіантів - показуйте діалогове вікно для вибору
    - Використовуйте `sendMessage('showDialogData', ...)` для інтерактивності

3. **Підготовка даних до відправки:**
   ```typescript
   const playerDataString = searchResponse.data;
   const playerData: PlayerData | null = JSON.parse(playerDataString);
   return playerData;
   ```

## 🔄 Робота з діалоговими вікнами

Модуль підтримує інтерактивні діалоги для вибору контенту:

### Показати діалогове вікно

```typescript
const index = await sendMessage(
    'showDialogData',
    JSON.stringify({
        dialogData: {
            title: 'Заголовок',
            cancelText: 'Скасувати',
            items: [
                {title: 'Варіант 1'},
                {title: 'Варіант 2'}
            ]
        }
    })
);

if (index === null || index === undefined) {
    // Користувач скасував діалог
} else {
    // index - це індекс обраного варіанту
    const selected = items[index];
}
```

### Обробка помилок

- `null` або `undefined` - помилка пошуку
- Струнне значення - повідомлення про помилку (наприклад, "Скасовано користувачем")
- `PlayerData` об'єкт - успішний результат

## 📝 Приклад повної інтеграції

```typescript
// 1. Імпорт необхідних функцій
import {CardItem, PlayerData} from '@/src/shared/types';
import searchDataGlobal from '@/src/shared/libs/search-data.ts';
import {fetchFlutter} from '@/src/shared/client/mainClient.ts';

// 2. Реалізуйте fetchFunction для вашого API
async function myFetchFunction(query: string, isSerial: boolean) {
    const response = await fetchFlutter(
        `https://api.my-service.com/search?query=${encodeURIComponent(query)}&is_serial=${isSerial}`
    );

    if (!response || !response.data) return null;

    // Обробка результатів пошуку з картками
    const cards: CardItem[] = JSON.parse(response.data);

    // Якщо є кілька варіантів - показуйте діалог
    if (cards.length > 1) {
        const index = await sendMessage(
            'showDialogData',
            JSON.stringify({
                dialogData: {
                    title: `Оберіть для "${query}"`,
                    cancelText: 'Скасувати',
                    items: cards.map(c => ({title: c.title}))
                }
            })
        );

        if (index === null || index === undefined) return null;

        // Отримайте обраний варіант
        const selectedCard = cards[index];

        // Отримайте детальні дані про файл
        const fileResponse = await fetchFlutter(selectedCard.href);

        if (!fileResponse) return null;

        return JSON.parse(fileResponse.data);
    }

    // Якщо є один варіант -直接使用 його
    const card = cards[0];
    const fileResponse = await fetchFlutter(card.href);

    if (!fileResponse) return null;

    return JSON.parse(fileResponse.data);
}

// 3. Використайте searchDataGlobal
async function searchContent() {
    try {
        const result = await searchDataGlobal({
            params: {
                query: 'пошук контенту',
                fallbackTitles: ['резервна назва1', 'резервна назва2'],
                isSerial: false, // true для серіалів з сезонами
            },
            fetchFunction: myFetchFunction,
        });

        console.log('Пошуковий результат:', result);

        // Обробка результату
        if (result && typeof result === 'object') {
            const data = JSON.parse(result);

            if (data.isError) {
                console.error('Помилка:', data.result);
            } else {
                console.log('Успішний результат:', data.result);

                // Обробка PlayerData
                const playerData: PlayerData = JSON.parse(data.result);
                console.log('Файл:', playerData.file);
                console.log('Постер:', playerData.poster);
            }
        }
    } catch (error) {
        console.error('Помилка пошуку:', error);
    }
}

```

## 📚 Додаткова інформація

- **Flutter API**: Використовуйте `fetchFlutter()` для всіх запитів до Flutter-сервісів
- **Типи даних**: Перевіряйте `src/shared/types/index.ts` для актуальних типів
- **Діалогові вікна**: Використовуйте `sendMessage('showDialogData', ...)` для інтерактивності
- **Помилки**: Обробляйте null, undefined та строкові повідомлення про помилки

---
