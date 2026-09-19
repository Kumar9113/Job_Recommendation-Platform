# Deployment Guide

This covers the simplest realistic path: a single VPS (DigitalOcean, Linode, AWS Lightsail, Hetzner, etc.) running the same `docker-compose.yml` you've already been testing with. It's the least amount of new work because it's the exact setup you already have working locally.

An alternative (split services across managed platforms) is covered briefly at the end.

---

## Before you deploy: required changes

These are already applied in this version of the codebase. If you're comparing against an older copy, make sure you have these:

1. **Generate a real JWT secret** — don't ship `replace_this_with_a_long_random_secret`.
   ```bash
   openssl rand -hex 32
   ```
2. **Set a real DB password** — not `jobapp_password`.
3. **Point `REACT_APP_API_URL` at your real backend URL** — this is baked into the frontend's static JS bundle *at build time* (Create React App behavior). Setting an environment variable on the running container does nothing; you must rebuild the frontend image with the correct value.
4. **Restrict CORS** (`ALLOWED_ORIGIN`) to your real frontend domain once you know it, instead of leaving it open.
5. **Enable DB SSL** (`DB_SSL=true`) if you use a managed Postgres provider instead of the `postgres` container in `docker-compose.yml` — most managed providers (RDS, Supabase, Render, Neon) require it and will refuse plain connections.

All five are read from environment variables — see `.env.deploy.example`.

---

## Step-by-step: single VPS with Docker Compose

### 1. Provision a server

Any small VPS works to start (1 vCPU / 2GB RAM is enough for this app's current scale). Ubuntu 22.04/24.04 is a safe default. Note its public IP.

### 2. Install Docker + Docker Compose on the server

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in for the group change to apply
```

### 3. Get your code onto the server

```bash
git clone <your-repo-url>
cd job-recommendation-platform
```

### 4. Create your `.env` file

```bash
cp .env.deploy.example .env
nano .env   # fill in real values -- see the list above
```

At minimum, set:
- `DB_PASSWORD` — a real password
- `JWT_SECRET` — output of `openssl rand -hex 32`
- `REACT_APP_API_URL` — `http://<your-server-ip>:5050/api` for a first pass, or `https://api.yourdomain.com/api` once you have a domain + reverse proxy (see step 7)

### 5. Open the necessary ports

If your VPS has a firewall (`ufw`, cloud security group, etc.), allow:
- `3001` (frontend) — or `80`/`443` if you put a reverse proxy in front (recommended, see step 7)
- `5050` (backend) — only if the frontend calls it directly by IP; not needed if you proxy it
- Leave `5433` (Postgres) and `6100` (ML service) **closed to the outside world** — they only need to be reachable from other containers on the same Docker network, which `docker-compose.yml` already handles.

### 6. Build and start

```bash
docker compose up --build -d
```

Check everything came up:
```bash
docker compose ps
curl http://localhost:5050/api/health   # or whatever health route you're using
```

### 7. (Strongly recommended) Put a reverse proxy + HTTPS in front

Running the app directly on ports 3001/5050 over plain HTTP works, but isn't something you'd want real users hitting. Add Nginx or Caddy in front:

**Caddy** (simplest — automatic HTTPS via Let's Encrypt):
```
# /etc/caddy/Caddyfile
yourdomain.com {
    reverse_proxy localhost:3001
}

api.yourdomain.com {
    reverse_proxy localhost:5050
}
```
Then point your domain's DNS `A` records at the server's IP, and:
```bash
sudo apt install caddy
sudo systemctl restart caddy
```

Once this is in place, rebuild the frontend with `REACT_APP_API_URL=https://api.yourdomain.com/api` in your `.env`, then:
```bash
docker compose up --build -d frontend
```

### 8. Verify end to end

Run the curl walkthrough from the README against your real domain instead of `localhost` to confirm register → login → skills → recommendations → apply all work through the public URL.

---

## Ongoing operations

- **Logs**: `docker compose logs -f backend` (swap the service name as needed)
- **Restart a single service**: `docker compose restart backend`
- **Pull new code + redeploy**: `git pull && docker compose up --build -d`
- **Database backups**: the Postgres data lives in the `postgres_data` named volume. At minimum, periodically run `pg_dump` from inside the container and copy the dump off-server:
  ```bash
  docker exec job-postgres pg_dump -U jobapp job_recommendation_db > backup.sql
  ```

---

## Alternative: split across managed platforms

If you'd rather not manage a VPS yourself, each service can go to a manager that specializes in it. This requires slightly more setup than the VPS route since `docker-compose.yml` isn't used directly on most of these:

| Service | Where |
|---|---|
| Frontend | Vercel or Netlify — build command `npm run build`, publish `frontend/build`, set `REACT_APP_API_URL` as a build-time environment variable there |
| Backend | Render, Railway, or Fly.io — deploy `backend/` as a web service using its Dockerfile |
| ML service | Same platform as backend, deployed as a second web service using `ml-service/Dockerfile` |
| Database | The platform's managed Postgres add-on, or Supabase/Neon — remember to set `DB_SSL=true` |

The main adjustment versus the VPS route: your backend's `ML_SERVICE_URL` becomes the ML service's public URL on that platform instead of `http://ml-service:6100` (which only works inside a shared Docker network), and each service's environment variables are set through that platform's dashboard instead of a shared `.env` file.

---

## Still open (not blockers, but worth doing soon after launch)

These don't stop you from deploying, but matter once real users are on it — see `ROADMAP.md` Phase 1:

- No ownership check on `PUT /api/applications/:id`
- `recommendations` table grows unbounded (no dedup/cleanup)
- No rate limiting on auth endpoints
- No automated backups configured yet (see the `pg_dump` note above as a manual stopgap)
