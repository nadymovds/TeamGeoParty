# Задачи по исправлению загрузки карт и панорамы

## 🔴 Критические задачи (необходимо выполнить в первую очередь)

### Задача 1: Рефакторинг структуры App.tsx для предотвращения перемонтирования GoogleMapsProvider ✅
**Файлы**: `src/App.tsx`
**Приоритет**: 🔴 КРИТИЧЕСКИЙ
**Оценка**: Средняя сложность

- [x] Создать новый компонент `GameContentInner` который будет принимать `game` как проп
- [x] Переместить всю логику `renderScreen()` в `GameContentInner`
- [x] Обернуть `GameContentInner` в `GoogleMapsProvider` на уровне `GameContent`
- [x] Убедиться, что `GoogleMapsProvider` монтируется один раз и не сбрасывается при смене статуса игры
- [x] Проверить, что `game.googleApiKey` доступен до рендеринга провайдера

**Детали реализации**:
```tsx
// Структура должна быть:
const GameContent = ({ gameId }) => {
  const game = useQuery(...);

  if (!game) return <Loading />;

  return (
    <GoogleMapsProvider apiKey={game.googleApiKey}>
      <GameContentInner game={game} gameId={gameId} />
    </GoogleMapsProvider>
  );
};

const GameContentInner = ({ game, gameId }) => {
  // Вся логика heartbeat, auto-start, auto-finish
  // Вся логика renderScreen()
  return renderScreen();
};
```

---

### Задача 2: Добавить проверку isLoaded в GuessScreen ✅
**Файлы**: `src/screens/GuessScreen.tsx`
**Приоритет**: 🔴 КРИТИЧЕСКИЙ
**Оценка**: Низкая сложность

- [x] Импортировать `useGoogleMaps` из `../contexts/GoogleMapsContext`
- [x] Добавить `const { isLoaded } = useGoogleMaps();` в компонент
- [x] Добавить проверку `!isLoaded` в условие раннего возврата
- [x] Обновить сообщение загрузки для отображения "Загрузка карт..." когда `!isLoaded`
- [x] Протестировать, что компоненты Map и StreetView рендерятся только после загрузки API

**Детали реализации**:
```tsx
export const GuessScreen: React.FC<GuessScreenProps> = ({ gameId }) => {
  const { isLoaded } = useGoogleMaps();
  // ... остальные хуки ...

  if (!game || !activeLocation || !currentPlayer || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">
          {!isLoaded ? "Загрузка карт..." : "Загрузка..."}
        </div>
      </div>
    );
  }
  // ... остальной код ...
}
```

---

## 🟡 Важные задачи (выполнить после критических)

### Задача 3: Добавить библиотеки в useJsApiLoader ✅
**Файлы**: `src/contexts/GoogleMapsContext.tsx`
**Приоритет**: 🟡 ВЫСОКИЙ
**Оценка**: Низкая сложность

- [x] Добавить константу `const libraries: Libraries = ["geometry", "places"];` перед компонентом
- [x] Передать `libraries` в `useJsApiLoader`
- [x] Убедиться, что типы корректны (может потребоваться импорт типа `Libraries`)
- [x] Проверить, что Street View Service работает корректно

**Детали реализации**:
```tsx
import { useJsApiLoader, Libraries } from "@react-google-maps/api";

const libraries: Libraries = ["geometry", "places"];

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  apiKey,
  children,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });
  // ... остальной код ...
};
```

---

### Задача 4: Увеличить таймаут перед стартом первого раунда ✅
**Файлы**: `src/App.tsx`
**Приоритет**: 🟡 СРЕДНИЙ
**Оценка**: Низкая сложность

- [x] Найти useEffect с автостартом первого раунда (строка ~51-77)
- [x] Изменить таймаут с 100ms на 500ms
- [x] Добавить комментарий, объясняющий причину задержки
- [x] Опционально: добавить проверку `isLoaded` из GoogleMapsContext перед стартом

**Детали реализации**:
```tsx
// Auto-start first round when all players are ready and game is in SETUP
useEffect(() => {
  if (
    game?.status === "SETUP" &&
    players &&
    locations &&
    players.every((p) => p.isReady) &&
    locations.length > 0
  ) {
    // ... sort locations ...

    // Увеличенная задержка для гарантии загрузки Google Maps API
    const timer = setTimeout(async () => {
      const firstLocation = sortedLocations[0];
      if (firstLocation) {
        await startRound({
          gameId,
          locationId: firstLocation._id,
          round: 1,
        });
      }
    }, 500); // Изменено с 100 на 500
    return () => clearTimeout(timer);
  }
}, [game?.status, players, locations, gameId, startRound]);
```

---

### Задача 5: Добавить проверку isLoaded в RoundResultScreen ✅
**Файлы**: `src/screens/RoundResultScreen.tsx`
**Приоритет**: 🟡 СРЕДНИЙ
**Оценка**: Низкая сложность

- [x] Импортировать `useGoogleMaps` из `../contexts/GoogleMapsContext`
- [x] Добавить `const { isLoaded } = useGoogleMaps();`
- [x] Добавить проверку `!isLoaded` в условие раннего возврата
- [x] Обновить сообщение загрузки

**Аналогично Задаче 2**

---

### Задача 6: Добавить проверку isLoaded в SetupScreen ✅
**Файлы**: `src/screens/SetupScreen.tsx`
**Приоритет**: 🟡 СРЕДНИЙ
**Оценка**: Низкая сложность

