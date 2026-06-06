# ColoRISK — ИИ-платформа для обнаружения полипов

[🇬🇧 English version](README.md)

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-deployed-0B0D0E?logo=railway&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?logo=vercel&logoColor=white)

> **ColoRISK** — полнофункциональное медицинское AI-приложение для обнаружения полипов толстого кишечника на изображениях колоноскопии, видеозаписях и документах с использованием модели глубокого обучения на базе YOLO. Разработано для клинических рабочих процессов с многоязычным интерфейсом, асинхронной обработкой и современным тёмным/светлым UI.

---

## Возможности

- 🖼️ **Анализ изображений** — JPEG, PNG, BMP, TIFF, WebP
- 🎬 **Анализ видео** — MP4, MOV, AVI, MKV, WebM (покадровая обработка)
- 📄 **Анализ документов** — ODT-файлы со встроенными изображениями
- 🔐 **JWT-аутентификация** — история анализов и изоляция файлов для каждого пользователя
- 🌍 **3-языковой интерфейс** — English, Русский, Қазақша
- 🌗 **Тёмная / светлая тема** — сохраняется в localStorage
- ⚡ **Асинхронная обработка** — неблокирующий инференс с отслеживанием статуса в реальном времени
- 📥 **Скачивание результатов** — аннотированные изображения и видео доступны для загрузки

---

## Архитектура

```
┌─────────────────────┐        ┌──────────────────────────┐
│  React Frontend     │  HTTPS │   FastAPI Backend         │
│  (Vercel)           │◄──────►│   (Railway / Docker)      │
│                     │        │                           │
│  • Страницы авторизации     │  • JWT-аутентификация     │
│  • Дашборд          │        │  • Загрузка и хранение   │
│  • Просмотр результатов     │  • Фоновый инференс       │
│  • i18n EN/RU/KZ   │        │  • REST API               │
└─────────────────────┘        └──────────┬────────────────┘
                                           │
                                ┌──────────▼────────────────┐
                                │   YOLO / PyTorch модель    │
                                │   (only PolyDb.pt)         │
                                │   ultralytics + OpenCV     │
                                └────────────────────────────┘
```

**База данных**: SQLite (локальная разработка) / PostgreSQL (продакшн через Railway)

---

## Локальная разработка

### Требования

- **Node.js** 18+
- **Python** 3.11+
- **Файл модели**: `only PolyDb.pt` в корне проекта

### Запуск одной командой

```bash
./start.sh
```

Скрипт запускает бэкенд и фронтенд параллельно. Для остановки нажмите `Ctrl+C`.

### Ручная настройка

**Бэкенд:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Фронтенд** (новый терминал):
```bash
cd frontend
npm install
npm run dev
```

### Адреса

| Сервис | URL |
|--------|-----|
| Фронтенд | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |

---

## Переменные окружения

### Бэкенд (`backend/.env`)

| Переменная | Обязательна | По умолчанию | Описание |
|------------|-------------|--------------|---------|
| `SECRET_KEY` | ✅ | — | Секрет для подписи JWT (длинная случайная строка) |
| `DATABASE_URL` | ❌ | SQLite | URL PostgreSQL (`postgresql://user:pass@host/db`) |
| `MODEL_PATH` | ❌ | `../only PolyDb.pt` | Абсолютный путь к файлу модели `.pt` |
| `PORT` | ❌ | `8000` | Порт HTTP-сервера |
| `CORS_ORIGINS` | ❌ | `*` | Разрешённые origins через запятую |

### Фронтенд (`frontend/.env`)

| Переменная | Обязательна | Описание |
|------------|-------------|---------|
| `VITE_API_BASE_URL` | ✅ | Базовый URL бэкенда (например, `https://your-app.railway.app`) |

---

## Справочник API

### Аутентификация

| Метод | Endpoint | Auth | Описание |
|-------|----------|------|---------|
| `POST` | `/auth/register` | Нет | Регистрация по email и паролю → возвращает JWT |
| `POST` | `/auth/login` | Нет | Вход (тело OAuth2-формы) → возвращает JWT |
| `GET` | `/auth/me` | Да | Информация о текущем пользователе |

### Анализы

| Метод | Endpoint | Auth | Описание |
|-------|----------|------|---------|
| `POST` | `/analyses` | Да | Загрузить файл → запускает фоновый инференс, возвращает объект Analysis |
| `GET` | `/analyses` | Да | Список анализов текущего пользователя (сначала новые) |
| `GET` | `/analyses/{id}` | Да | Получить один анализ по ID |
| `DELETE` | `/analyses/{id}` | Да | Удалить анализ и связанные файлы |

### Файлы

| Метод | Endpoint | Auth | Описание |
|-------|----------|------|---------|
| `GET` | `/files/uploads/{filename}` | Нет | Отдать исходный загруженный файл |
| `GET` | `/files/processed/{filename}` | Нет | Отдать аннотированный результат ИИ |
| `GET` | `/files/download/{filename}` | Нет | Скачать обработанный файл как вложение |

