# 🚀 YACS Local Development Setup Guide

Welcome to YACS (Yet Another Course Scheduler)! This guide will walk you through setting up the full stack on your local machine.

---

## 1. Prerequisites

Before we start, make sure you have these tools installed:

* **Git**: [Download Git](https://git-scm.com/downloads)
* **Docker Desktop**: This is required to run the backend services and database.
    * [Download for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
    * [Download for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
    * *Note: Open the Docker Desktop app after installing to ensure the Docker Engine is running.*
* **Node Version Manager (NVM)**: 

    **(Open a NEW terminal window after installing NVM)**
    * **macOS/Linux**: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
    * **Windows**: Download `nvm-setup.exe` from the [nvm-windows repository](https://github.com/coreybutler/nvm-windows/releases/latest).
    


## 2. Forking & Cloning

1. Open the YACS Repo: https://github.com/JoJo-ESC/yacs
2. Click the fork button on the top right corner of the Repository.
3. Clone the forked git repository to your computer

    ```
    git clone https://github.com/[YourProfile]/yacs.git
    ```

## 3. Configure Secrets (Optional)

The backend runs with safe defaults out of the box. For local development you can skip this step entirely. If you want to customize the database credentials or session key, copy the example file:

```
cp backend/configs/secrets.yaml.example backend/configs/secrets.yaml
```

Then edit `backend/configs/secrets.yaml` with your values. This file is gitignored — never commit it.

## 4. Setup Docker

Change working directory to yacs
```
cd yacs
```
1. Open Docker Desktop, to make sure the docker engine is running
2. Run the container, which uses our `docker-compose.yml`. Make sure the working directory is in `yacs`.
    ```
    docker compose -p new_yacs up -d
    ```

## 5. Setup Live Frontend
1. Setup Node Version
    * **macOS Users**:
        ```
        source ~/.zshrc   # or ~/.bashrc if using bash
        nvm install 20
        nvm use 20
        ```
    * **Windows Users**:
        ```
        nvm install 20
        nvm use 20
        ```
2. Set working directory to frontend and install npm dependencies.
    ```
    cd frontend
    npm install
    ```
3. Start the live frontend UI, locally hosted on `localhost:3000`
    ```
    npm start
    ```

## Localhost Ports
- Development UI: `http://localhost:3000`
- FastAPI: `http://localhost:8000`
- Postgres: `http://localhost:5432`
- Redis: `redis://localhost:6379`

## Redis
`docker compose up` also starts a Redis container, used for login-attempt throttling and for caching course, department, and semester API responses. You don't need to install anything for it — it's just another service in `docker-compose.yml`.

- **After pulling Redis changes, rebuild:** run `docker compose up --build` so the backend image picks up the new Python dependencies. Without it the backend crashes on startup with `ModuleNotFoundError: No module named 'redis'`.
- **It's optional.** If Redis is unreachable the backend still starts and serves requests: caching turns into straight database reads, and login throttling falls back to a per-process in-memory limiter until Redis comes back. Look for `Redis unavailable` warnings in the backend logs.
- **Connection URL:** resolved from the `REDIS_URL` environment variable, then `REDIS_URL` in `backend/configs/secrets.yaml`, then `redis://localhost:6379/0`. Docker Compose sets the env var to `redis://redis:6379/0` for you; `localhost` only works when running the backend outside Docker.
- **Cache freshness:** course listings are cached for 30 seconds and departments/semesters for 10 minutes. Running the course importer clears the cache automatically.
- **Inspecting or clearing it:**
    ```
    docker compose exec redis redis-cli --scan --pattern 'yacs:*'   # list keys
    docker compose exec redis redis-cli flushdb                    # clear everything
    ```
- **Tests** use `fakeredis`, so `pytest` doesn't need a running Redis.

## Developer Notes
- Remember to stop the YACS docker container when you're done to relieve system resources. Click the red Stop button under Actions in Docker Desktop next to `new_yacs`.