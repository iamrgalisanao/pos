# POS System - Development Environment Setup Guide

This guide will walk you through setting up the POS system on a new development machine from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Git** (version 2.30+)
   - Windows: Download from [git-scm.com](https://git-scm.com/)
   - Mac: `brew install git`
   - Linux: `sudo apt-get install git`

2. **Docker Desktop** (version 4.0+)
   - Windows/Mac: Download from [docker.com](https://www.docker.com/products/docker-desktop/)
   - Linux: Install Docker Engine and Docker Compose separately

3. **Node.js** (version 20+) - *Optional, only if running without Docker*
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use nvm: `nvm install 20`

### System Requirements

- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: At least 10GB free
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)

## Step 1: Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/iamrgalisanao/pos.git

# Navigate to the project directory
cd pos
```

## Step 2: Configure Environment Variables

### Main Project Environment

```bash
# Copy the example environment file
copy .env.example .env

# Windows PowerShell
Copy-Item .env.example .env

# Mac/Linux
cp .env.example .env
```

### Edit Environment Variables (Optional)

Open `.env` in your text editor and customize if needed:

```env
# Database
POSTGRES_DB=pos_db
POSTGRES_USER=pos_user
POSTGRES_PASSWORD=pos_password

# Application Ports (change if you have conflicts)
BACKEND_PORT=4000
DASHBOARD_PORT=3000

# Security (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# MongoDB
MONGO_USER=admin
MONGO_PASSWORD=admin_password
```

### Dashboard Environment

```bash
# Navigate to dashboard directory
cd dashboard

# Copy dashboard environment file
copy .env.example .env

# Edit if needed (usually defaults are fine)
# NEXT_PUBLIC_API_URL=http://localhost:4000
# NEXT_PUBLIC_WS_URL=http://localhost:4000

# Return to project root
cd ..
```

## Step 3: Choose Your Development Setup

You have two options for running the project:

### Option A: Docker Setup (Recommended)

This is the easiest and most consistent way to run the project.

#### 3A.1: Verify Docker is Running

```bash
# Check Docker is installed and running
docker --version
docker-compose --version

# Start Docker Desktop if not running
```

#### 3A.2: Start All Services

```bash
# Start all infrastructure and application services
docker-compose up -d

# View logs to monitor startup
docker-compose logs -f
```

#### 3A.3: Wait for Services to Initialize

The first startup takes 2-5 minutes as Docker downloads images and initializes databases.

```bash
# Check service health
docker-compose ps

# All services should show "Up" or "healthy"
```

#### 3A.4: Verify Everything is Running

```bash
# Check backend health
curl http://localhost:4000/health

# Or open in browser
# http://localhost:4000/health
```

**Access Points:**
- Dashboard: http://localhost:3000
- Backend API: http://localhost:4000
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- Elasticsearch: http://localhost:9200

### Option B: Local Development (Without Docker)

If you prefer to run services locally without Docker:

#### 3B.1: Install PostgreSQL

**Windows:**
```bash
# Download and install from postgresql.org
# Or use Chocolatey
choco install postgresql
```

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

#### 3B.2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE pos_db;
CREATE USER pos_user WITH PASSWORD 'pos_password';
GRANT ALL PRIVILEGES ON DATABASE pos_db TO pos_user;
\q
```

#### 3B.3: Initialize Database Schema

```bash
# Run schema initialization
psql -U pos_user -d pos_db -f backend/database/schema.sql
```

#### 3B.4: Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 3B.5: Install Dashboard Dependencies

Open a new terminal:

```bash
# Navigate to dashboard directory
cd dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

## Step 4: Verify Installation

### Check Backend

```bash
# Test backend health endpoint
curl http://localhost:4000/health

# Expected response:
# {"status":"healthy","database":"connected","timestamp":"..."}
```

### Check Dashboard

Open your browser and navigate to:
- http://localhost:3000

You should see the POS dashboard login page.

### Check Database Connection

```bash
# Using Docker
docker-compose exec postgres psql -U pos_user -d pos_db -c "SELECT 1;"

# Using local PostgreSQL
psql -U pos_user -d pos_db -c "SELECT 1;"
```

## Step 5: Seed Initial Data (Optional)

If you need sample data for development:

```bash
# Run seed script (if available)
cd backend
npm run seed

# Or manually insert test data
psql -U pos_user -d pos_db -f database/seed.sql
```

## Step 6: Create Your First User

### Using the API

```bash
# Create a tenant
curl -X POST http://localhost:4000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "domain": "mystore"
  }'