### Статистика

| Метод | Endpoint | Auth | Описание |
|-------|----------|------|---------|
| `GET` | `/stats` | Да | Агрегированная статистика: всего анализов, обнаружений, средняя точность |

**Заголовок авторизации:** `Authorization: Bearer <token>`

---

## Поддерживаемые типы файлов

| Категория | Расширения | Макс. размер |
|-----------|-----------|--------------|
| Изображения | `.jpg` `.jpeg` `.png` `.bmp` `.tiff` `.webp` | 500 МБ |
| Видео | `.mp4` `.mov` `.avi` `.mkv` `.webm` | 500 МБ |
| Документы | `.odt` (OpenDocument Text со встроенными изображениями) | 500 МБ |

---

## Деплой

### Бэкенд → Railway

1. Подключите репозиторий GitHub к Railway
2. Railway автоматически определит `Dockerfile`
3. Установите переменные окружения в панели Railway:

```
SECRET_KEY=<длинный-случайный-секрет>
DATABASE_URL=<автоматически добавляется плагином Railway PostgreSQL>
MODEL_PATH=/app/model.pt
```

`Dockerfile` использует базовый образ `ultralytics/ultralytics:latest-cpu` — PyTorch, OpenCV и ultralytics уже предустановлены. Поверх него устанавливаются только лёгкие веб-пакеты.

**`railway.toml`** настраивает:
- Путь проверки состояния: `/docs`
- Перезапуск при сбое (макс. 3 попытки)

### Фронтенд → Vercel

1. Подключите репозиторий GitHub к Vercel
2. Настройки сборки:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Добавьте переменную окружения:
```
VITE_API_BASE_URL=https://your-app.railway.app
```

`vercel.json` настраивает маршрутизацию SPA (все пути → `index.html`).

---

## Структура проекта

```
polyp-detector/
├── backend/
│   ├── main.py             # FastAPI-приложение, все endpoints, фоновые задачи
│   ├── inference.py        # Загрузка модели, обработка изображений/видео/документов
│   ├── database.py         # SQLAlchemy-модели (User, Analysis)
│   ├── auth.py             # JWT, хэширование паролей
│   ├── run.py              # Точка входа Uvicorn
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts       # Axios + интерцептор авторизации
│   │   ├── contexts/           # Auth, Theme, Lang (React contexts)
│   │   ├── pages/              # Login, Register, Dashboard, Results
│   │   ├── components/         # Navbar, UploadZone, AnalysisCard, ColonIcon
│   │   └── i18n/translations.ts# Строки EN / RU / KZ
│   ├── tailwind.config.js
│   └── vite.config.ts
├── Dockerfile
├── railway.toml
├── start.sh                # Локальный запуск (бэкенд + фронтенд)
└── only PolyDb.pt          # Веса YOLO-модели
```

---

## Схема базы данных

### `users`

| Столбец | Тип | Примечание |
|---------|-----|-----------|
| `id` | INTEGER | Первичный ключ |
| `email` | VARCHAR | Уникальный, с индексом |
| `hashed_password` | VARCHAR | bcrypt |
| `created_at` | DATETIME | UTC |

### `analyses`

| Столбец | Тип | Примечание |
|---------|-----|-----------|
| `id` | INTEGER | Первичный ключ |
| `user_id` | INTEGER | FK → users.id (каскадное удаление) |
| `filename` | VARCHAR | Оригинальное отображаемое имя |
| `media_type` | VARCHAR | `image` \| `video` \| `document` |
| `original_filename` | VARCHAR | UUID-имя на диске |
| `processed_filename` | VARCHAR | Имя аннотированного файла |
| `status` | VARCHAR | `pending` → `processing` → `done` \| `failed` |
| `detections_count` | INTEGER | Количество обнаруженных полипов |
| `avg_confidence` | FLOAT | Средняя уверенность (0–1) |
| `processing_time` | FLOAT | Время обработки в секундах |
| `error_message` | TEXT | Причина ошибки (nullable) |
| `created_at` | DATETIME | UTC |

---

## Пайплайн инференса

Загрузка модели использует двухуровневую стратегию:

1. **ultralytics YOLO** (основная) — поддерживает файлы `.pt` YOLOv8/v9/v10
2. **Сырой PyTorch** (резервная) — для кастомных моделей сегментации

Для PyTorch-моделей инференс возвращает маску-тензор формы `(1, 1, H, W)` в диапазоне `[0, 1]`. Сигмоида применяется автоматически, если значения выходят за этот диапазон. Маски пороговаются при `0.5` и накладываются зелёно-бирюзовым цветом (`#00DC96`) с прозрачностью 45% и контурным обводом.

---

## Лицензия

Проект разработан в академических и медицинских исследовательских целях.
