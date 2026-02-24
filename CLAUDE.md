# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server
pnpm start

# Run on platform
pnpm ios
pnpm android
pnpm web

# Lint
pnpm lint

# Start local Supabase (requires Supabase CLI)
supabase start

# Stop local Supabase
supabase stop
```

## Architecture

This is an Expo app (SDK 54) using **expo-router** for file-based navigation with a **Supabase** backend for storage.

### Navigation

`app/_layout.tsx` sets up a Stack navigator. Routes are file-based:
- `app/index.tsx` — Home screen (PDF upload + navigation)
- `app/pdf-viewer.tsx` — PDF viewer screen using `react-native-webview`

### PDF Upload Flow

1. `app/index.tsx` calls `uploadPdf()` from `app/components/home/uploadPdf.ts`
2. `expo-document-picker` opens the file picker (PDF only)
3. `expo-file-system` reads the file and converts it to Base64
4. The Base64 content is uploaded to the Supabase `documents` storage bucket
5. A unique filename is generated with a timestamp prefix

### Supabase

`app/lib/supabase.ts` initializes the Supabase client. For local development, it connects to the local Supabase instance at `http://127.0.0.1:54321` (configured in `supabase/config.toml`).

Local Supabase ports:
- API: 54321
- DB: 54322
- Studio: 54323
- Email (Inbucket): 54324

Storage bucket used: `documents`

### Key Config

- **New Architecture** and **React Compiler** are both enabled (`app.json`)
- **Typed Routes** enabled — use type-safe `router.push()` calls
- Path alias `@/*` maps to the project root (`tsconfig.json`)
- Package manager: **pnpm**
