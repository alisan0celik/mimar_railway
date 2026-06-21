# Railway Deployment

This repository is configured to deploy the NestJS backend service to Railway from the monorepo root.

## GitHub repository root

Use this folder as the GitHub repository root:

```text
mimar-platform-main/mimar-platform-main
```

Do not upload local runtime folders such as `.tools` or `node_modules`. They are ignored for Git and are not needed on Railway. Railway installs Node dependencies and provides PostgreSQL separately.

## Railway services

Create these services in one Railway project:

1. PostgreSQL database
2. Backend service connected to this GitHub repository

Railway will read `railway.json` from the repository root.

## Backend build flow

`railway.json` runs:

- Build: `npm run railway:build`
- Pre-deploy migration: `npm run railway:migrate`
- Start: `npm run railway:start`
- Healthcheck: `/api/health`

The migration command uses Prisma `migrate deploy`, which is the production-safe migration command.

## Required variables

Copy `.env.railway.example` into Railway variables and replace the placeholders.

Important values:

- `DATABASE_URL`: reference Railway Postgres, usually `${{Postgres.DATABASE_URL}}`
- `JWT_ACCESS_SECRET`: long random secret
- `JWT_REFRESH_SECRET`: different long random secret
- `PLATFORM_ADMIN_EMAILS`: comma-separated platform admin emails
- `CORS_ORIGINS`: web/admin domains that are allowed to call the API
- `UPLOAD_DIR`: use `/data/uploads` when a Railway volume is mounted at `/data`

## File uploads

Company logos are stored under `UPLOAD_DIR`. On Railway, add a Volume and mount it to `/data` if you want uploaded files to survive redeploys.

For a later production hardening step, move uploads to object storage such as Cloudflare R2, S3, or Railway Buckets.

## Mobile app variables

After Railway gives the backend a public domain, update the mobile app build variables:

```env
EXPO_PUBLIC_API_URL=https://your-railway-domain.up.railway.app/api
EXPO_PUBLIC_WS_URL=wss://your-railway-domain.up.railway.app
```

Use your own custom domain when you are ready, for example:

```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
EXPO_PUBLIC_WS_URL=wss://api.yourdomain.com
```

## Notes

Native Android and iOS apps do not need browser CORS, but the Expo web build and any admin web UI do.