# Create a staff member (owner)
curl -X POST http://localhost:4000/api/staff \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@mystore.com",
    "role": "owner",
    "tenant_id": "<tenant_id_from_previous_step>"
  }'
```

### Using the Dashboard

1. Navigate to http://localhost:3000
2. Click "Sign Up" or "Create Account"
3. Fill in your business details
4. Complete the onboarding flow

## Common Issues and Solutions

### Port Already in Use

**Problem:** Error: `Port 4000 is already in use`

**Solution:**
```bash
# Option 1: Stop the conflicting service
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:4000 | xargs kill -9

# Option 2: Change port in .env
BACKEND_PORT=4001
DASHBOARD_PORT=3001
```

### Docker Services Won't Start

**Problem:** Services fail to start or show unhealthy

**Solution:**
```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build

# Check logs for specific errors
docker-compose logs postgres
docker-compose logs backend
```

### Database Connection Failed

**Problem:** Backend can't connect to database

**Solution:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection string in .env matches your setup
DATABASE_URL=postgresql://pos_user:pos_password@localhost:5432/pos_db

# For Docker, use service name instead of localhost
DATABASE_URL=postgresql://pos_user:pos_password@postgres:5432/pos_db
```

### Permission Denied (Linux/Mac)

**Problem:** Permission errors when running Docker

**Solution:**
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

### Node Modules Issues

**Problem:** Module not found errors

**Solution:**
```bash
# Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../dashboard
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### Making Changes

1. **Backend Changes:**
   - Edit files in `backend/src/`
   - Server auto-restarts (hot reload enabled)
   - Check logs: `docker-compose logs -f backend`

2. **Dashboard Changes:**
   - Edit files in `dashboard/src/`
   - Browser auto-refreshes (Next.js hot reload)
   - Check logs: `docker-compose logs -f dashboard`

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Dashboard tests
cd dashboard
npm test
```

### Stopping Services

```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove all data
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

## IDE Setup Recommendations

### VS Code

Recommended extensions:
- ESLint
- Prettier
- Docker
- PostgreSQL
- GitLens

### Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Next Steps

1. **Read the Documentation:**
   - [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Detailed Docker documentation
   - [README.md](./README.md) - Project overview
   - [infrastructure/README.md](./infrastructure/README.md) - Infrastructure details

2. **Explore the Codebase:**
   - `backend/src/` - Backend API code
   - `dashboard/src/` - Frontend dashboard code
   - `backend/database/` - Database schemas

3. **Join the Team:**
   - Ask for access to project management tools
   - Review open issues and PRs
   - Attend team meetings

## Getting Help

- **Documentation Issues:** Check the `/Docs` folder
- **Technical Issues:** Create an issue on GitHub
- **Questions:** Ask in team chat or email

## Useful Commands Reference

```bash
# Docker
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose ps                 # Check service status
docker-compose logs -f backend    # View backend logs
docker-compose restart backend    # Restart backend
docker-compose build --no-cache   # Rebuild from scratch

# Git
git pull                          # Update main repo
git submodule update --remote     # Update submodules
git status                        # Check changes

# Database
docker-compose exec postgres psql -U pos_user -d pos_db  # Access DB
docker-compose exec postgres pg_dump -U pos_user pos_db > backup.sql  # Backup

# Node
npm install                       # Install dependencies
npm run dev                       # Start dev server
npm run build                     # Build for production
npm test                          # Run tests
```

---

**Welcome to the team! Happy coding! 🚀**
