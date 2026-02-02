# POS System - Docker Development Setup

This guide will help you set up and run the entire POS system using Docker for local development.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (included with Docker Desktop)
- At least 8GB of RAM available for Docker
- At least 10GB of free disk space

## Quick Start

### 1. Clone and Setup Environment

```bash
# Navigate to project directory
cd e:\2026\Pos

# Copy environment file
copy .env.example .env

# (Optional) Edit .env file to customize settings
notepad .env
```

### 2. Start All Services

```bash
# Start all services (infrastructure + applications)
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f dashboard
```

### 3. Access the Application

Once all services are running:

- **Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health

### 4. Access Infrastructure Services

- **PostgreSQL**: `localhost:5432`
  - Database: `pos_db`
  - User: `pos_user`
  - Password: `pos_password`
  
- **MongoDB**: `localhost:27017`
  - User: `admin`
  - Password: `admin_password`

- **Redis**: `localhost:6379`

- **Kafka**: `localhost:9092`

- **RabbitMQ Management UI**: http://localhost:15672
  - User: `guest`
  - Password: `guest`

- **Elasticsearch**: http://localhost:9200

- **ClickHouse HTTP**: http://localhost:8123
- **ClickHouse Native**: `localhost:9000`

## Development Workflow

### Hot Reload

Both the backend and dashboard support hot reload:

- **Backend**: Changes to `backend/src/**` files will automatically restart the server
- **Dashboard**: Changes to `dashboard/src/**` files will trigger Next.js hot reload

### Running Specific Services

```bash
# Start only infrastructure services
docker-compose up -d postgres redis mongodb

# Start only application services (requires infrastructure)
docker-compose up -d backend dashboard

# Start everything
docker-compose up -d
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Rebuilding Services

If you make changes to `package.json` or `Dockerfile`:

```bash
# Rebuild specific service
docker-compose build backend
docker-compose build dashboard

# Rebuild and restart
docker-compose up -d --build backend

# Rebuild all services
docker-compose build
```

### Executing Commands in Containers

```bash
# Access backend container shell
docker-compose exec backend sh

# Access dashboard container shell
docker-compose exec dashboard sh

# Run npm commands
docker-compose exec backend npm install <package-name>
docker-compose exec dashboard npm install <package-name>

# Access PostgreSQL
docker-compose exec postgres psql -U pos_user -d pos_db
```

## Database Management

### Initialize/Reset Database

```bash
# The schema is automatically applied on first startup
# To reset the database:
docker-compose down -v
docker-compose up -d postgres

# Wait for postgres to be ready, then restart backend
docker-compose up -d backend
```

### Run Database Migrations

```bash
# Access postgres container
docker-compose exec postgres psql -U pos_user -d pos_db

# Or run SQL file
docker-compose exec -T postgres psql -U pos_user -d pos_db < backend/database/schema.sql
```

### Backup Database

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U pos_user pos_db > backup.sql

# Restore PostgreSQL
docker-compose exec -T postgres psql -U pos_user -d pos_db < backup.sql
```

## Troubleshooting

### Services Won't Start

```bash
# Check service status
docker-compose ps

# Check logs for errors
docker-compose logs

# Restart specific service
docker-compose restart backend
```

### Port Already in Use

If you get port conflict errors, edit `.env` file:

```env
BACKEND_PORT=4001
DASHBOARD_PORT=3001
```

Then restart:

```bash
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```bash
# Check if postgres is healthy
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres pg_isready -U pos_user
```

### Clear Everything and Start Fresh

```bash
# Stop all containers
docker-compose down

# Remove all volumes (WARNING: deletes all data)
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild and start
docker-compose up -d --build
```

### Performance Issues

If containers are slow:

1. Increase Docker Desktop memory allocation (Settings > Resources)
2. Use named volumes instead of bind mounts for `node_modules`
3. Disable unnecessary services you're not using

## Service Dependencies

The services start in this order:

1. **Infrastructure Layer**:
   - PostgreSQL
   - MongoDB
   - Redis
   - Kafka
   - RabbitMQ
   - Elasticsearch
   - ClickHouse

2. **Application Layer**:
   - Backend (waits for PostgreSQL, Redis, MongoDB, Kafka, RabbitMQ)
   - Dashboard (waits for Backend)

## Environment Variables

Key environment variables in `.env`:

```env
# Database
POSTGRES_DB=pos_db
POSTGRES_USER=pos_user
POSTGRES_PASSWORD=pos_password

# Application
BACKEND_PORT=4000
DASHBOARD_PORT=3000
JWT_SECRET=your-secret-key

# MongoDB
MONGO_USER=admin
MONGO_PASSWORD=admin_password
```

## Production Deployment

⚠️ **This configuration is for development only!**

For production:
- Use proper secrets management
- Enable SSL/TLS
- Use production-grade images
- Implement proper backup strategies
- Configure resource limits
- Use orchestration (Kubernetes, Docker Swarm)
- Enable authentication on all services

## Additional Commands

```bash
# View resource usage
docker stats

# Clean up unused resources
docker system prune -a

# View networks
docker network ls

# View volumes
docker volume ls

# Remove unused volumes
docker volume prune
```

## Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Verify all services are healthy: `docker-compose ps`
3. Check the main project documentation
