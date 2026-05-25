# Spaceloader - Minecraft Cheat Client Launcher

Desktop-приложение лаунчера на Rust + Tauri v2 для запуска чит-клиентов Minecraft.

## 🔧 Технические требования:
- Фреймворк: Tauri 2.x (Rust бэкенд + HTML/JS фронтенд)
- Язык: фронтенд — ванильный JS, бэкенд — Rust
- ОС: Windows 10/11
- Сборка: через `cargo tauri build`

## 🎯 Основной функционал:
1. При запуске лаунчер делает GET-запрос к API: `https://spaceloader.mooo.com/api/clients`
2. Получает JSON-список доступных клиентов.
3. Отображает их в виде карточек (Название, Версия, Описание, Тип файла).
4. Кнопка "Скачать" у каждой карточки:
   - Скачивает файл по ссылке из JSON (`download_url`).
   - Показывает прогресс-бар загрузки.
   - Сохраняет файл во временную папку `%TEMP%\Spaceloader\`.
5. Кнопка "Запустить":
   - Если файл скачан, запускает его через `java -jar <путь_к_файлу>`.
   - Блокирует кнопку, пока файл не скачан.

## 📦 Установка зависимостей

### 1. Установите Rust
```bash
# Windows: скачайте rustup-init.exe с https://rustup.rs/
# Linux/macOS:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. Установите Tauri CLI
```bash
cargo install tauri-cli
```

### 3. Установите Node.js (для frontend dev server, опционально)
Скачайте с https://nodejs.org/

## 🚀 Запуск в режиме разработки

```bash
cd src-tauri
cargo tauri dev
```

## 📦 Сборка релизной версии

```bash
cd src-tauri
cargo tauri build
```

Собранные файлы появятся в `src-tauri/target/release/bundle/`

## 📡 API Формат

GET `/api/clients` возвращает массив:
```json
[
  {
    "id": "uuid",
    "name": "Aurora Client",
    "version": "v2.1.0",
    "description": "Лучший легит-чит с обходом античитов.",
    "file_type": "jar",
    "download_url": "https://spaceloader.mooo.com/files/aurora.jar"
  }
]
```

## ⚙️ Rust-команды (tauri::command):

1. `fetch_clients()` - Делает запрос к API, парсит JSON, возвращает список клиентов.
2. `download_client(url, filename, app)` - Скачивает файл, эмитит событие `download_progress`.
3. `launch_client(file_path)` - Запускает процесс `java -jar file_path`.

## 🎨 UI/UX

- Тёмная тема (#050505 фон)
- Сетка карточек (CSS Grid)
- В каждой карточке: название, версия, описание, тип файла
- Кнопка "Скачать" (синяя)
- Прогресс-бар загрузки
- Кнопка "Запустить" (зелёная, disabled пока не скачано)
