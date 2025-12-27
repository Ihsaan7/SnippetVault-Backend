# SnippetVault — Backend (Server) 🧠
Express + MongoDB API for SnippetVault.

## What this backend does
- Auth: register/login/logout/refresh
- Snippet CRUD
- Favorites
- Public snippets + share links
- Fork public snippets
- Search + filters (tags/language/date range)
- Stats endpoints

## Tech Stack
- Node.js (ESM)
- Express
- MongoDB + Mongoose
- JWT
- Multer
- Cloudinary
- CORS + cookie-parser

## API Base
All routes are mounted under:
- `/api/v1`

Health:
- `GET /health`

## Key Endpoints (high level)
Auth:
- `POST /api/v1/auth/register` (multipart/form-data, requires `avatar`)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout` (protected)
- `GET /api/v1/auth/profile` (protected)

Snippets:
- `GET /api/v1/snippets/public`
- `GET /api/v1/snippets/public/:snippetID`
- `POST /api/v1/snippets/create` (protected)
- `GET /api/v1/snippets` (protected)
- `GET /api/v1/snippets/stats` (protected)

## Auth (important for deployment)
For Vercel deployments, auth uses Authorization header tokens:
- API returns `accessToken` + `refreshToken` in the response body
- Client sends `Authorization: Bearer <accessToken>`

## Environment Variables
Set on Vercel (Server project) or in `Server/.env` locally:

Mongo:
- `MONGODB_URI`

JWT:
- `ACCESS_TOKEN`
- `ACCESS_TOKEN_EXPIRY` (example: `1d`)
- `REFRESH_TOKEN`
- `REFRESH_TOKEN_EXPIRY` (example: `7d`)

Frontend:
- `FRONTEND_URL` (example: `https://<your-frontend>.vercel.app`)

Cloudinary:
- `CLOUDI_NAME`
- `CLOUDI_API_KEY`
- `CLOUDI_API_SECRET`

## Run locally
From `Server/`:
- `npm install`
- `npm run dev`

## Deploy (Vercel)
Backend deploy uses serverless function entry + routing:
- `Server/api/index.js`
- `Server/vercel.json`

Serverless notes:
- Uploads use `/tmp` on Vercel.
- Mongo connection is cached across invocations.

See `../DEPLOYMENT_ISSUES.md` for deployment gotchas and fixes.
