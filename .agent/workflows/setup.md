---
description: How to setup and run the POS system infrastructure and services
---

# Setup and Run POS System

This workflow guides you through setting up and running the complete POS system using Docker.

## Prerequisites Check

Ensure you have:
- Docker Desktop installed and running
- At least 8GB RAM available
- At least 10GB free disk space

## Setup Steps

// turbo-all

1. **Navigate to project directory**
```bash
cd e:\2026\Pos
```

2. **Create environment file**
```bash
copy .env.example .env
```

3. **Start all services**
```bash
docker-compose up -d
```

4. **Wait for services to be healthy (30-60 seconds)**
```bash
docker-compose ps
```

5. **Check backend health**
```bash
curl http://localhost:4000/health
```

6. **View logs to verify everything is running**
```bash
docker-compose logs -f
```

## Access Points

After successful startup:

- Dashboard: http://localhost:3000
- Backend API: http://localhost:4000
- RabbitMQ Management: http://localhost:15672 (guest/guest)

## Common Issues

**Port conflicts**: Edit `.env` and change `BACKEND_PORT` or `DASHBOARD_PORT`

**Database not ready**: Wait 30 seconds and check `docker-compose logs postgres`

**Services not starting**: Run `docker-compose down -v` then `docker-compose up -d --build`

## Stopping Services

```bash
docker-compose down
```

## Full Reset (deletes all data)

```bash
docker-compose down -v
docker-compose up -d --build
```
