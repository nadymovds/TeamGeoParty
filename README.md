# TeamGeo - Team Geography Game

Мультиплеерная браузерная игра для тимбилдинга, где игроки загадывают места на карте, а остальные пытаются их угадать.

## Технологии

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Convex (realtime database + functions)
- **Maps**: Google Maps JS API
- **Hosting**: GitHub Pages

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка Convex

```bash
npx convex dev
```

Следуйте инструкциям для создания Convex проекта. Это создаст файл `.env.local` с `VITE_CONVEX_URL`.

### 3. Запуск разработки

```bash
npm run dev
```

### 4. Сборка для продакшена

```bash
npm run build
```

## Структура проекта

```
├── src/
│   ├── App.tsx              # Главный компонент с роутингом
│   ├── main.tsx             # Точка входа
│   ├── convexClient.ts      # Клиент Convex
│   ├── utils.ts             # Утилиты (sessionId, URL)
│   ├── screens/             # Экраны игры
│   │   ├── CreateGameScreen.tsx
│   │   ├── LobbyScreen.tsx
│   │   ├── SetupScreen.tsx
│   │   ├── GuessScreen.tsx
│   │   ├── RoundResultScreen.tsx
│   │   └── FinalScreen.tsx
│   └── components/          # Компоненты
│       ├── Map.tsx          # Google Maps компонент
│       ├── PlayerList.tsx   # Список игроков
│       └── ScoreTable.tsx   # Таблица результатов
└── convex/                  # Backend (Convex)
    ├── schema.ts            # Схема базы данных
    ├── games.ts             # Мутации и запросы игр
    ├── players.ts           # Мутации и запросы игроков
    ├── locations.ts         # Мутации и запросы локаций
    ├── guesses.ts           # Мутации и запросы предположений
    └── utils.ts             # Утилиты (Haversine)
```

## Как играть

1. **Создание игры**: Хост вводит имя и Google Maps API ключ
2. **Лобби**: Игроки присоединяются по ссылке
3. **Настройка**: Каждый игрок добавляет N локаций на карте с подсказками
4. **Игра**: В каждом раунде показывается подсказка, игроки угадывают место
5. **Результаты**: После каждого раунда показываются результаты и очки
6. **Финал**: Показывается итоговая таблица лидеров

## Состояния игры

- `LOBBY` - Игроки присоединяются
- `SETUP` - Игроки добавляют локации
- `PLAYING` - Игроки угадывают локацию
- `RESULTS` - Показываются результаты раунда
- `FINAL` - Финальная таблица

## Google Maps API

Для работы нужен Google Maps JavaScript API ключ:
1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com/)
2. Включите Maps JavaScript API
3. Создайте API ключ
4. Введите его при создании игры

## Деплой на GitHub Pages

1. Настройте GitHub Actions workflow (см. `.github/workflows/deploy.yml`)
2. Установите `VITE_CONVEX_URL` в Secrets репозитория
3. При пуше в `main` произойдет автоматический деплой

## Лицензия

MIT
