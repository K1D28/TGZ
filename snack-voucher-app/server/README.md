# Snack Voucher API

## Setup

1. Copy `.env.example` to `.env`.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Run `npm install`.
4. Start the API with `npm run dev`.

## Endpoints

- `GET /api/health`
- `GET /api/snacks`
- `POST /api/snacks`
- `GET /api/vouchers`
- `POST /api/vouchers`

## Deploy on Railway

Service settings:

- Root Directory: `snack-voucher-app/server`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLIENT_ORIGIN` (Render frontend URL, or comma-separated list with local URL)

Example:

- `CLIENT_ORIGIN=https://your-frontend.onrender.com`
- or `CLIENT_ORIGIN=http://localhost:5173,https://your-frontend.onrender.com`
