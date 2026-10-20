# Deploying YACS

How the live site is set up and run. For running YACS on your own machine, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## How production fits together

Everything runs on one server with Docker Compose (`docker-compose.prod.yml`):

```
Internet ──► web (Caddy) ──┬─► /api/*     ──► backend (FastAPI, 4 workers) ──► db (Postgres)
  :80/:443                 │                                                 └► redis (cache, login throttling)
                           ├─► /ingest/*  ──► PostHog (analytics)
                           └─► everything else: the built React app
```

- **web** serves the frontend, gets the HTTPS certificate automatically, compresses responses, and forwards `/api` to the backend. It is the only container reachable from the internet.
- **backend**, **db** and **redis** publish no ports. The backend trusts Caddy's forwarded client IPs only because nothing else can reach it, so never add a `ports:` entry to it.
- Settings and secrets come from a `.env` file on the server (template: [`.env.production.example`](./.env.production.example)).

## Before you start

You need:

1. **An AWS account** with a billing alarm (Billing → Budgets → e.g. alert at $10).
2. **A domain name.** Caddy can't get an HTTPS certificate without one. Free options: a domain from the GitHub Student Developer Pack (free for the first year), a free [DuckDNS](https://www.duckdns.org) subdomain, or a subdomain from RPI/RCOS.
3. **(Optional) A PostHog project** for analytics. Create one at [posthog.com](https://posthog.com) (US region) and copy the **Project API key** (starts with `phc_`). Without it, analytics are simply off.
4. **Two secrets**, generated now and kept in a password manager:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"      # SECRET_KEY
   python3 -c "import secrets; print(secrets.token_urlsafe(24))"  # DB_PASS
   ```

## First-time setup

### 1. Launch the server (AWS Console → EC2 → Launch instance)

| Setting | Value |
| :--- | :--- |
| Image | Ubuntu Server 24.04 LTS, **64-bit (Arm)** |
| Instance type | `t4g.small` (2 GB memory; free tier eligible). Avoid 1 GB "micro" types: the app and the frontend build don't fit. |
| Key pair | Create one, download the `.pem` file, keep it safe. It's the only way to log in. |
| Storage | 30 GB gp3 |
| Security group | SSH (22) from **My IP** only; HTTP (80) and HTTPS (443) from anywhere. Optionally UDP 443 for HTTP/3. |

Then, still in the EC2 console:

- **Elastic IP:** Elastic IPs → Allocate → Associate with the instance, so the IP survives restarts.
- **Backups:** Lifecycle Manager → create a policy for the instance's volume: daily EBS snapshots, keep 7.

### 2. Point the domain at the server

At your domain/DNS provider, create an **A record** for the domain pointing at the Elastic IP. Check it before continuing (it can take a few minutes):

```bash
dig +short yacs.example.com   # should print the Elastic IP
```

### 3. Prepare the server

```bash
chmod 400 yacs-key.pem
ssh -i yacs-key.pem ubuntu@<elastic-ip>

# Docker (includes Docker Compose)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit   # log out and back in so the group change applies

# 2 GB of swap, so the frontend build doesn't run out of memory
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Get the code and configure it

```bash
git clone https://github.com/JoJo-ESC/yacs.git
cd yacs
cp .env.production.example .env
nano .env   # set DOMAIN, SECRET_KEY, DB_PASS, and POSTHOG_KEY if you have one
```

Optional shortcut used in the rest of this guide:

```bash
echo "alias dc='docker compose -f docker-compose.prod.yml'" >> ~/.bashrc && source ~/.bashrc
```

### 5. Start it

```bash
dc up -d --build   # first build takes several minutes
dc ps              # backend, db and redis should show (healthy)
```

### 6. Load course data

The scraped JSON lives in `backend/scraper/data/` and is mounted into the backend for importing. Import the semesters people will use (current, plus next once it's published):

```bash
dc exec backend python scraper/import_courses.py --term 202609
```

### 7. Check it works

- `https://<your-domain>` loads with a padlock, and `https://<your-domain>/api/semesters` returns JSON.
- Sign up, log in, add a class, refresh: it's still there.
- `dc logs backend` shows no `Redis unavailable` warnings or tracebacks.
- With a PostHog key: click around the site, and events appear under **Activity** in PostHog within a minute.
- Recommended: add a free uptime monitor (UptimeRobot or Better Stack) on `https://<your-domain>/api/semesters`, so you hear about outages first.

## Day-to-day operations

All commands run in `~/yacs` on the server.

| Task | Command |
| :--- | :--- |
| Deploy the latest `main` | `git pull && dc up -d --build && docker image prune -f` |
| See what's running | `dc ps` |
| Follow logs | `dc logs -f --tail=100 backend` (or `web`, `db`, `redis`) |
| Restart a service | `dc restart backend` |
| Stop everything | `dc down` (**never** `dc down -v`: `-v` deletes the database) |
| Memory/CPU per container | `docker stats` |
| OS updates (monthly) | `sudo apt update && sudo apt upgrade -y`, then `sudo reboot` if asked. Containers restart on their own. |

### Refreshing course data

The scraper needs an SIS9 session cookie from a logged-in browser, so it runs on a developer's machine, not the server:

1. Locally: `cd backend/scraper && python main.py --sessionid <JSESSIONID>`. This updates the JSON for the current and next terms.
2. Commit and merge the updated JSON files.
3. On the server: `git pull`, then rerun the import for each changed term (step 6). The import clears the API cache, so changes show up immediately.

### Making someone an admin

```bash
dc exec db psql -U yacs -d yacsdb -c "UPDATE users SET role='admin' WHERE email='someone@rpi.edu';"
```

The role is read at login, so they need to log out and back in.

### Backups and restoring

- **Daily EBS snapshots** (set up in step 1) cover losing the server or disk. Restore by creating a volume from a snapshot and attaching it to an instance.
- **One-off database dump** (e.g. before a risky change):
  ```bash
  dc exec -T db pg_dump -U yacs -d yacsdb | gzip > yacs-$(date +%F).sql.gz
  ```
  Restore into an empty database:
  ```bash
  gunzip -c yacs-YYYY-MM-DD.sql.gz | dc exec -T db psql -U yacs -d yacsdb
  ```
  Copy dumps off the server (`scp`) if you need them to survive the server.

### Changing settings

- `DOMAIN`, `SECRET_KEY`, `DB_PASS`: edit `.env`, then `dc up -d`.
  - Changing `SECRET_KEY` logs everyone out.
  - Changing `DB_PASS` after the first start does **not** change the existing database's password; Postgres only reads it when the database is first created.
- `POSTHOG_KEY` is built into the frontend, so it needs a rebuild: `dc up -d --build`.

## Troubleshooting

| Symptom | Likely cause / fix |
| :--- | :--- |
| No HTTPS, or a certificate error | DNS doesn't point at the server yet (`dig +short <domain>`), or ports 80/443 aren't open in the security group. Details in `dc logs web`. Caddy retries automatically once fixed. |
| Backend keeps restarting | A configuration error: `dc logs backend` starts with `Configuration error: ...` and says what to fix in `.env` (e.g. a missing or too-short `SECRET_KEY`). |
| Site loads but data doesn't (502 errors) | The backend is down or starting. Check `dc ps` and `dc logs backend`. |
| `Redis unavailable` warnings | Redis is down. The site keeps working (slower, with per-worker login limits) until `dc restart redis`. |
| Build or containers killed for memory | Check swap is on (`free -h`) and memory use (`docker stats`). |
| No analytics events | `POSTHOG_KEY` empty or changed without `--build`. Events go through `/ingest`, so ad blockers shouldn't matter. |

## Security notes

- Never commit `.env`; it's gitignored.
- Keep SSH (port 22) limited to your own IP in the security group. If your IP changes, update the rule in the console.
- The site sends HSTS, so browsers that visited it will refuse plain HTTP for a year. Don't move it back to HTTP.