- [x] Импортировать `useGoogleMaps` из `../contexts/GoogleMapsContext`
- [x] Добавить `const { isLoaded } = useGoogleMaps();`
- [x] Добавить проверку `!isLoaded` в условие раннего возврата
- [x] Обновить сообщение загрузки

**Аналогично Задаче 2**

---

## 🔵 Опциональные задачи (улучшения)

### Задача 7: Добавить обработку ошибок загрузки Google Maps
**Файлы**: `src/contexts/GoogleMapsContext.tsx`, все экраны
**Приоритет**: 🔵 НИЗКИЙ
**Оценка**: Средняя сложность

- [ ] В `GoogleMapsContext` добавить проверку `loadError`
- [ ] Показывать информативное сообщение об ошибке если API не загрузился
- [ ] Добавить кнопку "Попробовать снова"
- [ ] Логировать ошибки в консоль для отладки

**Детали реализации**:
```tsx
export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  apiKey,
  children,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  if (loadError) {
    console.error("Google Maps loading error:", loadError);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">
            Ошибка загрузки Google Maps
          </p>
          <p className="text-gray-600">
            Проверьте API ключ и интернет-соединение
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
```

---

### Задача 8: Временно отключить StrictMode для тестирования
**Файлы**: `src/main.tsx`
**Приоритет**: 🔵 ТЕСТИРОВАНИЕ
**Оценка**: Очень низкая сложность

- [ ] Закомментировать `<React.StrictMode>` обертку
- [ ] Протестировать работу приложения
- [ ] Если проблема решается - добавить TODO для правильной обработки двойного монтирования
- [ ] Вернуть StrictMode после исправления основных проблем

**Детали реализации**:
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  // TODO: Вернуть после исправления проблем с двойным монтированием
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
)
```

---

### Задача 9: Добавить индикаторы состояния загрузки
**Файлы**: `src/contexts/GoogleMapsContext.tsx`, `src/components/Map.tsx`, `src/components/StreetView.tsx`
**Приоритет**: 🔵 НИЗКИЙ (UX улучшение)
**Оценка**: Низкая сложность

- [ ] Добавить визуальный спиннер загрузки
- [ ] Добавить процент загрузки (если доступно из API)
- [ ] Улучшить сообщения о состоянии загрузки
- [ ] Добавить анимацию появления карты после загрузки

---

### Задача 10: Добавить логирование для мониторинга
**Файлы**: `src/contexts/GoogleMapsContext.tsx`, `src/App.tsx`
**Приоритет**: 🔵 НИЗКИЙ
**Оценка**: Низкая сложность

- [ ] Логировать время начала загрузки Google Maps API
- [ ] Логировать время завершения загрузки
- [ ] Логировать переходы между состояниями игры
- [ ] Добавить условное логирование только в dev режиме

**Детали реализации**:
```tsx
useEffect(() => {
  if (isLoaded) {
    console.log("[GoogleMaps] API loaded successfully");
  }
}, [isLoaded]);

useEffect(() => {
  if (loadError) {
    console.error("[GoogleMaps] API loading failed:", loadError);
  }
}, [loadError]);
```

---

## 📋 Чеклист тестирования

После выполнения всех критических и важных задач:

- [ ] Протестировать переход из SETUP в PLAYING - не должно быть белого экрана
- [ ] Протестировать загрузку панорамы на GuessScreen
- [ ] Протестировать загрузку карты на GuessScreen
- [ ] Протестировать на медленном интернет-соединении (throttling в DevTools)
- [ ] Протестировать с отключенным кешем браузера
- [ ] Проверить отсутствие автоматических перезагрузок страницы
- [ ] Проверить работу с несколькими игроками
- [ ] Проверить все переходы между экранами (LOBBY → SETUP → PLAYING → RESULTS → FINAL)
- [ ] Проверить консоль на наличие ошибок
- [ ] Проверить работу в production build (`npm run build && npm run preview`)

---

## 🎯 Порядок выполнения (рекомендуемый)

1. **Задача 1** - Рефакторинг App.tsx (решает основную проблему)
2. **Задача 2** - Проверка isLoaded в GuessScreen (предотвращает рендеринг до загрузки)
3. **Тестирование** - Проверить, решены ли основные проблемы
4. **Задача 3** - Добавить библиотеки
5. **Задача 4** - Увеличить таймаут
6. **Задачи 5-6** - Добавить проверки в остальные экраны
7. **Тестирование** - Полное регрессионное тестирование
8. **Задачи 7-10** - Опциональные улучшения по необходимости

---

## ⚠️ Важные замечания

1. **Не коммитить** изменения до полного тестирования
2. **Создать бэкап** текущей версии перед началом работы
3. **Тестировать после каждой задачи**, а не все сразу
4. **Использовать git** для отката в случае проблем
5. **Проверять API ключ** - убедиться что у него есть все необходимые разрешения

---

## 📝 Дополнительная информация

### Связанные файлы
- `src/App.tsx` - основная логика переходов между экранами
- `src/contexts/GoogleMapsContext.tsx` - контекст загрузки Google Maps
- `src/screens/GuessScreen.tsx` - экран с панорамой и картой
- `src/screens/SetupScreen.tsx` - экран настройки локаций
- `src/screens/RoundResultScreen.tsx` - экран результатов раунда
- `src/components/Map.tsx` - компонент карты
- `src/components/StreetView.tsx` - компонент панорамы

### Полезные ссылки
- [React Google Maps API Documentation](https://react-google-maps-api-docs.netlify.app/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [useJsApiLoader hook](https://react-google-maps-api-docs.netlify.app/#usejsapiloader)
