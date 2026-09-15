# SpendLog Native

The React Native (Expo) client for the SpendLog API in `../spendlog`.

- `DEVELOPMENT_PLAN.md` — the phased plan, what is done, and the API rules the client follows.
- `src/app` — Expo Router routes: `(auth)` for the signed-out screens, `(app)` for the five-tab shell.
- `src/api` — the axios client, environment resolution and one file per resource.
- `src/hooks` — React Query hooks; `keys.ts` says what each write invalidates.
- `src/components`, `src/sheets` — the design system and the bottom-sheet forms.
- `src/i18n/km.json` — English key, Khmer value.

```bash
npm install
npx expo start          # Expo Go on a phone, or press a / w for Android / web
npm run typecheck && npm run lint && npm test
```

The API host is derived from the Metro bundler (your PC on the LAN, `10.0.2.2`
on the Android emulator). Set `EXPO_PUBLIC_API_URL` in `.env` for a deployed
server, and `EXPO_PUBLIC_API_PORT` when `php artisan serve` is not on 8000.
