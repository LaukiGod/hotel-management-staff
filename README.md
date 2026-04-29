# Restaurant Staff & Admin Frontend

## Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173` by default.

Make sure the backend is running at `http://localhost:5000` and has `FRONTEND_URL=http://localhost:5173` set in its `.env`.

## Roles

| Feature          | STAFF | ADMIN |
| ---------------- | ----- | ----- |
| Dashboard        | ✓     | ✓     |
| Tables           | ✓     | ✓     |
| Orders + status  | ✓     | ✓     |
| Allergy Alerts   | ✓     | ✓     |
| Inventory (view) | ✓     | ✓     |
| Inventory (edit) | —     | ✓     |
| Menu management  | —     | ✓     |
| Staff management | —     | ✓     |

## Auth Flow

1. Click "Continue with Google" → redirects to `/api/auth/google`
2. Backend issues JWT and redirects to `/auth/callback?token=...`
3. Token stored in `sessionStorage`, decoded client-side (no library)
4. Role read from JWT payload to show/hide features
