# MyTrello

Kanban-доска в стиле Trello с несколькими досками, совместной работой и realtime-обновлениями.

## Возможности

- **Аутентификация** — регистрация, вход, JWT-сессии
- **Доски** — несколько досок на пользователя, переключение между ними
- **Колонки и задачи** — drag-and-drop (dnd-kit), сортировка, фильтр «все / мои»
- **Inbox** — быстрый сбор задач до распределения по колонкам
- **Архив** — завершение задач с возможностью восстановления
- **Совместная работа** — приглашение участников по email, роли `owner` / `editor` / `viewer`
- **Карточки задач** — теги, исполнитель, дедлайн, приоритет (`low` / `medium` / `high`)
- **Профиль** — имя, аватар, смена пароля
- **Realtime** — синхронизация изменений между участниками через WebSocket
- **AI** — генерация и улучшение описания задачи через [Ollama](https://ollama.com/) (опционально)
- **Адаптивность** — мобильная вёрстка (sheet для inbox, упрощённый drag-and-drop)

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | Next.js 16, React 19, Zustand, Tailwind CSS, shadcn/ui, dnd-kit |
| Backend | Express, PostgreSQL (`pg`), JWT, bcrypt, WebSocket (`ws`) |
| AI | Ollama (локально) |

## Требования

- [Node.js](https://nodejs.org/) 18+ или [Bun](https://bun.sh/)
- [PostgreSQL](https://www.postgresql.org/) 14+
- (опционально) [Ollama](https://ollama.com/) для AI-функций

## Установка

```bash
git clone https://github.com/mishalyamets1/MyTrello.git
cd MyTrello
bun install
# или: npm install
```

## База данных

1. Запустите PostgreSQL.
2. Создайте базу (по умолчанию используется `postgres`).
3. Примените схему:

```bash
psql -U postgres -d postgres -f server/models/schema.sql
```

Параметры подключения задаются в `server/db.ts`:

| Параметр | Значение по умолчанию |
|----------|----------------------|
| host | `localhost` |
| port | `5432` |
| user | `postgres` |
| password | `1234` |
| database | `postgres` |

Измените их под своё окружение или вынесите в переменные окружения.

## Переменные окружения

Создайте файл `.env` в корне проекта (опционально):

```env
JWT_SECRET=your-secret-key

# Ollama (опционально)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:latest
```

Если `JWT_SECRET` не задан, используется значение `your-key`.

## Запуск

Нужны **два процесса** — API-сервер и Next.js.

**Терминал 1 — backend (порт 3001):**

```bash
bun run server/index.ts
```

**Терминал 2 — frontend (порт 3000):**

```bash
bun dev
# или: npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### AI-описания задач

1. Установите и запустите Ollama.
2. Скачайте модель, указанную в `OLLAMA_MODEL` (по умолчанию `gemma4:latest`):

```bash
ollama pull gemma4:latest
```

Без Ollama остальной функционал работает; кнопка улучшения описания вернёт ошибку 503.

## API

Базовый URL: `http://localhost:3001/api`

| Маршрут | Описание |
|---------|----------|
| `POST /auth/register`, `POST /auth/login` | Регистрация и вход |
| `GET/POST/DELETE /boards` | Доски |
| `GET/POST/PATCH/DELETE /boards/:id/members` | Участники доски |
| `GET/POST/PATCH/DELETE /columns` | Колонки |
| `GET/POST/PATCH/DELETE /tasks` | Задачи, inbox, архив |
| `PATCH /tasks/:id/move` | Перемещение задачи |
| `POST /ai/enhance-description` | AI-описание задачи |
| `GET/PATCH /users/me` | Профиль пользователя |

Защищённые маршруты требуют заголовок `Authorization: Bearer <token>`.

WebSocket: `ws://localhost:3001` — после подключения отправьте `{ "type": "auth", "token": "..." }`, затем `{ "type": "join", "boardId": "..." }`.

## Структура проекта

```
app/              # Next.js App Router (страницы)
components/       # UI-компоненты (доска, колонки, задачи, header)
hooks/            # useBoardRealtime, useMediaQuery
stores/           # Zustand: authStore, boardStore
server/           # Express API, контроллеры, модели, WebSocket
public/           # Статика (иконки)
```

## Скрипты

| Команда | Описание |
|---------|----------|
| `bun dev` | Next.js в режиме разработки |
| `bun run build` | Production-сборка frontend |
| `bun run start` | Запуск собранного Next.js |
| `bun run lint` | ESLint |


