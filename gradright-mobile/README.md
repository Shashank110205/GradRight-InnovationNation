# GradRight mobile (Expo)

React Native client for GradRight. Calls the FastAPI backend in `../gradright-backend/`.

## SDK version

This project was scaffolded with the current Expo template (see `package.json` for `expo` version). `ARCHITECTURE.md` references Expo SDK 51 as a baseline; treat that as documentation drift until you intentionally align versions across docs and this app.

## Setup

```bash
cd gradright-mobile
copy .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL (see .env.example)
npm install
npm run start
```

## Environment

- Copy `.env.example` to `.env`.
- `EXPO_PUBLIC_API_URL` must point at your running FastAPI instance (see comments in `.env.example` for Android emulator vs device).

## API client

Use `lib/api/client.ts` (`getApiBaseUrl`, `apiGet`, `apiPost`) for REST calls. Authenticated routes pass a Supabase session access token as `token` when you wire auth.

## Verify backend

With `uvicorn` running on port 8000 and `.env` set correctly, open the app; the home screen fetches `GET /health`.

## Production

Configure EAS Build, set `EXPO_PUBLIC_API_URL` to your deployed API URL in EAS secrets or `.env` for release builds.
