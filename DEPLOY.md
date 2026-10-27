# Put DiscoverDRC online (Render)

One service runs both the API and the web app on the same address:
`https://<your-app>.onrender.com` = web app, `/api/...` = API, `/admin` = admin dashboard.

## 1. Deploy (about 10 minutes)

1. Sign up at https://render.com with your GitHub account.
2. **New → Blueprint** → choose the `discoverdrc` repo → **Apply**.
   Render creates the database (`discoverdrc-db`) and the web service (`discoverdrc`) from `render.yaml`.
3. Wait for the first build (5–10 min). Database tables are created automatically on every start.
4. Open the service URL. You should see the app.

## 2. Add the demo businesses (optional)

1. In the app, register one account (it becomes the owner of the demo listings).
2. Render → `discoverdrc` service → **Shell** → run: `npm run seed`

## 3. Admin

Render → `discoverdrc` → **Environment** → copy `ADMIN_SECRET`. Open `/admin` and paste it.

## 4. Point the phone app at the live server

In `mobile/.env.production`, set `EXPO_PUBLIC_API_URL=https://<your-app>.onrender.com/api`,
then build with `eas build --profile production`.

## Good to know

- **Free plan limits:** the service sleeps after ~15 min without visitors (first visit then takes ~1 min),
  and the free database expires after 30 days. Upgrade both to the starter plans before real launch.
- **Custom domain:** Render → service → **Settings → Custom Domains** (discoverdrc.com is already allowed by the API).
  Any other web address that calls the API goes in the `CORS_ORIGINS` variable, comma-separated.
