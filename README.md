# AIRSOFT//OPS — анонсы страйкбольных игр

Страница анонсов игр: `games.html` (репозиторий) → публикуется на GitHub Pages из папки `docs/`.

## Публикация на GitHub Pages (https://<логин>.github.io/<репозиторий>/)

1. Запушьте этот репозиторий на GitHub:
   ```bash
   git remote add origin https://github.com/<логин>/<репозиторий>.git
   git push -u origin main
   ```
2. CI настроен автоматически: файл `.github/workflows/pages.yml` при каждом пуше в `main`
   публикует папку `docs/` через **GitHub Pages → Source: GitHub Actions**.
   Можно и вручную: Settings → Pages → Source: *Deploy from a branch* → `main` / `docs` folder.
3. Сайт откроется по адресу `https://<логин>.github.io/<репозиторий>/`.

Обновлять сайт: правите `public/games.html`, копируйте в `docs/index.html`
(`cp public/games.html docs/index.html` + поправить ссылки навигации не нужно — они уже относительные) и пушьте.

## Хранение данных

- По умолчанию анонсы синхронизируются через **Firebase Realtime Database**
  (REST-запросы к узлу `/airsoft_games`) — тогда список общий для всех игроков.
  В шапке страницы показывается статус: `// ОНЛАЙН-СИНХРО` или `// ЛОКАЛЬНЫЙ РЕЖИМ`.
- Если база недоступна/закрыта правилами, страница работает полностью автономно:
  данные хранятся в `localStorage` браузера (плюс демо-анонсы при первом запуске).

### Чтобы включить общую синхронизацию

В консоли Firebase (lordinsxtest) откройте **Realtime Database → Rules** и разрешите чтение/запись узла `airsoft_games`:

```json
{
  "rules": {
    "airsoft_games": { ".read": true, ".write": true },
    ".read": false,
    ".write": false
  }
}
```

После этого все, кто откроет страницу, будут видеть один и тот же список игр
(обновления подтягиваются каждые 30 секунд).

## Локальный запуск (обычный сервер)

```bash
npm install && npm start   # http://localhost:3000/games.html
```
