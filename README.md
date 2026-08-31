# Restaurant Staff & Admin Frontend

Multi-tenant. One deployment serves many restaurants, each at its own address.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173` by default.

Make sure the backend is running at `http://localhost:5000` and has
`FRONTEND_URL=http://localhost:5173` set in its `.env`.

## Addresses

Every restaurant lives under its own `/r/<slug>` prefix. There is deliberately no
directory page listing restaurants — each tenant is reached only by its own link.

| Path | Who it's for |
|---|---|
| `/r/<slug>` | Kiosk / tablet welcome for that restaurant |
| `/r/<slug>/tables` | Kiosk table selection |
| `/r/<slug>/login` | Staff & admin sign-in for that restaurant |
| `/r/<slug>/admin/...` | Staff & admin panel |
| `/r/<slug>/customer/menu` | Phone ordering after a QR scan |
| `/r/<slug>/user/table-select/:n` | What a table QR code points at |
| `/platform/login` | Platform administrator console |
| `/` | Explains that a restaurant must be named in the URL |

## Roles

| Feature | STAFF | ADMIN | SUPER_ADMIN |
| ---------------- | ----- | ----- | ----------- |
| Dashboard        | ✓     | ✓     | ✓ |
| Tables           | ✓     | ✓     | ✓ |
| Orders + status  | ✓     | ✓     | ✓ |
| Allergy Alerts   | ✓     | ✓     | ✓ |
| Inventory (view) | ✓     | ✓     | ✓ |
| Inventory (edit) | —     | ✓     | ✓ |
| Menu management  | —     | ✓     | ✓ |
| Staff management | —     | ✓     | ✓ |
| Create/suspend restaurants | — | — | ✓ |

STAFF and ADMIN belong to exactly one restaurant. SUPER_ADMIN belongs to none and
can enter any of them.

## Auth Flow

1. Click "Continue with Google" on `/r/<slug>/login` → redirects to
   `/api/r/<slug>/auth/google`
2. The backend signs the slug into the OAuth `state`, so the single shared Google
   callback still knows which restaurant is being logged in to
3. Backend issues a JWT stamped with `restaurantId` + `restaurantSlug`, then
   redirects to `/r/<slug>/auth/callback?token=...`
4. Token is stored in `sessionStorage` under `token:<slug>` and decoded
   client-side (no library)
5. Role and restaurant are read from the JWT payload to show/hide features

A token from one restaurant is refused by another: `AuthContext` drops any token
whose `restaurantSlug` does not match the slug in the URL.

## How the tenant reaches the code

- `TenantProvider` (route element for `/r/:slug`) resolves the slug, fetches the
  restaurant's public info, and points the API client at it before any child
  renders.
- `src/api/client.js` holds the active slug, so pages keep calling
  `api.get('/restaurant/orders')` unchanged — the `/api/r/<slug>` prefix is added
  in one place.
- `useTenantNavigate()` replaces `useNavigate()` inside tenant pages, so existing
  calls like `navigate('/tables')` land on `/r/<slug>/tables` without editing
  every call site.
- `src/utils/tenantStorage.js` namespaces `localStorage` keys per restaurant, so
  one tablet used for two restaurants never shares a cart or table session
  between them.
