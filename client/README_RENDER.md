Render deployment steps for the frontend

Quick summary
- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variables required:
  - `VITE_API_BASE_URL` -> `https://<your-railway-backend>/api`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

UI steps (Render.com)
1. Create a new Static Site on Render and connect your GitHub repo.
2. For "Root Directory" enter `client`.
3. Set Build Command to:
   ```bash
   npm install && npm run build
   ```
4. Set Publish Directory to `dist`.
5. Add the required environment variables under the "Environment" tab.
6. Create the site and deploy. After the build completes, copy the Render URL.

Update backend `CLIENT_ORIGIN`
1. Edit the Railway backend service environment variable `CLIENT_ORIGIN` and add the Render URL.
   Example:
   ```text
   CLIENT_ORIGIN=http://localhost:5173,https://your-app.onrender.com
   ```

Local test commands
```bash
# build locally
cd client
npm install
npm run build

# serve the built site (optional)
# npm i -g serve
serve -s dist -l 8080
# open http://localhost:8080 and make sure API calls point to your backend
```

Optional: render.yaml
If you prefer to define the site with `render.yaml`, paste this into the Render YAML editor (do NOT commit secrets into repo):

```yaml
services:
  - type: static
    name: snack-voucher-frontend
    env: node
    branch: main
    root: client
    buildCommand: "npm install && npm run build"
    publishPath: dist
    plan: free
```

Notes
- Do NOT commit secrets (Supabase keys) to the repo. Add them via the Render dashboard.
- If you use a custom domain, update `CLIENT_ORIGIN` on the backend to include that domain and redeploy the backend.
