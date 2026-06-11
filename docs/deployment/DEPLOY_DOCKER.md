# Deployment Guide: Docker & Compose

This guide outlines the production lifecycle of the application inside Docker containers.

---

## 1. Prerequisite Installations
Confirm both **Docker Desktop / Engine** and **Docker Compose** configurations are active on your target deployment environment:

```bash
docker --version
docker compose version
```

---

## 2. Environment Variables Integration
At the workspace root, copy the database, security keys, and settings configurations from `.env.example` into a production `.env` file:

```bash
cp .env.example .env
# Edit configurations
nano .env
```

Ensure `PORT` remains set to `3000` (internal mapping matches Docker Compose configurations exactly).

---

## 3. Run Container Cluster

Start the container service isolated in daemon background mode:

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

### Command Breakdowns
- `-f docker/docker-compose.yml`: Target the Docker Compose configuration file directly.
- `up -d`: Launch all constituent cluster services and detach standard streams.
- `--build`: Force Docker to recompile local builder stages and compile client static files.

---

## 4. Operational Monitoring Commands

- **Review standard outputs / logs:**
  ```bash
  docker compose -f docker/docker-compose.yml logs -f app
  ```

- **Halt application cluster:**
  ```bash
  docker compose -f docker/docker-compose.yml down
  ```

- **Inspect active socket/port performance:**
  ```bash
  docker compose -f docker/docker-compose.yml ps
  ```
