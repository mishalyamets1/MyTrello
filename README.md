# MyTrello

![CI](https://github.com/mishalyamets1/MyTrello/actions/workflows/main.yml/badge.svg)

Kanban-доска в стиле Trello с несколькими досками, совместной работой и realtime-обновлениями.

## Возможности

- **Аутентификация** — регистрация, вход, JWT access/refresh tokens
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
| Тесты | Python, pytest, requests |
| CI | GitHub Actions |
| AI | Ollama (локально) |

## Требования

- [Bun](https://bun.sh/) или [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) 14+
- [Python](https://www.python.org/) 3.12+ (для API-тестов)
- (опционально) [Ollama](https://ollama.com/) для AI-функций

## Установка

```bash
git clone https://github.com/mishalyamets1/MyTrello.git
cd MyTrello
bun install
```

## База данных

1. Запустите PostgreSQL.
2. Создайте базу для разработки (например `postgres`) и отдельную для тестов (`trello_test`).
3. Примените схему:

```bash
psql -U postgres -d postgres -f server/models/schema.sql
psql -U postgres -d trello_test -f server/models/schema.sql
```

Параметры подключения задаются через переменные окружения (см. `.env`) или значения по умолчанию в `server/db.ts`:

| Переменная | По умолчанию |
|------------|--------------|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `1234` |
| `DB_NAME` | `postgres` |

Для тестов рекомендуется `DB_NAME=trello_test`, чтобы не смешивать dev-данные с тестовыми.

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
DB_NAME=postgres

JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Ollama (опционально)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:latest
```

## Запуск

Нужны **два процесса** — API-сервер и Next.js.

**Терминал 1 — backend (порт 3001):**

```bash
bun run server
# или: bun run server/index.ts
```

**Терминал 2 — frontend (порт 3000):**

```bash
bun dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### AI-описания задач

1. Установите и запустите Ollama.
2. Скачайте модель, указанную в `OLLAMA_MODEL`:

```bash
ollama pull gemma4:latest
```

Без Ollama остальной функционал работает; кнопка улучшения описания вернёт ошибку 503.

## Тестирование

API покрыто интеграционными тестами на **pytest**. Тесты обращаются к реальному Express-серверу на `http://localhost:3001/api`.

### Установка Python-зависимостей

```bash
cd tests
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirments.txt
```

### Запуск тестов

```bash
# Терминал 1 — сервер с test-БД
DB_NAME=trello_test bun run server

# Терминал 2 — pytest
cd tests
pytest -v
# или из корня:
bun run test:api
```

### Структура тестов

```
tests/
  conftest.py          # fixtures: api, registered_user, board
  test_auth.py         # регистрация, login, refresh, logout
  test_actions.py      # сценарии: колонки, задачи, workflow
  utils/api_client.py  # HTTP-клиент для API
```

## CI/CD

При каждом push в `main` и при pull request GitHub Actions автоматически:

1. Устанавливает зависимости (Bun + Python)
2. Запускает ESLint и сборку Next.js
3. Поднимает PostgreSQL и накатывает схему
4. Стартует API-сервер
5. Прогоняет pytest

Workflow: [`.github/workflows/main.yml`](.github/workflows/main.yml)

## API

Базовый URL: `http://localhost:3001/api`

| Маршрут | Описание |
|---------|----------|
| `POST /auth/register`, `/login`, `/refresh`, `/logout` | Аутентификация |
| `GET/POST/DELETE /boards` | Доски |
| `GET/POST/PATCH/DELETE /boards/:id/members` | Участники доски |
| `GET/POST/DELETE /columns` | Колонки |
| `GET/POST/PUT/DELETE /tasks` | Задачи, inbox, архив |
| `POST /tasks/:id/move`, `/complete`, `/restore` | Перемещение и архив |
| `POST /ai/enhance-description` | AI-описание задачи |
| `GET/PATCH /users/me` | Профиль пользователя |

Защищённые маршруты требуют заголовок `Authorization: Bearer <token>`.

WebSocket: `ws://localhost:3001` — после подключения отправьте `{ "type": "auth", "token": "..." }`, затем `{ "type": "join", "boardId": "..." }`.

## Структура проекта

```
app/                  # Next.js App Router (страницы)
components/           # UI-компоненты (доска, колонки, задачи, header)
hooks/                # useBoardRealtime, useMediaQuery
stores/               # Zustand: authStore, boardStore
server/               # Express API, контроллеры, модели, WebSocket
tests/                # pytest: API integration tests
.github/workflows/    # CI (GitHub Actions)
public/               # Статика (иконки)
```

## Скрипты

| Команда | Описание |
|---------|----------|
| `bun dev` | Next.js в режиме разработки |
| `bun run server` | Express API (порт 3001) |
| `bun run build` | Production-сборка frontend |
| `bun run start` | Запуск собранного Next.js |
| `bun run lint` | ESLint |
| `bun run test:api` | Запуск pytest |
