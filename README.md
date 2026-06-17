# Media Bio OS deploy

## Деплой на Vercel

1. Установи зависимости:

```bash
npm install
```

2. Запусти локально как Vercel-проект:

```bash
npx vercel dev
```

3. Задеплой:

```bash
npx vercel
npx vercel --prod
```

## Реальный счетчик просмотров

Для постоянного счетчика подключи Vercel KV:

1. Открой проект на Vercel.
2. Storage -> Create Database -> KV.
3. Подключи KV к проекту.
4. Vercel сам добавит переменные `KV_REST_API_URL`, `KV_REST_API_TOKEN` и другие.

Без KV API работает только как временный preview fallback.

## PIN владельца

Добавь Environment Variable:

```text
OWNER_PIN=1991
```

Можно поставить свой PIN. После входа владельца настройки сайта публикуются через `/api/state`, а посетители получают опубликованную тему и каталог.

## Файлы деплоя

- `vercel.json` - headers/cache config.
- `api/views.js` - serverless счетчик просмотров.
- `api/state.js` - serverless сохранение опубликованного профиля, темы и каталога.
- `index.html`, `styles.css`, `app.js` - фронтенд.
